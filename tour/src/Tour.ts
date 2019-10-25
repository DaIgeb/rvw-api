import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { table } from './config';
import { validate } from './validator';
import { DocumentClient, WriteRequest } from 'aws-sdk/clients/dynamodb';
import { isArray } from 'util';

export type TTour = {
  id: string;
  tour: string;
  date: string;
  points: 15 | 20 | 40 | 80 | 150;
  participants: string[];
  user: string;
  createdAt: string;
  updatedAt: string;
};

export class Tour {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string
  ) {}

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<TTour> => {
    return new Promise<TTour>((res, rej) => {
      const params = {
        TableName: table,
        Key: {
          id
        }
      };

      this._db.get(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the tour item."));
          return;
        }

        const tour = result.Item as TTour;

        res(tour);
      });
    });
  };
  
  public list = (): Promise<TTour[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: table
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the tours."));
        } else {
          res(result.Items as TTour[]);
        }
      });
    });
  };

  public create = (tour: TTour | TTour[]): Promise<TTour | TTour[]> => {
    return new Promise<TTour | TTour[]>((res, rej) => {
      const data = (isArray(tour) ? tour : [tour]).map(item => ({
        ...item,
        id: uuid.v4()
      }));

      const invalid = data.some(r => !validate(r));
      if (invalid) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the tour item."));
        return;
      }

      const timestamp = new Date().getTime();

      if (data.length === 1) {
        const params = {
          TableName: table,
          Item: {
            ...data[0],
            user: this._userEmail,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        };

        this._db.put(params, (error, result) => {
          console.log('Put', error, result);
          if (error) {
            console.error(error);
            rej(new Error("Couldn't create the tour item."));
            return;
          }

          res((params.Item as any) as TTour);
        });
      } else {
        const requests = data.map<WriteRequest>(tour => ({
          PutRequest: {
            Item: {
              ...tour,
              user: this._userEmail,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          }
        } as any));

        const chunks: Promise<TTour[]>[] = [];
        let i = 0;
        const len = requests.length;
        while (i < len) {
          chunks.push(
            new Promise<TTour[]>((res, rej) => {
              const items = requests.slice(i, (i += 25));
              const params: DocumentClient.BatchWriteItemInput = {
                RequestItems: {
                  [table]: items
                }
              };
              this._db.batchWrite(params, (error, result) => {
                console.log('Put', error, result, JSON.stringify(params, null, 2));
                if (error) {
                  rej(new Error("Couldn't create the tour item."));
                  return;
                }
                res(items.map(ri => (ri.PutRequest.Item as TTour)));
              });
            })
          );
        }
        Promise.all(chunks)
          .then(data => res([].concat(...data)))
          .catch(err => rej(err));
      }
    });
  };

  public update = (id: string, tour: TTour): Promise<TTour> => {
    return new Promise<TTour>((res, rej) => {
      const data = {
        ...tour,
        id
      };

      if (!validate(data)) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the tour item."));
        return;
      }

      const timestamp = new Date().getTime();
      const params = {
        TableName: table,
        Item: {
          ...data,
          updateAt: timestamp
        }
      };

      this._db.put(params, (error, _) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't create the tour item."));
          return;
        }

        res(params.Item as TTour);
      });
    });
  };

  public remove = (id: string): Promise<{}> => {
    const params = {
      TableName: table,
      Key: {
        id
      }
    };

    return new Promise<{}>((res, rej) => {
      this._db.delete(params, (err, _) => {
        if (err) {
          rej(err);
        } else {
          res({});
        }
      });
    });
  };
}

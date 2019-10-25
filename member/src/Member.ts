import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { table } from './config';
import { validate } from './validator';
import { DocumentClient, WriteRequest } from 'aws-sdk/clients/dynamodb';
import { isArray } from 'util';

export type TMember = {
  id: string;
  firstName: string;
  lastName: number;
  email: string;
  address?: string;
  zipCode?: number;
  city?: number;
  enlistment?: string;
  gender?: 'female' | 'male' | 'unkown'
  user: string;
  createdAt: string;
  updatedAt: string;
};

export class Member {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string
  ) { }

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<TMember> => {
    return new Promise<TMember>((res, rej) => {
      const params = {
        TableName: table,
        Key: {
          id
        }
      };

      this._db.get(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the member item."));
          return;
        }

        res(result.Item as TMember);
      });
    });
  };
  public list = (): Promise<TMember[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: table
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the members."));
        } else {
          res(result.Items as TMember[]);
        }
      });
    });
  };

  public create = (member: TMember | TMember[]): Promise<TMember | TMember[]> => {
    return new Promise<TMember | TMember[]>((res, rej) => {
      const data = (isArray(member) ? member : [member]).map(item => ({
        ...item,
        id: uuid.v4()
      }));

      const invalid = data.some(r => !validate(r));
      if (invalid) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the member item."));
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
            rej(new Error("Couldn't create the member item."));
            return;
          }

          res((params.Item as any) as TMember);
        });
      } else {
        const requests = data.map<WriteRequest>(member => ({
          PutRequest: {
            Item: {
              ...member,
              user: this._userEmail,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          }
        } as any));

        const chunks: Promise<TMember[]>[] = [];
        let i = 0;
        const len = requests.length;
        while (i < len) {
          chunks.push(
            new Promise<TMember[]>((res, rej) => {
              const items = requests.slice(i, (i += 25));
              const params: DocumentClient.BatchWriteItemInput = {
                RequestItems: {
                  [table]: items
                }
              };
              this._db.batchWrite(params, (error, result) => {
                console.log('Put', error, result, JSON.stringify(params, null, 2));
                if (error) {
                  rej(new Error("Couldn't create the member item."));
                  return;
                }
                res(items.map(ri => (ri.PutRequest.Item as TMember)));
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

  public update = (id: string, member: TMember): Promise<TMember> => {
    return new Promise<TMember>((res, rej) => {
      const data = {
        ...member,
        id
      };

      if (!validate(data)) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the member item."));
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
          rej(new Error("Couldn't create the member item."));
          return;
        }

        res(params.Item as TMember);
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

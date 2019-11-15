import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { table } from './config';
import { DocumentClient, WriteRequest } from 'aws-sdk/clients/dynamodb';
import { isArray } from 'util';

export class DynamoDBConnector<TDetail, TList> {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string,
    private validate: (obj: any) => obj is TDetail,
    private names: { plural: string; singular: string },
    private listAttributes: string[]
  ) { }

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<TDetail> => {
    return new Promise<TDetail>((res, rej) => {
      const params = {
        TableName: table,
        Key: {
          id
        }
      };

      this._db.get(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error(`Couldn't fetch the ${this.names.singular} item.`));
          return;
        }

        res(result.Item as TDetail);
      });
    });
  };
  public list = (): Promise<TList[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: table,
        AttributesToGet: this.listAttributes
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error(`Couldn't fetch the ${this.names.plural}.`));
        } else {
          res(result.Items as TList[]);
        }
      });
    });
  };

  public create = (items: TDetail | TDetail[]): Promise<TDetail | TDetail[]> => {
    return new Promise<TDetail | TDetail[]>((res, rej) => {
      const data = (isArray(items) ? items : [items]).map(item => ({
        ...item,
        id: uuid.v4()
      }));

      const invalid = data.some(r => !this.validate(r));
      if (invalid) {
        console.error('Validation Failed');
        rej(new Error(`Couldn't create the ${this.names.singular}.`));
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
            rej(new Error(`Couldn't create the ${this.names.singular}.`));
            return;
          }

          res((params.Item as any) as TDetail);
        });
      } else {
        const requests = data.map<WriteRequest>(
          item =>
            ({
              PutRequest: {
                Item: {
                  ...item,
                  user: this._userEmail,
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              }
            } as any)
        );

        const chunks: Promise<TDetail[]>[] = [];
        let i = 0;
        const len = requests.length;
        while (i < len) {
          chunks.push(
            new Promise<TDetail[]>((res, rej) => {
              const items = requests.slice(i, (i += 25));
              const params: DocumentClient.BatchWriteItemInput = {
                RequestItems: {
                  [table]: items
                }
              };
              this._db.batchWrite(params, (error, result) => {
                console.log(
                  'Put',
                  error,
                  result,
                  JSON.stringify(params, null, 2)
                );
                if (error) {
                  rej(new Error(`Couldn't create the ${this.names.singular}.`));
                  return;
                }
                res(items.map(ri => (ri.PutRequest.Item as any) as TDetail));
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

  public update = (id: string, item: TDetail): Promise<TDetail> => {
    return new Promise<TDetail>((res, rej) => {
      const data = {
        ...item,
        id
      };

      if (!this.validate(data)) {
        console.error('Validation Failed');
        rej(new Error(`Couldn't create the ${this.names.singular}.`));
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
          rej(new Error(`Couldn't create the ${this.names.singular}.`));
          return;
        }

        res(params.Item as TDetail);
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

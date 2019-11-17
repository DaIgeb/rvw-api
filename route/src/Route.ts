import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { IList, IDetail, validate } from 'rvw-model/lib/route';

import { table } from './config';
import { DocumentClient, WriteRequest, ScanInput } from 'aws-sdk/clients/dynamodb';
import { isArray } from 'util';

export class Route {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string
  ) {}

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<IDetail> => {
    return new Promise<IDetail>((res, rej) => {
      const scanParams: DocumentClient.ScanInput = {
        TableName: table,
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: {
          '#name': 'id'
        },
        ExpressionAttributeValues: {
          ':name': id
        }
      };

      // this._db.get(params, (error, result) => {
      this._db.scan(scanParams, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the route item."));
          return;
        }

        console.log(scanParams, result);
        if (result.Items.length !== 1) {
          rej(new Error('There is no unique item available.'));
          return;
        }

        const route = result.Items[0] as IDetail;

        res(route);
      });
    });
  };
  public list = (): Promise<IList[]> => {
    return new Promise((res, rej) => {
      const params: ScanInput = {
        TableName: table,
        AttributesToGet: [
          'id',
          'name',
          'type'
        ]
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the routes."));
        } else {
          res(result.Items as IList[]);
        }
      });
    });
  };

  public create = (route: IDetail | IDetail[]): Promise<IDetail | IDetail[]> => {
    return new Promise<IDetail | IDetail[]>((res, rej) => {
      const data = (isArray(route) ? route : [route]).map(item => ({
        ...item,
        id: uuid.v4()
      }));

      const invalid = data.some(r => !validate(r, console));
      if (invalid) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the route item."));
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
            rej(new Error("Couldn't create the route item."));
            return;
          }

          res((params.Item as any) as IDetail);
        });
      } else {
        const requests = data.map<WriteRequest>(route => ({
          PutRequest: {
            Item: {
              ...route,
              user: this._userEmail,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          }
        } as any));

        const chunks: Promise<IDetail[]>[] = [];
        let i = 0;
        const len = requests.length;
        while (i < len) {
          chunks.push(
            new Promise<IDetail[]>((res, rej) => {
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
                res(items.map(ri => (ri.PutRequest.Item as any as IDetail)));
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

  public update = (id: string, route: IDetail): Promise<IDetail> => {
    return new Promise<IDetail>((res, rej) => {
      const data = {
        ...route,
        id
      };

      if (!validate(data, console)) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the route item."));
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
          rej(new Error("Couldn't create the route item."));
          return;
        }

        res(params.Item as IDetail);
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

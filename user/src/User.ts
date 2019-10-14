import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { table } from './config';
import { validate } from './validator';
import { DocumentClient, WriteRequests, WriteRequest, PutRequest } from 'aws-sdk/clients/dynamodb';
import { isArray } from 'util';

export type TUser = {
  id: string;
  subject: string;
  firstName: string;
  lastName: string;
  email: string;
  user: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export class User {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string
  ) { }

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<TUser> => {
    return new Promise<TUser>((res, rej) => {
      const scanParams: DocumentClient.ScanInput = {
        TableName: table,
        FilterExpression: '#sub = :sub',
        ExpressionAttributeNames: {
          "#sub": 'subject'
        },
        ExpressionAttributeValues: {
          ':sub': id
        }
      };

      // this._db.get(params, (error, result) => {
      this._db.scan(scanParams, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the tour item."));
          return;
        }

        console.log(scanParams, result);
        if (result.Items.length !== 1) {
          res(undefined);
          return;
        }

        const tour = result.Items[0] as TUser;

        res(tour);
      });
    });
  };

  public list = (): Promise<TUser[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: table
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the tours."));
        } else {
          res(result.Items as TUser[]);
        }
      });
    });
  };

  public create = (data: TUser | TUser[]): Promise<TUser> => {
    return new Promise<TUser>((res, rej) => {
      let invalid = (isArray(data) ? data : [data]).some(user => !validate(user));
      if (invalid) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the tour item."));
        return;
      }

      const timestamp = new Date().getTime();

      if (!isArray(data)) {
        const params = {
          TableName: table,
          Item: {
            ...data,
            id: uuidv4(),
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

          res((params.Item as any) as TUser);
        });
      } else {
        const putRequests: WriteRequests = data.map<WriteRequest>(user => {
          const put: PutRequest = {
            Item: {
              firstName: { S: user.firstName },
              lastName: { S: user.lastName },
              email: { S: user.lastName },
              id: { S: uuidv4() },
              user: { S: this._userEmail },
              createdAt: { N: timestamp.toString() },
              updatedAt: { N: timestamp.toString() }
            }
          };
          const request: WriteRequest = {
            PutRequest: put
          };

          return request;
        });
        const params: DocumentClient.BatchWriteItemInput = {
          RequestItems: {
            [table]: putRequests
          }
        };
        this._db.batchWrite(params, (error, result) => {
          console.log('Put', error, result);
          if (error) {
            console.error(error);
            rej(new Error("Couldn't create the tour item."));
            return;
          }

          res((params.RequestItems[table] as any) as TUser);
        });
      }
    });
  };

  public update = (id: string, tour: TUser): Promise<TUser> => {
    return new Promise<TUser>((res, rej) => {
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

        res(params.Item as TUser);
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

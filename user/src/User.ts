import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { table } from './config';
import { validate } from './validator';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

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
  ) {}

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

  public create = (data: TUser): Promise<TUser> => {
    return new Promise<TUser>((res, rej) => {
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
          id: uuid.v4(),
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

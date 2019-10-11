import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { table } from './config';
import { validate } from './validator';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export type TRoute = {
  id: string;
  name: string;
  distance: number;
  elevation: number;
  user: string;
  createdAt: string;
  updatedAt: string;
};

export class Route {
  constructor(
    private _db: AWS.DynamoDB.DocumentClient,
    private _userEmail: string
  ) {}

  public currentSubject = () => this._userEmail;

  public get = (id: string): Promise<TRoute> => {
    return new Promise<TRoute>((res, rej) => {
      const scanParams: DocumentClient.ScanInput = {
        TableName: table,
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: {
          "#name": 'name'
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
          rej(new Error("There is no unique item available."));
          return;
        }

        const route = result.Items[0] as TRoute;

        res(route);
      });
    });
  };
  public list = (): Promise<TRoute[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: table
      };

      this._db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error("Couldn't fetch the routes."));
        } else {
          res(result.Items as TRoute[]);
        }
      });
    });
  };

  public create = (data: TRoute): Promise<TRoute> => {
    return new Promise<TRoute>((res, rej) => {
      if (!validate(data)) {
        console.error('Validation Failed');
        rej(new Error("Couldn't create the route item."));
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
          rej(new Error("Couldn't create the route item."));
          return;
        }

        res((params.Item as any) as TRoute);
      });
    });
  };

  public update = (id: string, route: TRoute): Promise<TRoute> => {
    return new Promise<TRoute>((res, rej) => {
      const data = {
        ...route,
        id
      };

      if (!validate(data)) {
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

        res(params.Item as TRoute);
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

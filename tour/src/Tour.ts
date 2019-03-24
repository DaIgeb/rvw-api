import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';

import { tourTable } from './config'
import { validate } from './validator'

export type TTour = {
  id: string;
  route: string;
  date: string;
  points: 15 | 20 | 40 | 80 | 150;
  participants: string[];
  user: string;
  createdAt: string;
  updatedAt: string;
};

export class Tour {
  constructor(private db: AWS.DynamoDB.DocumentClient, private userEmail: string) { }

  public get = (id: string): Promise<TTour> => {
    return new Promise<TTour>((res, rej) => {
      const params = {
        TableName: tourTable,
        Key: {
          id
        }
      };

      this.db.get(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error('Couldn\'t fetch the tour item.'));
          return;
        }

        const tour = result.Item as TTour;

        res(tour);
      });
    });
  }
  public list = (): Promise<TTour[]> => {
    return new Promise((res, rej) => {
      const params = {
        TableName: tourTable
      };

      this.db.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          rej(new Error('Couldn\'t fetch the tours.'));
        } else {
          res(result.Items as TTour[]);
        }
      });
    });
  }

  public create = (data: TTour): Promise<TTour> => {
    return new Promise<TTour>((res, rej) => {
      if (!validate(data)) {
        console.error('Validation Failed');
        rej(new Error('Couldn\'t create the tour item.'));
        return;
      }

      const timestamp = new Date().getTime();
      const params = {
        TableName: tourTable,
        Item: {
          ...data,
          id: uuid.v4(),
          user: this.userEmail,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      };

      this.db.put(params, (error, result) => {
        console.log('Put', error, result)
        if (error) {
          console.error(error);
          rej(new Error('Couldn\'t create the tour item.'));
          return;
        }

        res(params.Item as any as TTour);
      });
    });
  }

  public update = (id: string, tour: TTour): Promise<TTour> => {
    return new Promise<TTour>((res, rej) => {
      const data = {
        ...tour,
        id,
      };

      if (!validate(data)) {
        console.error('Validation Failed');
        rej(new Error('Couldn\'t create the tour item.'))
        return;
      }

      const timestamp = new Date().getTime();
      const params = {
        TableName: tourTable,
        Item: {
          ...data,
          updateAt: timestamp
        }
      };

      this.db.put(params, (error, _) => {
        if (error) {
          console.error(error);
          rej(new Error('Couldn\'t create the tour item.'))
          return;
        }

        res(params.Item as TTour);
      });
    });
  }
}
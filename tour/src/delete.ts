'use strict';

import * as AWS from 'aws-sdk';

import { tourTable } from './config'
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponse } from './util';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const remove: APIGatewayProxyHandler = async (event, _) => {
  const params = {
    TableName: tourTable,
    Key: {
      id: event.pathParameters.id
    }
  };

  const deletePromise = new Promise<{}>((res, rej) => {
    dynamoDb.delete(params, (err, _) => {
      if (err) {
        rej(err);
      } else {
        res({});
      }
    })
  })
  try {
    const deleteResponse = await deletePromise;

    return createResponse(200, deleteResponse);
  } catch (err) {
    console.log(err);
    return createResponse(500, 'Couldn\'t delte item');
  }
}

'use strict';

import * as AWS from 'aws-sdk';

import { Tour } from './Tour';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getSub } from './auth';
import { createResponse } from './util';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const apiUrl = 'https://api.aws.daigeb.ch';

export const get: APIGatewayProxyHandler = async (event, context) => {
  console.log(event, context);
  const tour = new Tour(dynamoDb, getSub(event.requestContext.authorizer));

  try {
    const response = await tour.get(event.pathParameters.id);
    return createResponse(200, response);
  } catch (err) {
    console.log(err);
    return createResponse(500, 'Couldn\'t fetch the tour item.');
  }
}

import { DynamoDB } from 'aws-sdk';

import { Tour } from './Tour';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getSub } from './auth';
import { createResponse } from './util';

const dynamoDb = new DynamoDB.DocumentClient();

export const create: APIGatewayProxyHandler = async (event, _) => {
  const tour = new Tour(dynamoDb, getSub(event.requestContext.authorizer));
  try {
    const newTour = await tour.create(JSON.parse(event.body));
    return createResponse(200, newTour);
  } catch (err) {
    return createResponse(500, 'Could not creat tour')
  }
}
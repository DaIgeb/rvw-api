import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { Tour } from './Tour';
import { createResponse } from './util';

const dynamoDb = new DynamoDB.DocumentClient();

export const update: APIGatewayProxyHandler = async (event, _) => {
  const userEmail = event.requestContext.authorizer !== null ? '' + event.requestContext.authorizer.email || '' : '';

  const tour = new Tour(dynamoDb, userEmail);
  try {
    const response = await tour.update(event.pathParameters.id, JSON.parse(event.body));

    return createResponse(200, response);
  } catch (error) {
    console.error(error);

    return createResponse(500, "Failed to update the tour item");
  }
}
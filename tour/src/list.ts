import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { Tour, TTour } from './Tour';
import { createResponse } from './util';
import { getSub } from './auth';

const dynamoDb = new DynamoDB.DocumentClient();

export const list: APIGatewayProxyHandler = async (event, _) => {
  const sub = getSub(event.requestContext.authorizer);
  const tour = new Tour(dynamoDb, sub);
  try {
    const data = await tour.list();

    return createResponse(200, mapTours(data, sub));
  }
  catch (err) {
    return createResponse(500, 'Could not get data')
  }
}

const mapTours = (tours: TTour[], personId: string) => {
  return tours.map((t) => ({
    ...t,
    participants: t.participants.map((p: string, idx) => p !== personId ? idx.toString() : p)
  }))
}

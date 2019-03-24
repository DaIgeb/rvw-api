export { auth } from "./auth";

import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";

import { Tour, TTour } from "./Tour";
import { createResponse } from "./util";
import { getSub } from "./auth";

const dynamoDb = new DynamoDB.DocumentClient();

export const list: APIGatewayProxyHandler = async (event, _) => {
  const tour = initService(event);
  try {
    const data = await tour.list();

    return createResponse(200, hideParticipants(data, tour.currentSubject()));
  } catch (err) {
    console.error(err);
    return createResponse(500, "Could not get data");
  }
};

export const get: APIGatewayProxyHandler = async (event, context) => {
  console.log(event, context);
  const tour = initService(event);

  try {
    const response = await tour.get(event.pathParameters.id);
    return createResponse(200, response);
  } catch (err) {
    console.log(err);
    return createResponse(500, "Couldn't fetch the tour item.");
  }
};

export const create: APIGatewayProxyHandler = async (event, _) => {
  const tour = initService(event);
  try {
    const newTour = await tour.create(JSON.parse(event.body));
    return createResponse(200, newTour);
  } catch (err) {
    console.error(err);
    return createResponse(500, "Could not creat tour");
  }
};

export const update: APIGatewayProxyHandler = async (event, _) => {
  const tour = initService(event);
  try {
    const response = await tour.update(
      event.pathParameters.id,
      JSON.parse(event.body)
    );

    return createResponse(200, response);
  } catch (error) {
    console.error(error);

    return createResponse(500, "Failed to update the tour item");
  }
};

export const remove: APIGatewayProxyHandler = async (event, _) => {
  const tour = initService(event);

  try {
    const deleteResponse = await tour.remove(event.pathParameters.id);

    return createResponse(200, deleteResponse);
  } catch (err) {
    console.log(err);
    return createResponse(500, "Couldn't delete item");
  }
};

const hideParticipants = (tours: TTour[], personId: string) => {
  return tours.map(t => ({
    ...t,
    participants: t.participants.map((p: string, idx) =>
      p !== personId ? idx.toString() : p
    )
  }));
};

const initService = (event: APIGatewayProxyEvent) => {
  const subject = getSub(event.requestContext.authorizer);
  return new Tour(dynamoDb, subject);
};

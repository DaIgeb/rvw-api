export { auth } from "./auth";

import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";

import { Route } from "./Route";
import { createResponse } from "./util";
import { getSub } from "./auth";

const dynamoDb = new DynamoDB.DocumentClient();

export const list: APIGatewayProxyHandler = async (event, _) => {
  const service = initService(event);
  try {
    const data = await service.list();
    console.log(JSON.stringify(data, null, 2));

    return createResponse(200, data);
  } catch (err) {
    console.error(err);
    return createResponse(500, "Could not get data");
  }
};

export const get: APIGatewayProxyHandler = async (event, context) => {
  console.log(event, context);
  const service = initService(event);

  try {
    const response = await service.get(event.pathParameters.id);
    return createResponse(200, response);
  } catch (err) {
    console.log(err);
    return createResponse(500, "Couldn't fetch the route item.");
  }
};

export const create: APIGatewayProxyHandler = async (event, _) => {
  const service = initService(event);
  try {
    const newObject = await service.create(JSON.parse(event.body));
    return createResponse(200, newObject);
  } catch (err) {
    console.error(err);
    return createResponse(500, "Could not creat route");
  }
};

export const update: APIGatewayProxyHandler = async (event, _) => {
  const service = initService(event);
  try {
    const response = await service.update(
      event.pathParameters.id,
      JSON.parse(event.body)
    );

    return createResponse(200, response);
  } catch (error) {
    console.error(error);

    return createResponse(500, "Failed to update the route item");
  }
};

export const remove: APIGatewayProxyHandler = async (event, _) => {
  const service = initService(event);

  try {
    const deleteResponse = await service.remove(event.pathParameters.id);

    return createResponse(200, deleteResponse);
  } catch (err) {
    console.log(err);
    return createResponse(500, "Couldn't delete item");
  }
};

const initService = (event: APIGatewayProxyEvent) => {
  const subject = event.requestContext.authorizer ? getSub(event.requestContext.authorizer) : 'anonymous';
  return new Route(dynamoDb, subject);
};

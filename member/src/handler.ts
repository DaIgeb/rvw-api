export { auth } from './auth';

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';

import { DynamoDBConnector } from './DynamoDBConnector';
import { getSub } from './auth';
import { Model, names } from './model';
import { validate } from './validator';

type TAction<TResponse> = (
  service: DynamoDBConnector<Model>
) => Promise<TResponse>;

interface HttpResponse {
  statusCode: number;
  headers: { [index: string]: string };
  body: string;
}

function isSuccess<TResponse>(obj: any): obj is { success: TResponse } {
  if (obj.success) {
    return true;
  }

  return false;
}

export const list: APIGatewayProxyHandler = async (event, _) => {
  const data = await handleRequest(event, s => s.list());

  if (isSuccess(data)) {
    return createResponse(200, data.success);
  }

  return data.failure;
};

export const get: APIGatewayProxyHandler = async (event, _) => {
  const data = await handleRequest(event, s =>
    s.get(decodeURIComponent(event.pathParameters.id))
  );

  if (isSuccess(data)) {
    if (data.success) {
      return createResponse(200, data.success);
    }

    return createResponse(404, undefined);
  }

  return data.failure;
};

export const create: APIGatewayProxyHandler = async (event, _) => {
  const data = await handleRequest(event, s =>
    s.create(JSON.parse(event.body))
  );

  if (isSuccess(data)) {
    return createResponse(200, data.success);
  }

  return data.failure;
};

export const update: APIGatewayProxyHandler = async (event, _) => {
  const data = await handleRequest(event, s =>
    s.update(event.pathParameters.id, JSON.parse(event.body))
  );

  if (isSuccess(data)) {
    return createResponse(200, data.success);
  }

  return data.failure;
};

export const remove: APIGatewayProxyHandler = async (event, _) => {
  const data = await handleRequest(event, s =>
    s.remove(event.pathParameters.id)
  );

  if (isSuccess(data)) {
    return createResponse(200, data.success);
  }

  return data.failure;
};

function initService(event: APIGatewayProxyEvent) {
  const subject = event.requestContext.authorizer
    ? getSub(event.requestContext.authorizer)
    : 'anonymous';

  const dynamoDb = new DynamoDB.DocumentClient();

  return new DynamoDBConnector<Model>(dynamoDb, subject, validate, names);
}

function createResponse(statusCode: number, content: any): HttpResponse {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(content)
  };
}

async function handleRequest<TResponse>(
  event: APIGatewayProxyEvent,
  action: TAction<TResponse>
): Promise<{ success: TResponse } | { failure: HttpResponse }> {
  const service = initService(event);
  try {
    const data = await action(service);
    console.log(JSON.stringify(data, null, 2));

    return { success: data };
  } catch (err) {
    console.error(err);
    return {
      failure: createResponse(
        500,
        `Could not execute ${event.httpMethod} on ${event.path}`
      )
    };
  }
}

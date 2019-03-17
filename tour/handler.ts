import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

import { authorizer } from './lib/auth';

export const hello: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }),
  };
}

export const helloP: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully! secures',
      input: event,
    }),
  };
}

export const auth = authorizer;
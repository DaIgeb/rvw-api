import * as AWS from 'aws-sdk';
import { bucket } from './config';
import { APIGatewayProxyHandler } from 'aws-lambda';
export { auth } from './auth';

export const requestUploadURL: APIGatewayProxyHandler = (event, _, callback) => {

  // Create new S3 instance to handle our request for a new upload URL.
  const s3 = new AWS.S3();

  // Parse out the parameters of the file the client would like to upload.
  const params = JSON.parse(event.body);

  // Assemble a dictionary of parameters to hand to S3: the S3 bucket name, the file name, the file type, and permissions.  Other paramters like expiration can be specified here.  See the documentation for this method for more details.
  const s3Params = {
    Bucket: bucket,
    Key: params.name,
    ContentType: params.type,
    ACL: 'public-read',
    
  };

  // Ask S3 for a temporary URL that the client can use.
  const uploadURL = s3.getSignedUrl('putObject', s3Params);

  // Return success message to the client, with the upload URL in the payload.
  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ uploadURL: uploadURL }),
  })
}
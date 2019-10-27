import {
  CustomAuthorizerHandler,
  CustomAuthorizerResult,
  AuthResponseContext
} from "aws-lambda";
import * as jwt from "jsonwebtoken";
import * as jwksClient from "jwks-rsa";
import { RsaSigningKey } from 'jwks-rsa';

const auth0Domain = process.env.AUTH0_DOMAIN;
const authClient = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
});

const opts: jwt.VerifyOptions = {
  audience: [
    process.env.AUTH0_API_AUDIENCE,
    `https://${auth0Domain}/userinfo`
  ],
  issuer: `https://${auth0Domain}/`,
  algorithms: ["RS256"]
};

export const getSub = (context: AuthResponseContext): string => {
  return context.sub as string;
};

export const auth: CustomAuthorizerHandler = (event, _, callback) => {
  if (!event.authorizationToken) {
    console.log("event.authorizationToken missing");
    return callback("Unauthorized");
  }

  const authToken = event.authorizationToken.substring(7); // remove "bearer " word from token
  if (!authToken) {
    console.log("401 Unauthorized no jwt token");
    return callback("Unauthorized");
  }

  // Validate Token is not malformed. AKA fail fail
  let decodedToken;
  try {
    decodedToken = jwt.decode(authToken, { complete: true });
  } catch (err) {
    console.log("jwt token malformed", err);
    return callback("Unauthorized");
  }

  // if token empty
  if (!decodedToken) {
    console.log("null token on user exit");
    return callback("Unauthorized");
  }

  // Get Signing key from auth0
  const kid = decodedToken.header.kid;
  getSigningKey(kid)
    .then(signingKey => {
      try {
        verifyToken(authToken, signingKey, event.methodArn)
          .then(policy => callback(null, policy))
          .catch(err => {
            console.log("jwt.verify", err);
            callback("Unauthorized");
          });
      } catch (err) {
        console.log("jwt.verify exception", err);
        return callback("Unauthorized");
      }
    })
    .catch(err => {
      console.log('Failed to get signing key',err);
      callback("Unauthorized");
    });
};

const isRsaKey = (obj: any): obj is RsaSigningKey => {
  if ((obj as RsaSigningKey).rsaPublicKey) {
    return true;
  }

  return false;
}

const getSigningKey = (kid: string): Promise<string> => {
  return new Promise((res, rej) => {
    authClient.getSigningKey(kid, (signError, key) => {
      if (signError) {
        console.log("signing key error", signError);
        return rej(signError);
      }

      const signingKey = isRsaKey(key) ? key.rsaPublicKey : key.publicKey;
      res(signingKey);
    });
  });
};

const verifyToken = (
  authToken: string,
  signingKey: string,
  methodArn: string
): Promise<CustomAuthorizerResult> => {
  return new Promise((res, rej) => {
    jwt.verify(authToken, signingKey, opts, (verifyError, decoded) => {
      if (verifyError) {
        console.log("Token signature NOT VERIFIED", verifyError);
        return rej("Unauthorized");
      }

      // output for logs
      console.log("------------------");
      console.log("decoded jwt token");
      console.log(decoded);
      console.log("------------------");

      /* if you want to allow only verified emails use this */
      // if (!decoded.email_verified) {
      //   console.log('User has not verified email yet', decoded)
      //   return callback(verifyError)
      // }

      /* Does role match? */
      const roles = decoded[`https://${auth0Domain}/roles`];
      if (!roles || !roles.length || !roles.includes("forms-app-admin")) {
        console.log(`User ${decoded["sub"]} is not an admin`);
        console.log(`User ${decoded["sub"]} current roles:`, roles);
        // return callback('Unauthorized')
      }

      // Generate IAM policy to access function
      const IAMPolicy = generatePolicy(decoded["sub"], "Allow", methodArn);
      console.log("IAMPolicy:");
      console.log(JSON.stringify(IAMPolicy, null, 2));
      console.log("------------------");
      // Return the policy
      return res(IAMPolicy);
    });
  });
};

const generatePolicy = (
  principalId,
  effect,
  resource
): CustomAuthorizerResult => {
  let authResponsr = {
    principalId: undefined,
    policyDocument: undefined,
    context: undefined
  };

  // set User ID
  authResponsr.principalId = principalId;

  // Add Allow/Deny IAM Statements
  if (effect && resource) {
    const statementOne = {
      Action: "execute-api:Invoke",
      Effect: effect,
      Resource: "*"
    };

    const policyDocument = {
      Version: "2012-10-17",
      Statement: [statementOne]
    };

    authResponsr.policyDocument = policyDocument;
  }
  // optionally add additional context for next function to consume
  authResponsr.context = {
    stringKey: "stringval",
    numberKey: 123,
    booleanKey: true,
    sub: principalId
  };

  return authResponsr;
};

import * as Ajv from 'ajv';
import { TUser } from './User';

const schema = {
  "properties": {
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "email": { "type": "string" },
    "subject": { "type": "string" },
    "roles": {
      "type": "array",
      "items": {
        "type": "string" 
      }
    }
  },
  "required": ["firstName", "lastName"],
  "additionalProperties": false
};

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const validator = ajv.compile(schema);

export const validate = (obj: any): obj is TUser => {
  var valid = validator(obj);
  if (!valid) {
    console.error(validator.errors);

    return false;
  }

  return true;
}

import * as Ajv from 'ajv';
import { TMember } from './Member';

const schema = {
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
  },
  "required": ["firstName", "lastName"],
  "additionalProperties": false
};

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const validator = ajv.compile(schema);

export const validate = (obj: any): obj is TMember => {
  var valid = validator(obj);
  if (!valid) {
    console.error(validator.errors);

    return false;
  }

  return true;
}

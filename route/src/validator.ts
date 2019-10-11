import * as Ajv from 'ajv';
import { TRoute } from './Route';

const schema = {
  "properties": {
    "name": { "type": "string" },
    "distance": { "type": "number" },
    "elevation": { "type": "number" }
  },
  "required": ["name", "distance", "elevation"],
  "additionalProperties": false
};

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
const validator = ajv.compile(schema);

export const validate = (obj: any): obj is TRoute => {
  var valid = validator(obj);
  if (!valid) {
    console.error(validator.errors);

    return false;
  }

  return true;
}

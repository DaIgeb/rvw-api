import * as Ajv from 'ajv';
import { TTour } from './Tour';

const schema = {
  "properties": {
    "route": { "type": "string", "format": "uuid" },
    "date": { "type": "string", "format": "date" },
    "points": { "enum": [15, 20, 40, 80, 150] },
    "participants": {
      "type": "array",
      "items": {
        "title": "Participant",
        "description": "Participant connection schema",
        "type": "string"
      }
    }
  },
  "required": ["route", "points", "date"],
  "additionalProperties": false
};

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
var validator = ajv.compile(schema);

export const validate = (obj: any): obj is TTour => {
  var valid = validator(obj);
  if (!valid) {
    console.error(validator.errors);

    return false;
  }


  return true;
}

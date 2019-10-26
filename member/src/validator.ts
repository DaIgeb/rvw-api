import * as Ajv from 'ajv';
import { schema, Model } from './model';

const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
export const validator = ajv.compile(schema);

export function validate(obj: any): obj is Model {
  var valid = validator(obj);
  if (!valid) {
    console.error(validator.errors);

    return false;
  }

  return true;
}

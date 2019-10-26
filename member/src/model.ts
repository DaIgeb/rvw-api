export const names = {
  plural: 'members',
  singular: 'member'
}

export interface Model {
  id: string;
  firstName: string;
  lastName: number;
  email: string;
  address?: string;
  zipCode?: number;
  city?: number;
  enlistment?: string;
  gender?: 'female' | 'male' | 'unknown'
  user: string;
  createdAt: string;
  updatedAt: string;
};

export const schema = {
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "address": { "type": "string" },
    "zipCode": { "type": "number" },
    "city": { "type": "string" },
    "enlistment": { "type": "string", "format": "date" },
    "gender": { "type": "string", "enum": ["female", "male", "unknown"] },
  },
  "required": ["firstName", "lastName"],
  "additionalProperties": false
};

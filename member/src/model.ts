export const names = {
  plural: 'members',
  singular: 'member'
};

export interface Model {
  id: string;
  firstName: string;
  lastName: number;
  email: string;
  address?: string;
  zipCode?: string;
  city?: string;
  membership?: {
    from: string;
    to?: string;
  }[];
  withdrawal?: string;
  gender?: 'female' | 'male' | 'unknown';
  user: string;
  createdAt: string;
  updatedAt: string;
}

export const schema = {
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "address": { "type": "string" },
    "zipCode": { "type": "string" },
    "city": { "type": "string" },
    "membership": {
      "type": "array",
      "items": {
        "title": "Participant",
        "description": "Participant connection schema",
        "type": "object",
        "properties": {
          "from": { "type": "string", "format": "date" },
          "to": { "type": "string", "format": "date" }                
        },
        "required": ["from"],
        "additionalProperties": false
      }
    },
    "gender": { "type": "string", "enum": ["female", "male", "unknown"] },
  },
  "required": ["firstName", "lastName", "membership"],
  "additionalProperties": false
};

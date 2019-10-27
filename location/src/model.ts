export const names = {
  plural: 'locations',
  singular: 'location'
};
type Position = {
  type: 'position';
}
type Restaurant = {
  type: 'restaurant';
  timelines: {
    from: string;
    until?: string;
    notes?: string;
    phone?: string;
    businessHours: {
      from: string;
      until: string;
      weekday:
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday'
        | 'Sunday';
    }[];
  }[];
}

export type Model = {
  id: string;
  name: string;
  street?: number;
  country?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  longitude: number;
  latitude: number;
  user: string;
  createdAt: string;
  updatedAt: string;
} & (Restaurant | Position);

export const schema = {
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    street: { type: 'string' },
    country: { type: 'string' },
    zipCode: { type: 'string' },
    city: { type: 'string' },
    longitude: { type: 'number' },
    latitude: { type: 'number' },
    type: { type: 'string', enum: ['position', 'restaurant'] },
    timelines: {
      type: 'array',
      minItems: 1,
      items: {
        title: 'Timelines',
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          until: { type: 'string', format: 'date' },
          notes: { type: 'string' },
          phone: { type: 'string' },
          businessHours: {
            type: 'array',
            minItems: 1,
            items: {
              title: 'BusinessHours',
              type: 'object',
              properties: {
                weekday: {
                  type: 'string',
                  enum: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                  ]
                },
                from: { type: 'string', format: 'time' },
                until: { type: 'string', format: 'time' }
              },
              required: ['weekday', 'from'],
              additionalProperties: false
            }
          }
        },
        required: ['businessHours', 'from', 'until'],
        additionalProperties: false
      }
    }
  },
  if: {
    properties: {
      type: { enum: ['position'] }
    }
  },
  then: {
    required: ['name', 'longitude', 'latitude']
  },
  else: {
    required: ['name', 'longitude', 'latitude', 'timelines']
  },
  additionalProperties: false
};

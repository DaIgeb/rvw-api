import { validate, Model } from 'rvw-model/lib/location';

const obj = {
  name: 'Test',
  longitude: 2.5123,
  latitude: 76.123,
  type: 'restaurant',
  timelines: [
    {
      from: '2019-01-01',
      until: '2019-12-31',
      businessHours: [
        {
          weekday: 'Saturday',
          from: '12:00:00',
          until: '23:59:00'
        }
      ]
    }
  ]
};
const result = validate(obj);
if (result) {
  const model = obj as Model;
  switch (model.type) {
    case 'restaurant': {
      console.log(model.timelines);
      break;
    }
    case 'position': {
      console.log(model.country);
      break;
    }
  }
}
console.log(result);

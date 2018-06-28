import { OC } from './OCContext';

export function data(context: OC.Context, callback: (error: any, data: any) => void){
  let name = context.params.name;
  return callback(null, {
    name: name
  });
}

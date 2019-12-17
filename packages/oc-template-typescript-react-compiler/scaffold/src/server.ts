import * as OC from "./OCContext";
import { AdditionalData } from "./AdditionalData";

export function data(
  context: OC.Context,
  callback: (error: any, data: any) => void
) {
  let name = context.params.name;
  let shouldGetMoreData = context.params.getMoreData;

  if (shouldGetMoreData) {
    return callback(null, {
      Age: 15,
      HairColour: "Orange"
    } as AdditionalData);
  }

  return callback(null, {
    name: name
  });
}

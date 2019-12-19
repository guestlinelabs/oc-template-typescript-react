import * as OC from "./OCContext";

export const data = (context: OC.Context, callback: (error: any, data: any) => void) => {
  const { name } = context.params;
  return callback(null, { name });
};

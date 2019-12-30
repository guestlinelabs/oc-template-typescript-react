export const data = (context: any, callback: (error: any, data: any) => void) => {
  const { name } = context.params;
  return callback(null, { name });
};

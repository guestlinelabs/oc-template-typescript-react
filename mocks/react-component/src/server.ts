export const data = (context: any, callback: (error: any, data: any) => void) => {
  const { name } = context.params;
  return callback(null, { name });
};

export async function fooAsync() {
  return await barAsync();
}

async function barAsync() {
  return 0;
}

const obj = { 
  a: 'a'
};

const spread = {
  ...obj
};
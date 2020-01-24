import React from "react";

const app = () => <div>Hello {fooAsync} {spread}</div>;

export default app;

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
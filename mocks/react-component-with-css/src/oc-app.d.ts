declare module "*.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.sass" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare var oc: {
  events: {
    on: (eventName: string, fn: (...data: any[]) => void) => void;
    fire: (eventName: string, data?: any) => void;
  };
};


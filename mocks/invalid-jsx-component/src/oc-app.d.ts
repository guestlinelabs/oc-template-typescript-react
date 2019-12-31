/// <reference types="oc-template-typescript-react-compiler" />

/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

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

export interface AcceptLanguage {
  code: string;
  script?: any;
  region: string;
  quality: number;
}

export interface Env {
  name: string;
}

export interface Plugins {}

export interface RequestHeaders {
  host: string;
  connection: string;
  accept: string;
  "user-agent": string;
  "content-type": string;
  referer: string;
  "accept-encoding": string;
  "accept-language": string;
}

export interface External {
  global: string;
  url: string;
  name: string;
}

export interface Template {
  type: string;
  version: string;
  externals: External[];
}

export interface Context {
  acceptLanguage: AcceptLanguage[];
  baseUrl: string;
  env: Env;
  params: any;
  plugins: Plugins;
  requestHeaders: RequestHeaders;
  staticPath: string;
  templates: Template[];
}

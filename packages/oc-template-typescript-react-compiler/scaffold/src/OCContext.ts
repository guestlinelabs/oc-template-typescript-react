interface Params {
  __oc_Retry: string;
  name: string;
  getMoreData: boolean;
}

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
  params: Params;
  plugins: Plugins;
  requestHeaders: RequestHeaders;
  staticPath: string;
  templates: Template[];
}

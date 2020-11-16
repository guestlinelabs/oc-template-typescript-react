declare module 'oc-generic-template-renderer' {
  type External = {
    global: string | string[];
    url: string;
  };
  type PackageJson = {
    name: string;
    version: string;
    externals?: Record<string, External>;
  };

  export function getInfo(
    json: PackageJson
  ): { type: string; version: string; externals: Array<External & { name: string }> };
  export var getCompiledTemplate: any;
  export var render: any;
}

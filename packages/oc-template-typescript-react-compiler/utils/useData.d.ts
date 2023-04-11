/// <reference types="react" />
type PromiseData<T = any> = T & {
    getData<O = any>(parameters?: Partial<T>): Promise<O>;
    getSetting(setting: 'name' | 'version' | 'baseUrl' | 'staticPath'): string;
};
export declare const DataProvider: ({ children, ...props }: any) => JSX.Element;
export declare function useData<T = any>(): PromiseData<T>;
export {};

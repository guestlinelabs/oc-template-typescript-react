type Callback<T> = (error: Error | null, data: T) => void;

export interface OcParameters {
  userId: number;
  getMoreData?: boolean;
}

export interface ClientProps {
  userId: number;
  firstName: string;
  lastName: string;
}

export interface AdditionalData {
  hobbies: string[];
  age: number;
}

export interface GetData {
  (input: OcParameters & { getMoreData: true }, callback: Callback<AdditionalData>): void;
  (input: { getMoreData?: false }, callback: Callback<ClientProps>): void;
}

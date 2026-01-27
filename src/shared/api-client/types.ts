export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type CustomError = Error & {
  status?: number;
  response?: Response;
  url?: string;
};

export interface ApiFetcherConfig {
  prefix: string;
  onUnauthorized?: (error: CustomError) => void | Promise<void>;
  refreshTokenFn?: () => Promise<string | null>;
  shouldRefreshToken?: (error: CustomError) => boolean;
  getAccessToken?: () => Promise<string | undefined>;
  getRefreshToken?: () => Promise<string | undefined>;
  setAccessToken?: (token: string) => Promise<void>;
  setRefreshToken?: (token: string) => Promise<void>;
}

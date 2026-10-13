import type { ApiFetcherConfig, CustomError } from './types';
import { RefreshHandler } from './refresh-handler';
import { TokenManager } from './token-manager';

/**
 * Main API Fetcher class for making HTTP requests with automatic token management
 */
export class ApiFetcher {
  private prefix: string;
  private tokenManager: TokenManager;
  private refreshHandler: RefreshHandler;
  private onUnauthorized?: (error: CustomError) => void | Promise<void>;
  private refreshTokenFn?: () => Promise<string | null>;
  private shouldRefreshToken?: (error: CustomError) => boolean;

  constructor(config: ApiFetcherConfig | string) {
    if (typeof config === 'string') {
      this.prefix = config;
      this.tokenManager = new TokenManager();
      this.refreshHandler = new RefreshHandler(
        undefined,
        this.tokenManager.setAccessToken.bind(this.tokenManager),
      );
    } else {
      this.prefix = config.prefix;
      this.onUnauthorized = config.onUnauthorized;
      this.refreshTokenFn = config.refreshTokenFn;
      this.shouldRefreshToken = config.shouldRefreshToken;

      this.tokenManager = new TokenManager(
        config.getAccessToken,
        config.getRefreshToken,
        config.setAccessToken,
        config.setRefreshToken,
      );

      this.refreshHandler = new RefreshHandler(
        config.refreshTokenFn,
        this.tokenManager.setAccessToken.bind(this.tokenManager),
      );
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    retryCount = 0,
  ): Promise<T> {
    const url = `${this.prefix}${endpoint}`;
    const accessToken = await this.tokenManager.getAccessToken();

    const headers = new Headers(options.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {}

      const error: CustomError = new Error(errorMessage);
      error.status = response.status;
      error.response = response;
      error.url = url;

      if (response.status === 401) {
        const shouldRefresh = this.shouldRefreshToken
          ? this.shouldRefreshToken(error)
          : true;

        const canRefresh
          = shouldRefresh
            && retryCount === 0
            && this.refreshTokenFn;

        if (canRefresh) {
          try {
            const newToken = await this.refreshHandler.handleRefreshToken();

            if (newToken) {
              return this.request<T>(endpoint, options, retryCount + 1);
            }
          } catch {
            await this.refreshHandler.handleUnauthorized(
              error,
              this.onUnauthorized,
            );
            throw error;
          }
        }

        await this.refreshHandler.handleUnauthorized(
          error,
          this.onUnauthorized,
        );
      }

      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data: T = await response.json();
      return data;
    } else {
      return response as unknown as T;
    }
  }

  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  private send<T>(method: string, endpoint: string, body: unknown, options: RequestInit): Promise<T> {
    const headers = new Headers(options.headers);
    const isFormData = body instanceof FormData;
    if (isFormData) {
      headers.delete('Content-Type');
    } else if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return this.request<T>(endpoint, {
      ...options,
      method,
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public post<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.send<T>('POST', endpoint, body, options);
  }

  public put<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.send<T>('PUT', endpoint, body, options);
  }

  public patch<T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> {
    return this.send<T>('PATCH', endpoint, body, options);
  }

  public async delete<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

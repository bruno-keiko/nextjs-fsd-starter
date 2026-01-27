/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiFetcherConfig, CustomError } from './types';
import { TokenManager } from './token-manager';
import { RefreshHandler } from './refresh-handler';

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
        this.tokenManager.setAccessToken.bind(this.tokenManager)
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
        config.setRefreshToken
      );

      this.refreshHandler = new RefreshHandler(
        config.refreshTokenFn,
        this.tokenManager.setAccessToken.bind(this.tokenManager)
      );
    }
  }

  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.prefix}${endpoint}`;
    const accessToken = await this.tokenManager.getAccessToken();

    // Get organization ID from storage (client-side only)
    let organizationId: string | undefined;
    if (!this.isServer()) {
      try {
        const storage = localStorage.getItem('organization-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          organizationId = parsed?.state?.selectedOrganizationId;
        }
      } catch {
        // Ignore errors
      }
    }

    const headers: HeadersInit = {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
    };

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

        // Only attempt refresh on client-side
        const canRefresh =
          !this.isServer() &&
          shouldRefresh &&
          retryCount === 0 &&
          this.refreshTokenFn;

        if (canRefresh) {
          try {
            const newToken = await this.refreshHandler.handleRefreshToken();

            if (newToken) {
              return this.request<T>(endpoint, options, retryCount + 1);
            }
          } catch {
            await this.refreshHandler.handleUnauthorized(
              error,
              this.onUnauthorized
            );
            throw error;
          }
        }

        await this.refreshHandler.handleUnauthorized(
          error,
          this.onUnauthorized
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

  public async post<T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: isFormData
        ? { ...options.headers }
        : { 'Content-Type': 'application/json', ...options.headers },
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public async put<T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: isFormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public async patch<T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    const headers = isFormData
      ? (() => {
          const { 'Content-Type': _, ...restHeaders } =
            (options.headers as Record<string, string>) || {};
          return restHeaders;
        })()
      : { 'Content-Type': 'application/json', ...options.headers };

    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public async delete<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

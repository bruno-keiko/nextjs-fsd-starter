/* eslint-disable @typescript-eslint/no-require-imports */
import { CustomError } from './types';

/**
 * Handles token refresh logic with queue management
 */
export class RefreshHandler {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string | null) => void> = [];
  private refreshTokenFn?: () => Promise<string | null>;
  private setAccessTokenFn: (token: string) => Promise<void>;

  constructor(
    refreshTokenFn: (() => Promise<string | null>) | undefined,
    setAccessTokenFn: (token: string) => Promise<void>
  ) {
    this.refreshTokenFn = refreshTokenFn;
    this.setAccessTokenFn = setAccessTokenFn;
  }

  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  async handleRefreshToken(): Promise<string | null> {
    // Skip refresh on server-side
    if (this.isServer()) {
      return null;
    }

    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      if (!this.refreshTokenFn) {
        return null;
      }

      const newToken = await this.refreshTokenFn();

      if (newToken) {
        await this.setAccessTokenFn(newToken);
      }

      this.refreshQueue.forEach(resolve => resolve(newToken));
      this.refreshQueue = [];

      return newToken;
    } catch {
      this.refreshQueue.forEach(resolve => resolve(null));
      this.refreshQueue = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  async handleUnauthorized(
    error: CustomError,
    onUnauthorized?: (error: CustomError) => void | Promise<void>
  ): Promise<void> {
    if (onUnauthorized) {
      await onUnauthorized(error);
      return;
    }

    // Default behavior
    if (this.isServer()) {
      // On server, we need to use redirect from next/navigation
      try {
        const { redirect } = require('next/navigation');
        redirect('/auth');
      } catch {
        // If redirect fails (e.g., not in a server component), throw the error
        throw error;
      }
    } else {
      window.location.href = '/auth';
    }
  }
}

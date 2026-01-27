/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Token management utilities for both client and server environments
 */
export class TokenManager {
  private getAccessTokenFn?: () => Promise<string | undefined>;
  private getRefreshTokenFn?: () => Promise<string | undefined>;
  private setAccessTokenFn?: (token: string) => Promise<void>;
  private setRefreshTokenFn?: (token: string) => Promise<void>;

  constructor(
    getAccessToken?: () => Promise<string | undefined>,
    getRefreshToken?: () => Promise<string | undefined>,
    setAccessToken?: (token: string) => Promise<void>,
    setRefreshToken?: (token: string) => Promise<void>
  ) {
    this.getAccessTokenFn = getAccessToken;
    this.getRefreshTokenFn = getRefreshToken;
    this.setAccessTokenFn = setAccessToken;
    this.setRefreshTokenFn = setRefreshToken;
  }

  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  async getAccessToken(): Promise<string | undefined> {
    if (this.getAccessTokenFn) {
      return this.getAccessTokenFn();
    }

    if (this.isServer()) {
      try {
        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        return cookieStore.get('accessToken')?.value;
      } catch (error) {
        console.error('Error getting server-side access token:', error);
        return undefined;
      }
    } else {
      try {
        const Cookies = (await import('js-cookie')).default;
        return Cookies.get('accessToken');
      } catch (error) {
        console.error('Error getting client-side access token:', error);
        return undefined;
      }
    }
  }

  async getRefreshToken(): Promise<string | undefined> {
    if (this.getRefreshTokenFn) {
      return this.getRefreshTokenFn();
    }

    if (this.isServer()) {
      try {
        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        return cookieStore.get('refreshToken')?.value;
      } catch (error) {
        console.error('Error getting server-side refresh token:', error);
        return undefined;
      }
    } else {
      try {
        const Cookies = (await import('js-cookie')).default;
        return Cookies.get('refreshToken');
      } catch (error) {
        console.error('Error getting client-side refresh token:', error);
        return undefined;
      }
    }
  }

  async setAccessToken(token: string): Promise<void> {
    if (this.setAccessTokenFn) {
      return this.setAccessTokenFn(token);
    }

    if (!this.isServer()) {
      try {
        const Cookies = (await import('js-cookie')).default;
        Cookies.set('accessToken', token);
      } catch (error) {
        console.error('Error setting access token:', error);
      }
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    if (this.setRefreshTokenFn) {
      return this.setRefreshTokenFn(token);
    }

    if (!this.isServer()) {
      try {
        const Cookies = (await import('js-cookie')).default;
        Cookies.set('refreshToken', token);
      } catch (error) {
        console.error('Error setting refresh token:', error);
      }
    }
  }
}

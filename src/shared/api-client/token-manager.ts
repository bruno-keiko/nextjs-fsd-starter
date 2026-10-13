/** Credential storage belongs to the caller; no cookies are read or written by default. */
export class TokenManager {
  constructor(
    private getAccessTokenFn?: () => Promise<string | undefined>,
    private getRefreshTokenFn?: () => Promise<string | undefined>,
    private setAccessTokenFn?: (token: string) => Promise<void>,
    private setRefreshTokenFn?: (token: string) => Promise<void>,
  ) {}

  async getAccessToken(): Promise<string | undefined> {
    return this.getAccessTokenFn?.();
  }

  async getRefreshToken(): Promise<string | undefined> {
    return this.getRefreshTokenFn?.();
  }

  async setAccessToken(token: string): Promise<void> {
    await this.setAccessTokenFn?.(token);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.setRefreshTokenFn?.(token);
  }
}

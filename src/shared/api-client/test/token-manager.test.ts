import { describe, expect, it } from 'vitest';
import { TokenManager } from '../token-manager';

describe('TokenManager', () => {
  it('does not load or persist credentials without caller-provided storage', async () => {
    const manager = new TokenManager();
    await manager.setAccessToken('ignored-access');
    await manager.setRefreshToken('ignored-refresh');

    expect(await manager.getAccessToken()).toBeUndefined();
    expect(await manager.getRefreshToken()).toBeUndefined();
  });

  it('uses the caller-provided credential store', async () => {
    let access = 'old-access';
    let refresh = 'old-refresh';
    const manager = new TokenManager(
      async () => access,
      async () => refresh,
      async (value) => {
        access = value;
      },
      async (value) => {
        refresh = value;
      },
    );

    expect(await manager.getAccessToken()).toBe('old-access');
    expect(await manager.getRefreshToken()).toBe('old-refresh');

    await manager.setAccessToken('new-access');
    await manager.setRefreshToken('new-refresh');

    expect(await manager.getAccessToken()).toBe('new-access');
    expect(await manager.getRefreshToken()).toBe('new-refresh');
  });

  it('propagates errors from caller-provided storage', async () => {
    const manager = new TokenManager(async () => {
      throw new Error('Storage unavailable');
    });

    await expect(manager.getAccessToken()).rejects.toThrow('Storage unavailable');
  });
});

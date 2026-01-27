/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '../token-manager';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as any).window;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor with custom functions', async () => {
    it('should use provided custom getter functions', async () => {
      const mockGetAccess = vi.fn().mockResolvedValue('custom-access-token');
      const mockGetRefresh = vi.fn().mockResolvedValue('custom-refresh-token');

      const manager = new TokenManager(mockGetAccess, mockGetRefresh);

      const accessToken = await manager.getAccessToken();
      const refreshToken = await manager.getRefreshToken();

      expect(mockGetAccess).toHaveBeenCalledOnce();
      expect(mockGetRefresh).toHaveBeenCalledOnce();
      expect(accessToken).toBe('custom-access-token');
      expect(refreshToken).toBe('custom-refresh-token');
    });

    it('should use provided custom setter functions', async () => {
      const mockSetAccess = vi.fn().mockResolvedValue(undefined);
      const mockSetRefresh = vi.fn().mockResolvedValue(undefined);

      const manager = new TokenManager(
        undefined,
        undefined,
        mockSetAccess,
        mockSetRefresh
      );
      await manager.setAccessToken('new-access-token');
      await manager.setRefreshToken('new-refresh-token');

      expect(mockSetAccess).toHaveBeenCalledWith('new-access-token');
      expect(mockSetRefresh).toHaveBeenCalledWith('new-refresh-token');
      expect(mockSetAccess).toHaveBeenCalledOnce();
      expect(mockSetRefresh).toHaveBeenCalledOnce();
    });
  });
});

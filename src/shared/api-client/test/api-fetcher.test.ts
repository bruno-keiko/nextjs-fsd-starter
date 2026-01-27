/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiFetcher } from '../api-fetcher';

// Create mock functions
const mockGetAccessToken = vi.fn();
const mockSetAccessToken = vi.fn();
const mockHandleRefreshToken = vi.fn();
const mockHandleUnauthorized = vi.fn();

// Mock the dependencies with proper constructor functions
vi.mock('../token-manager', () => ({
  TokenManager: vi.fn(function (
    this: any,
    getAccess?: any,
    getRefresh?: any,
    setAccess?: any
  ) {
    this.getAccessToken = getAccess || mockGetAccessToken;
    this.setAccessToken = setAccess || mockSetAccessToken;
    return this;
  }),
}));

vi.mock('../refresh-handler', () => ({
  RefreshHandler: vi.fn(function (this: any) {
    this.handleRefreshToken = mockHandleRefreshToken;
    this.handleUnauthorized = mockHandleUnauthorized;
    return this;
  }),
}));

describe('ApiFetcher', () => {
  let fetcher: ApiFetcher;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('mock-access-token');
    mockSetAccessToken.mockImplementation(() => {});
    mockHandleRefreshToken.mockResolvedValue(null);
    mockHandleUnauthorized.mockResolvedValue(undefined);

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with string config', () => {
      fetcher = new ApiFetcher('https://api.example.com');
      expect(fetcher).toBeDefined();
    });

    it('should initialize with object config', () => {
      const config = {
        prefix: 'https://api.example.com',
        getAccessToken: vi.fn(),
        getRefreshToken: vi.fn(),
        setAccessToken: vi.fn(),
        setRefreshToken: vi.fn(),
        refreshTokenFn: vi.fn(),
        onUnauthorized: vi.fn(),
        shouldRefreshToken: vi.fn(),
      };

      fetcher = new ApiFetcher(config);
      expect(fetcher).toBeDefined();
    });
  });

  describe('GET requests', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should make a successful GET request with JSON response', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await fetcher.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should make GET request without token if not available', async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({}),
      });

      await fetcher.get('/public');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/public', {
        method: 'GET',
        headers: {},
      });
    });

    it('should handle non-JSON response', async () => {
      const mockResponse = { ok: true, headers: new Headers() };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetcher.get('/download');

      expect(result).toBe(mockResponse);
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({}),
      });

      await fetcher.get('/users', {
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'GET',
        headers: {
          'X-Custom-Header': 'value',
          Authorization: 'Bearer mock-access-token',
        },
      });
    });
  });

  describe('POST requests', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should make POST request with JSON body', async () => {
      const mockData = { id: 1 };
      const postData = { name: 'New User' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await fetcher.post('/users', postData);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockData);
    });

    it('should handle FormData in POST request', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({}),
      });

      await fetcher.post('/upload', formData);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
        body: formData,
      });
    });
  });

  describe('PUT requests', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should make PUT request with JSON body', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated User' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await fetcher.put('/users/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          body: JSON.stringify(putData),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle FormData in PUT request', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({}),
      });

      await fetcher.put('/users/1', formData);

      const call = mockFetch.mock.calls[0];
      expect(call[1].body).toBe(formData);
      expect(call[1].headers.Authorization).toBe('Bearer mock-access-token');
    });
  });

  describe('PATCH requests', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should make PATCH request with JSON body', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const patchData = { name: 'Patched User' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await fetcher.patch('/users/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          body: JSON.stringify(patchData),
        }
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await fetcher.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      fetcher = new ApiFetcher('https://api.example.com');
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      });

      await expect(fetcher.get('/users/999')).rejects.toThrow('Not Found');
    });

    it('should include status and response in error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      try {
        await fetcher.get('/error');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(500);
        expect(error.response).toBe(mockResponse);
      }
    });
  });

  describe('Token refresh on 401', () => {
    beforeEach(() => {
      // Mock window to simulate client-side
      global.window = {} as any;
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should retry request after successful token refresh', async () => {
      const refreshTokenFn = vi.fn().mockResolvedValue('new-token');
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
      });

      mockHandleRefreshToken.mockResolvedValue('new-token');

      // First call returns 401, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ success: true }),
        });

      const result = await fetcher.get('/protected');

      expect(mockHandleRefreshToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('should not retry if token refresh fails', async () => {
      const onUnauthorized = vi.fn();
      const refreshTokenFn = vi.fn();
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
        onUnauthorized,
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      mockHandleRefreshToken.mockResolvedValue(null);

      await expect(fetcher.get('/protected')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should call onUnauthorized when token refresh fails', async () => {
      const onUnauthorized = vi.fn();
      const refreshTokenFn = vi.fn();
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
        onUnauthorized,
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      mockHandleRefreshToken.mockRejectedValue(new Error('Refresh failed'));

      await expect(fetcher.get('/protected')).rejects.toThrow();
      expect(mockHandleUnauthorized).toHaveBeenCalled();
    });

    it('should respect shouldRefreshToken predicate', async () => {
      const shouldRefreshToken = vi.fn().mockReturnValue(false);
      const refreshTokenFn = vi.fn();
      const onUnauthorized = vi.fn();
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
        shouldRefreshToken,
        onUnauthorized,
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      await expect(fetcher.get('/protected')).rejects.toThrow();
      expect(shouldRefreshToken).toHaveBeenCalled();
      expect(mockHandleRefreshToken).not.toHaveBeenCalled();
    });

    it('should not refresh token on server-side', async () => {
      delete (global as any).window;

      const refreshTokenFn = vi.fn();
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      await expect(fetcher.get('/protected')).rejects.toThrow();
      expect(mockHandleRefreshToken).not.toHaveBeenCalled();
    });

    it('should not retry more than once', async () => {
      const refreshTokenFn = vi.fn();
      fetcher = new ApiFetcher({
        prefix: 'https://api.example.com',
        refreshTokenFn,
      });

      // Both calls return 401
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      });

      mockHandleRefreshToken.mockResolvedValue('new-token');

      await expect(fetcher.get('/protected')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockHandleRefreshToken).toHaveBeenCalledTimes(1);
    });
  });
});

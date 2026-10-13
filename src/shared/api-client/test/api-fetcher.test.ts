import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiFetcher } from '../api-fetcher';
import { RefreshHandler } from '../refresh-handler';

function network() {
  const fetch = vi.fn<typeof globalThis.fetch>();
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiFetcher', () => {
  it('returns JSON without reading browser credentials or organization storage', async () => {
    vi.stubGlobal('window', { location: { href: '/dashboard' } });
    vi.stubGlobal('localStorage', { getItem: () => '{"state":{"selectedOrganizationId":"old-org"}}' });
    const fetch = network().mockResolvedValue(Response.json({ id: 1 }));
    const client = new ApiFetcher('https://api.example.test');

    expect(await client.get('/public')).toEqual({ id: 1 });

    const [url, options] = fetch.mock.calls[0]!;

    expect(url).toBe('https://api.example.test/public');
    expect(new Headers(options?.headers).has('Authorization')).toBe(false);
    expect(new Headers(options?.headers).has('X-Organization-Id')).toBe(false);
  });

  it.each([
    { label: 'record', headers: { 'X-Project': 'demo' } },
    { label: 'Headers', headers: new Headers({ 'X-Project': 'demo' }) },
    { label: 'tuples', headers: [['X-Project', 'demo']] as [string, string][] },
  ])('preserves $label headers and adds explicitly configured authentication', async ({ headers }) => {
    const fetch = network().mockResolvedValue(Response.json({ ok: true }));
    const client = new ApiFetcher({ prefix: 'https://api.example.test', getAccessToken: async () => 'caller-token' });

    expect(await client.get('/resource', { headers })).toEqual({ ok: true });

    const sent = new Headers(fetch.mock.calls[0]![1]?.headers);

    expect(sent.get('X-Project')).toBe('demo');
    expect(sent.get('Authorization')).toBe('Bearer caller-token');
  });

  it('preserves a caller-supplied authorization header when no token getter is configured', async () => {
    const fetch = network().mockResolvedValue(Response.json({ ok: true }));
    const client = new ApiFetcher('https://api.example.test');

    expect(await client.get('/resource', { headers: { Authorization: 'Custom credential' } })).toEqual({ ok: true });
    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get('Authorization')).toBe('Custom credential');
  });

  it.each(['post', 'put', 'patch'] as const)('serializes JSON for %s requests', async (method) => {
    const fetch = network().mockResolvedValue(Response.json({ id: 2 }));
    const client = new ApiFetcher('https://api.example.test');

    expect(await client[method]('/resource', { name: 'demo' })).toEqual({ id: 2 });

    const sent = fetch.mock.calls[0]![1]!;

    expect(sent.method).toBe(method.toUpperCase());
    expect(sent.body).toBe('{"name":"demo"}');
    expect(new Headers(sent.headers).get('Content-Type')).toBe('application/json');
  });

  it.each(['post', 'put', 'patch'] as const)('lets fetch set the multipart boundary for %s uploads', async (method) => {
    const fetch = network().mockResolvedValue(Response.json({ uploaded: true }));
    const client = new ApiFetcher('https://api.example.test');
    const body = new FormData();
    body.set('name', 'demo');

    expect(await client[method]('/upload', body, { headers: new Headers({ 'Content-Type': 'application/json', 'X-Project': 'demo' }) })).toEqual({ uploaded: true });

    const sent = fetch.mock.calls[0]![1]!;

    expect(sent.body).toBe(body);
    expect(new Headers(sent.headers).has('Content-Type')).toBe(false);
    expect(new Headers(sent.headers).get('X-Project')).toBe('demo');
  });

  it('supports delete and passes through non-JSON responses', async () => {
    const response = new Response(null, { status: 204 });
    const fetch = network().mockResolvedValue(response);
    const client = new ApiFetcher('https://api.example.test');

    expect(await client.delete('/resource')).toBe(response);
    expect(fetch.mock.calls[0]![1]?.method).toBe('DELETE');
  });

  it('reports HTTP details without redirecting on unauthorized responses', async () => {
    const location = { href: '/dashboard' };
    vi.stubGlobal('window', { location });
    network().mockResolvedValue(Response.json({ message: 'Sign in required' }, { status: 401 }));
    const client = new ApiFetcher('https://api.example.test');

    await expect(client.get('/private')).rejects.toMatchObject({ message: 'Sign in required', status: 401, url: 'https://api.example.test/private' });
    expect(location.href).toBe('/dashboard');
  });

  it('lets the caller handle unauthorized responses', async () => {
    const events: number[] = [];
    network().mockResolvedValue(new Response(null, { status: 401, statusText: 'Unauthorized' }));
    const client = new ApiFetcher({ prefix: 'https://api.example.test', onUnauthorized: async (error) => {
      events.push(error.status!);
    } });

    await expect(client.get('/private')).rejects.toMatchObject({ status: 401 });
    expect(events).toEqual([401]);
  });

  it('refreshes explicitly configured credentials and retries on the server', async () => {
    let token = 'expired';
    const fetch = network()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ authenticated: true }));
    const client = new ApiFetcher({
      prefix: 'https://api.example.test',
      getAccessToken: async () => token,
      setAccessToken: async (value) => {
        token = value;
      },
      refreshTokenFn: async () => 'fresh',
    });

    expect(await client.get('/private')).toEqual({ authenticated: true });
    expect(new Headers(fetch.mock.calls[0]![1]?.headers).get('Authorization')).toBe('Bearer expired');
    expect(new Headers(fetch.mock.calls[1]![1]?.headers).get('Authorization')).toBe('Bearer fresh');
  });

  it('stops after one refresh and reports the final unauthorized response', async () => {
    let refreshes = 0;
    const fetch = network().mockImplementation(async () => new Response(null, { status: 401 }));
    const client = new ApiFetcher({ prefix: 'https://api.example.test', refreshTokenFn: async () => {
      refreshes += 1;
      return 'fresh';
    } });

    await expect(client.get('/private')).rejects.toMatchObject({ status: 401 });
    expect(fetch.mock.calls).toHaveLength(2);
    expect(refreshes).toBe(1);
  });

  it('respects a refresh predicate and handles failed refreshes', async () => {
    let refreshes = 0;
    let unauthorized = 0;
    network().mockImplementation(async () => new Response(null, { status: 401 }));
    const config = {
      prefix: 'https://api.example.test',
      refreshTokenFn: async () => {
        refreshes += 1;
        throw new Error('Refresh unavailable');
      },
      onUnauthorized: async () => {
        unauthorized += 1;
      },
    };

    await expect(new ApiFetcher({ ...config, shouldRefreshToken: () => false }).get('/private')).rejects.toMatchObject({ status: 401 });
    expect(refreshes).toBe(0);
    await expect(new ApiFetcher(config).get('/private')).rejects.toMatchObject({ status: 401 });
    expect(refreshes).toBe(1);
    expect(unauthorized).toBe(2);
  });

  it('propagates network failures', async () => {
    network().mockRejectedValue(new Error('Network unavailable'));

    await expect(new ApiFetcher('https://api.example.test').get('/resource')).rejects.toThrow('Network unavailable');
  });
});

describe('RefreshHandler', () => {
  it('shares one refresh result among concurrent callers', async () => {
    let finish!: (value: string) => void;
    let refreshes = 0;
    let saved = '';
    const gate = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const handler = new RefreshHandler(async () => {
      refreshes += 1;
      return gate;
    }, async (value) => {
      saved = value;
    });
    const first = handler.handleRefreshToken();
    const second = handler.handleRefreshToken();
    finish('shared-token');

    expect(await Promise.all([first, second])).toEqual(['shared-token', 'shared-token']);
    expect(refreshes).toBe(1);
    expect(saved).toBe('shared-token');
  });

  it('returns null when no refresh callback is configured', async () => {
    const handler = new RefreshHandler(undefined, async () => {});

    expect(await handler.handleRefreshToken()).toBeNull();
    expect(await handler.handleRefreshToken()).toBeNull();
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */
import { ApiFetcher } from './api-fetcher';
import { BASE_URL, CustomError } from './types';

/**
 * Configured API instance with smart defaults for token refresh and error handling
 */
export const api = new ApiFetcher({
  prefix: BASE_URL || 'http://localhost:3000',

  // Auto-refresh tokens (client-side only)
  refreshTokenFn: async () => {
    // Only runs on client
    if (typeof window === 'undefined') return null;

    try {
      const Cookies = (await import('js-cookie')).default;
      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) return null;

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return null;

      const data: { access_token: string; refresh_token: string } =
        await response.json();

      if (data.access_token) {
        Cookies.set('accessToken', data.access_token);
      }
      if (data.refresh_token) {
        Cookies.set('refreshToken', data.refresh_token);
      }

      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  },

  shouldRefreshToken: (error: CustomError) => {
    // Don't try to refresh token for login/register endpoints
    const url = error.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return false;
    }
    return true;
  },

  // Handle unauthorized
  onUnauthorized: async error => {
    console.error('Unauthorized:', error.status);

    // Don't redirect if already on login/register page or if it's a login/register request
    const url = error.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      // Let the error propagate to show the error message
      return;
    }

    if (typeof window === 'undefined') {
      // Server-side: use Next.js redirect
      try {
        const { redirect } = require('next/navigation');
        redirect('/login');
      } catch {
        // If redirect fails, throw error to be handled by caller
        throw error;
      }
    } else {
      // Client-side: only redirect if not already on login page
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        const Cookies = (await import('js-cookie')).default;
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }
  },
});

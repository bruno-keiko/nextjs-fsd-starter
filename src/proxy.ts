import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/shared/lib/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|.*\\..*).*)',
};


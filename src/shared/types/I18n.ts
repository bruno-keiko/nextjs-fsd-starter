import type { routing } from '@/shared/lib/I18nRouting';
import type messages from '@/shared/config/locales/en.json';

declare module 'next-intl' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

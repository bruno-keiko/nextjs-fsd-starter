declare module 'js-cookie' {
  export type CookieAttributes = {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };

  export type CookiesStatic = {
    get: ((name: string) => string | undefined) & (() => Record<string, string>);
    set: (name: string, value: string, options?: CookieAttributes) => void;
    remove: (name: string, options?: CookieAttributes) => void;
  };

  const Cookies: CookiesStatic;
  export default Cookies;
}

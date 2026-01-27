import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sponsors } from '@/shared/ui';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IIndexProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return (
    <>
      <p className="text-base">
        {t('intro')}
      </p>
      <h2 className="mt-5 text-2xl font-bold">
        Boilerplate Code for Your Next.js Project with Tailwind CSS
      </h2>
      <p className="text-base">
        Next.js Boilerplate is a developer-friendly starter code for Next.js projects, built with Tailwind CSS and TypeScript.
        {' '}
        <span role="img" aria-label="zap">
          ⚡️
        </span>
        {' '}
        Designed with developer experience in mind, it includes:
      </p>
      <ul className="mt-3 text-base">
        <li>🚀 Next.js with App Router support</li>
        <li>🔥 TypeScript for type checking</li>
        <li>💎 Tailwind CSS integration</li>
        <li>📦 ORM with DrizzleORM (PostgreSQL, SQLite, MySQL support)</li>
        <li>💽 Dev database with PGlite</li>
        <li>🌐 Multi-language support (i18n) with next-intl</li>
        <li>🔴 Form handling (React Hook Form) and validation (Zod)</li>
        <li>📏 Linting and formatting (ESLint, Prettier)</li>
        <li>🦊 Git hooks and commit linting (Husky, Commitlint)</li>
        <li>🦺 Testing suite (Vitest, React Testing Library, Playwright)</li>
        <li>🎉 Storybook for UI development</li>
        <li>📝 Logging (LogTape, an alternative to Pino.js)</li>
        <li>🤖 SEO optimization (metadata, JSON-LD, Open Graph tags)</li>
        <li>⚙️ Development tools (VSCode config, bundler analyzer, changelog generation)</li>
      </ul>
      <p className="text-base">
        Our sponsors&apos; exceptional support has made this project possible.
        Their services integrate seamlessly with the boilerplate, and we
        recommend trying them out.
      </p>
      <h2 className="mt-5 text-2xl font-bold">{t('sponsors_title')}</h2>
      <Sponsors />
    </>
  );
};

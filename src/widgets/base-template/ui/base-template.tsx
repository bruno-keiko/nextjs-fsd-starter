import { useTranslations } from 'next-intl';
import { AppConfig } from '@/shared/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="w-full px-1 text-gray-700 antialiased">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-gray-300">
          <div className="pt-16 pb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {AppConfig.name}
            </h1>
            <h2 className="text-xl">{t('description')}</h2>
          </div>

          <div className="flex justify-between">
            <nav aria-label="Main navigation">
              <ul className="flex flex-wrap gap-x-5 text-xl">
                {props.leftNav}
              </ul>
            </nav>

            <nav>
              <ul className="flex flex-wrap gap-x-5 text-xl">
                {props.rightNav}
              </ul>
            </nav>
          </div>
        </header>

        <main>{props.children}</main>

        <footer className="border-t border-gray-300 py-8 text-center text-sm">
          {t.rich('footer_text', {
            year: new Date().getFullYear(),
            name: AppConfig.name,
            author: () => (
              <span className="text-gray-700">our team</span>
            ),
          })}

        </footer>
      </div>
    </div>
  );
};

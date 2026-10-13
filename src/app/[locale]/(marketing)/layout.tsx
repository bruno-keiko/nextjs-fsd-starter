import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { LocaleSwitcher } from '@/shared/ui';
import { getI18nPath } from '@/shared/utils';
import { BaseTemplate } from '@/widgets/base-template';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'RootLayout' });

  return (
    <>
      <BaseTemplate
        leftNav={(
          <>
            <li><Link href={getI18nPath('/', locale)}>{t('home_link')}</Link></li>
            <li><Link href={getI18nPath('/about', locale)}>{t('about_link')}</Link></li>
            <li><Link href={getI18nPath('/counter', locale)}>{t('counter_link')}</Link></li>
            <li><Link href={getI18nPath('/portfolio', locale)}>{t('portfolio_link')}</Link></li>
          </>
        )}
        rightNav={(
          <>
            <li>
              <LocaleSwitcher />
            </li>
          </>
        )}
      >
        {props.children}
      </BaseTemplate>
    </>
  );
}

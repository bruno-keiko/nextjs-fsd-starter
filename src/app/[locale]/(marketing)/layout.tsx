import { setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/shared/ui';
import { BaseTemplate } from '@/widgets/base-template';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <BaseTemplate
        leftNav={null}
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

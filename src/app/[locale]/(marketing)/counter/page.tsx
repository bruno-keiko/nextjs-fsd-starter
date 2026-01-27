import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CounterForm } from '@/features/counter-increment';
import { CurrentCount } from '@/entities/counter';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Counter',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function Counter() {
  return (
    <>
      <CounterForm />

      <div className="mt-3">
        <CurrentCount />
      </div>

    </>
  );
};

import { useTranslations } from 'next-intl';
import { AppConfig } from '@/shared/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode | null;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-[hsl(var(--border))]">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                {AppConfig.name}
              </h1>
            </div>

            {props.rightNav && (
              <nav className="flex items-center">
                <ul className="flex items-center gap-4">
                  {props.rightNav}
                </ul>
              </nav>
            )}
          </div>
        </header>

        <main className="py-8">{props.children}</main>

        <footer className="mt-auto border-t border-[hsl(var(--border))] py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t.rich('footer_text', {
            year: new Date().getFullYear(),
            name: AppConfig.name,
            author: () => (
              <span className="text-[hsl(var(--foreground))]">our team</span>
            ),
          })}
        </footer>
      </div>
    </div>
  );
};

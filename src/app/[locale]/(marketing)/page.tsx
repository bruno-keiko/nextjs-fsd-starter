import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, buttonVariants } from '@/shared/ui';
import { Rocket, Zap, Shield, Code, Database, Globe, TestTube, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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

const features = [
  {
    icon: Rocket,
    title: 'Next.js App Router',
    description: 'Built with the latest Next.js App Router for optimal performance and developer experience.',
  },
  {
    icon: Code,
    title: 'TypeScript & Type Safety',
    description: 'Full TypeScript support with strict mode and type-safe environment variables.',
  },
  {
    icon: Database,
    title: 'DrizzleORM',
    description: 'Type-safe ORM compatible with PostgreSQL, SQLite, and MySQL. Includes PGlite for local dev.',
  },
  {
    icon: Globe,
    title: 'i18n Ready',
    description: 'Multi-language support with next-intl for internationalization out of the box.',
  },
  {
    icon: Shield,
    title: 'Form Handling',
    description: 'React Hook Form with Zod validation for robust form management.',
  },
  {
    icon: TestTube,
    title: 'Testing Suite',
    description: 'Vitest, Playwright, and Storybook configured for comprehensive testing.',
  },
];

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="space-y-6 text-center">
        <div className="space-y-4">
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="mr-1 h-3 w-3" />
            Feature-Sliced Design Architecture
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Next.js Starter with{' '}
            <span className="text-[hsl(var(--primary))]">Feature-Sliced Design</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
            {t('intro')} A production-ready boilerplate with TypeScript, Tailwind CSS, and a scalable architecture.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="https://www.npmjs.com/package/next-fsd"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'text-base')}
          >
            <Rocket className="h-4 w-4" />
            Get Started with CLI
          </Link>
          <Link
            href="#"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-base')}
          >
            View on GitHub
          </Link>
        </div>
        <div className="pt-4">
          <code className="rounded-md bg-muted px-4 py-2 text-sm">
            npx next-fsd my-app
          </code>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything You Need</h2>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            A complete starter kit with modern tools and best practices
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
                    <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="rounded-lg border bg-muted/50 p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
            <h2 className="text-2xl font-bold">Quick Start</h2>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              <code className="rounded bg-background px-2 py-1">npx next-fsd my-app</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              <code className="rounded bg-background px-2 py-1">cd my-app</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              <code className="rounded bg-background px-2 py-1">npm install</code>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              <code className="rounded bg-background px-2 py-1">npm run dev</code>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

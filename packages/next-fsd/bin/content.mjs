import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function changeFile(root, name, transform) {
  const file = path.join(root, name);
  try {
    await writeFile(file, transform(await readFile(file, 'utf8')), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

const counterCopy = {
  en: {
    description: 'An example counter stored in memory',
    presentation: 'The counter is stored in memory and incremented by the value you provide. It resets when the server restarts.',
  },
  fr: {
    description: 'Un exemple de compteur stocké en mémoire',
    presentation: 'Le compteur est stocké en mémoire et incrémenté de la valeur indiquée. Il est réinitialisé au redémarrage du serveur.',
  },
};

export async function configureContent(root, { database, minimal }) {
  await changeFile(root, 'README.md', text => text.replace(/ Repository maintainers can also run[^\n]+/, ''));
  await changeFile(root, 'src/shared/config/StarterConfig.ts', text => text.replace(/(database:\s*)(?:true|false)/, `$1${database}`));
  const locales = path.join(root, 'src/shared/config/locales');
  let files;
  try {
    files = await readdir(locales);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    files = [];
  }
  for (const name of files.filter(file => file.endsWith('.json'))) {
    await changeFile(root, `src/shared/config/locales/${name}`, (text) => {
      const messages = JSON.parse(text);
      const copy = counterCopy[path.basename(name, '.json')];
      if (!database && copy) {
        if (messages.Counter) {
          messages.Counter.meta_description = copy.description;
        }
        if (messages.CounterForm) {
          messages.CounterForm.presentation = copy.presentation;
        }
      }
      if (minimal) {
        delete messages.About;
        delete messages.Portfolio;
        delete messages.PortfolioSlug;
        if (messages.RootLayout) {
          delete messages.RootLayout.about_link;
          delete messages.RootLayout.portfolio_link;
        }
      }
      return `${JSON.stringify(messages, null, 2)}\n`;
    });
  }

  if (!minimal) {
    return;
  }
  for (const name of ['about', 'portfolio']) {
    await rm(path.join(root, 'src/app/[locale]/(marketing)', name), { recursive: true, force: true });
  }
  await changeFile(root, 'src/app/[locale]/(marketing)/layout.tsx', text => text.replace(/^.*<li>.*(?:\/about|\/portfolio).*<\/li>.*\r?\n/gm, ''));
  await changeFile(root, 'tests/e2e/Sanity.check.e2e.ts', text => text.replace(/\n {4}test\('should navigate to the (?:about|portfolio) page',[\s\S]*?\n {4}\}\);/g, ''));
  await changeFile(root, 'tests/e2e/Visual.e2e.ts', text => text.replace(/\n {4}test\('should take screenshot of the (?:about|portfolio|portfolio details) page',[\s\S]*?\n {4}\}\);/g, ''));
  await changeFile(root, 'tests/e2e/I18n.e2e.ts', text => text.replace(/\n {4}test\('should switch language from English to French using URL[\s\S]*?\n {4}\}\);/g, `
    test('should render the French counter using its locale URL', async ({ page }) => {
      await page.goto('/fr/counter');

      await expect(page.getByRole('heading', { name: 'Compteur' })).toBeVisible();

      await expect(page.getByLabel('Incrémenter de')).toBeVisible();
    });`));
  for (const file of ['Sanity.check', 'Visual', 'I18n']) {
    await changeFile(root, `tests/e2e/${file}.e2e.ts`, text => text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n[ \t]*\n(?= {2}\}\);)/g, '\n'));
  }
}

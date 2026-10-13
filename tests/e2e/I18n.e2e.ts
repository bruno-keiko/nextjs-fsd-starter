import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language Switching', () => {
    test('should switch language from English to French using dropdown and verify text on the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { name: 'Next.js Starter with Feature-Sliced Design' }),
      ).toBeVisible();

      await page.getByLabel('lang-switcher').selectOption('fr');

      await expect(
        page.getByText('Bienvenue ! Ce starter est configuré', { exact: false }),
      ).toBeVisible();
    });

    test('should switch language from English to French using URL and verify text on the about page', async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByText('Welcome to our About page!', { exact: false })).toBeVisible();

      await page.goto('/fr/about');

      await expect(page.getByText('Bienvenue sur notre page À propos !', { exact: false })).toBeVisible();
    });
  });
});

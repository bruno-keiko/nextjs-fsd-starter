import { expect, test } from '@playwright/test';

// E2E tests ending with `*.check.e2e.ts` can be used for monitoring deployed environments.
// These tests can be run regularly to ensure that production or preview environments are up and running.
// E2E tests ending with `*.e2e.ts` are run before deployment.
// You can run them locally or on CI to ensure that the application is ready for deployment.

// BaseURL needs to be explicitly defined in the test file when running in monitoring environments.
// You can't use `goto` function directly with a relative path like with other *.e2e.ts tests.

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('should display the homepage', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/`);

      await expect(
        page.getByRole('heading', { name: 'Boilerplate Code for Your Next.js Project with Tailwind CSS' }),
      ).toBeVisible();
    });

    test('should navigate to the about page', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/`);

      await page.getByRole('link', { name: 'About' }).click();

      await expect(page).toHaveURL(/about$/);

      await expect(
        page.getByText('Welcome to our About page', { exact: false }),
      ).toBeVisible();
    });

    test('should navigate to the portfolio page', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/`);

      await page.getByRole('link', { name: 'Portfolio' }).click();

      await expect(page).toHaveURL(/portfolio$/);

      await expect(
        page.locator('main').getByRole('link', { name: /^Portfolio/ }),
      ).toHaveCount(6);
    });
  });
});

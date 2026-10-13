import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { enMessages as messages } from '@/shared/config';
import { BaseTemplate } from './base-template';

describe('Base template', () => {
  describe('Render method', () => {
    it('should have 3 menu items', async () => {
      await render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <BaseTemplate
            leftNav={(
              <>
                <li>link 1</li>
                <li>link 2</li>
                <li>link 3</li>
              </>
            )}
          >
            {null}
          </BaseTemplate>
        </NextIntlClientProvider>,
      );

      const menuItemList = page.getByRole('listitem');

      expect(menuItemList.elements()).toHaveLength(3);
    });

    it('should omit navigation when no menu items are supplied', async () => {
      await render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <BaseTemplate leftNav={null}>{null}</BaseTemplate>
        </NextIntlClientProvider>,
      );

      expect(page.getByRole('navigation').elements()).toHaveLength(0);
    });
  });
});

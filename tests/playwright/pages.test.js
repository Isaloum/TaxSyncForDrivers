import { test, expect } from '@playwright/test';
import axe from 'axe-core';

const SITE = 'https://isaloum.github.io/TaxSyncQC/';

test('homepage loads and has title', async ({ page }) => {
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/TaxSyncQC/);
});

test('homepage accessibility quick scan', async ({ page }) => {
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  // inject axe-core and run a quick scan
  await page.addScriptTag({ content: `(${axe.source})()` });
  const results = await page.evaluate(async () => await axe.run());
  if (results.violations && results.violations.length > 0) {
    console.error('A11Y violations:', JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations.length).toBe(0);
});

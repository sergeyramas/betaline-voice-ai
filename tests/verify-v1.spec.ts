import { test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://betaline-voice-ai.vercel.app';
const VERSION = 'v1';
const SCREENSHOTS_DIR = 'screenshots';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const SCROLL_POINTS = [0, 25, 50, 75, 100];

test.describe(`QA Pass ${VERSION}`, () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} — scroll pass`, async ({ page }) => {
      test.setTimeout(120000);
      mkdirSync(SCREENSHOTS_DIR, { recursive: true });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('response', res => { if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`); });

      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      for (const pct of SCROLL_POINTS) {
        const y = Math.floor((scrollHeight - viewport.height) * pct / 100);
        await page.evaluate(y => window.scrollTo(0, y), y);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/${VERSION}-${viewport.name}-${pct}.png`, fullPage: false });
      }

      // Форма крупно
      await page.locator('#lead-form').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/${VERSION}-${viewport.name}-form.png` });

      // DOM-чеки
      const hasHOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
      const brokenImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .filter(i => i.complete && i.naturalWidth === 0)
          .map(i => i.getAttribute('src'))
      );

      let smallTargets: string[] = [];
      if (viewport.width <= 390) {
        smallTargets = await page.evaluate(() => {
          const results: string[] = [];
          document.querySelectorAll('a, button').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40)) {
              results.push(`<${el.tagName.toLowerCase()}> ${(el.textContent || '').trim().slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`);
            }
          });
          return results.slice(0, 20);
        });
      }

      writeFileSync(
        `${SCREENSHOTS_DIR}/${VERSION}-${viewport.name}-checks.json`,
        JSON.stringify({ hasHOverflow, brokenImages, smallTargets, consoleErrors, pageErrors, failedRequests }, null, 2)
      );
    });
  }
});

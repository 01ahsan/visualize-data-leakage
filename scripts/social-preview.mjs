// Renders docs/social-preview.svg to a 1280x640 PNG for the GitHub social preview.
//
//   npm run social
//
// Uses an installed Chrome or Edge, like scripts/screenshot.mjs.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const svg = readFileSync('docs/social-preview.svg', 'utf8');
const browser = await chromium.launch(
  process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH }
    : {
        channel:
          process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome'),
      },
);
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
await page.screenshot({
  path: 'docs/social-preview.png',
  clip: { x: 0, y: 0, width: 1280, height: 640 },
});
await browser.close();
console.log('wrote docs/social-preview.png');

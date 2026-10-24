// Captures screenshots of the built site with Playwright.
//
//   npm run build && npm run screenshot
//
// Uses an installed Chrome or Edge (no browser download). Set BROWSER_CHANNEL
// to "chrome" or "msedge", or BROWSER_PATH to a Chromium-based executable.
// Writes docs/screenshot.png (for the README) and review shots to scripts/output/.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4173, strictPort: true } });
const base = server.resolvedUrls.local[0];

const launchOptions = process.env.BROWSER_PATH
  ? { executablePath: process.env.BROWSER_PATH }
  : {
      channel: process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome'),
    };
const browser = await chromium.launch(launchOptions);

mkdirSync('docs', { recursive: true });
mkdirSync('scripts/output', { recursive: true });

async function shoot(path, file, { width, height, colorScheme = 'light', fullPage = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    colorScheme,
    deviceScaleFactor: 2,
  });
  await page.goto(`${base}${path}`);
  if (path.includes('scenario')) {
    await page.getByText('dot = your setting', { exact: false }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(600); // let the meter animation settle
  }
  await page.screenshot({ path: file, fullPage });
  await page.close();
  console.log('wrote', file);
}

const scenario = '#/scenario/feature-selection?mode=leaky&strength=1000&seed=42';
await shoot(scenario, 'docs/screenshot.png', { width: 1100, height: 900 });

if (!process.argv.includes('--readme-only')) {
  await shoot('#/', 'scripts/output/home.png', { width: 1200, height: 900, fullPage: true });
  await shoot('#/', 'scripts/output/home-mobile.png', { width: 360, height: 800, fullPage: true });
  await shoot(scenario, 'scripts/output/scenario-full.png', {
    width: 1200,
    height: 900,
    fullPage: true,
  });
  await shoot(scenario, 'scripts/output/scenario-dark.png', {
    width: 1200,
    height: 1050,
    colorScheme: 'dark',
  });
  await shoot(
    '#/scenario/same-patient?mode=correct&strength=4&seed=42',
    'scripts/output/mobile.png',
    {
      width: 360,
      height: 800,
      fullPage: true,
    },
  );
  await shoot(`${scenario}&embed=1`, 'scripts/output/embed.png', {
    width: 760,
    height: 900,
    fullPage: true,
  });
  await shoot('#/checklist', 'scripts/output/checklist.png', { width: 1000, height: 900 });
}

await browser.close();
await new Promise((resolve) => server.httpServer.close(resolve));

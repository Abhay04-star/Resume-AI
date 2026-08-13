const { chromium } = require('playwright');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  console.log('Opening site in visible browser:', base);

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(base, { waitUntil: 'networkidle' });

  console.log('Opened:', base);
  console.log('You can interact with the browser window. To close it, stop this script (Ctrl+C in terminal).');

  // keep process alive so the browser stays open for manual inspection
  await new Promise(() => {});
})();

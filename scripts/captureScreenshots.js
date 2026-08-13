const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve(process.cwd(), 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const base = process.env.BASE_URL || 'http://localhost:3000';
  const pages = ['/', '/sign-in', '/sign-up', '/dashboard'];

  for (const p of pages) {
    const url = base.replace(/\/$/, '') + p;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      const safeName = p === '/' ? 'home' : p.replace(/\W+/g, '_').replace(/^_+|_+$/g, '');
      const file = path.join(outDir, `${safeName}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log('Saved', file);
    } catch (e) {
      console.error('Failed to capture', url, e.message || e);
    }
  }

  await browser.close();
})();

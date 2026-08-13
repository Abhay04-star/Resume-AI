const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const src = fs.readFileSync(p, 'utf8');
  const obj = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.replace(/^"|"$/g, '');
    obj[key] = val;
  }
  return obj;
}

async function run() {
  const env = loadEnvLocal();
  const base = env.BASE_URL || 'http://localhost:3000';
  const mongo = env.MONGODB_URL;
  if (!mongo) {
    console.error('.env.local missing MONGODB_URL');
    process.exit(1);
  }

  await mongoose.connect(mongo, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const timestamp = Date.now();
  const email = `ui-e2e+${timestamp}@example.com`;
  const password = 'UiE2ePass123';

  console.log('Signing up with', email);
  await page.goto(`${base}/sign-up`);
  await page.fill('input[autoComplete="name"]', 'UI E2E');
  await page.fill('input[autoComplete="email"]', email);
  await page.fill('input[autoComplete="new-password"]', password);
  await page.click('button:has-text("Sign up")');

  // Wait for verification-sent flow to appear
  await page.waitForSelector('text=Verify your email', { timeout: 5000 });

  // Mark the user as verified directly in DB so we can sign in via UI
  const users = db.collection('users');
  await users.updateOne({ email }, { $set: { emailVerified: new Date() } });
  console.log('Marked user as verified in DB');

  // Sign in
  await page.goto(`${base}/sign-in`);
  await page.fill('input[autoComplete="email"]', email);
  await page.fill('input[autoComplete="current-password"]', password);
  await page.click('button:has-text("Sign in")');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Signed in and landed on dashboard');

  // Create a resume via AddResume dialog
  // Click the AddResume card trigger (first dashboard card with the create tile)
  await page.waitForSelector('div.group.relative', { timeout: 10000 });
  await page.locator('div.group.relative').first().click();
  await page.fill('input[placeholder="Example: Android Developer Resume"]', 'UI E2E Resume');
  await page.click('button:has-text("Create")');

  // Wait for navigation to edit page
  await page.waitForURL('**/my-resume/**/edit', { timeout: 20000 });
  console.log('Created resume and navigated to edit page');

  // Verify resume exists in DB
  const resumes = db.collection('resumes');
  const created = await resumes.findOne({ title: 'UI E2E Resume' });
  if (!created) {
    console.error('Resume not found in DB');
    await browser.close();
    process.exit(1);
  }
  console.log('Resume created in DB with id', created._id.toString());

  await browser.close();
  await mongoose.disconnect();
  console.log('UI E2E headed test completed successfully');
}

run().catch((e) => {
  console.error('UI E2E failed:', e && e.message ? e.message : e);
  process.exit(1);
});

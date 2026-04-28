import { chromium } from 'playwright';
(async () => {
  try {
    console.log('launching browser...');
    const browser = await chromium.launch({ headless: true });
    console.log('browser launched');
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    console.log('new page created');

    page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGEERROR', err.message));

    console.log('navigating...');
    await page.goto('http://localhost:5173/auth/register/doctor', { waitUntil: 'networkidle' });
    console.log('navigated');

    await page.screenshot({ path: 'live-before.png', fullPage: true });
    console.log('saved live-before.png');

    const password = page.locator('input[name=password]');
    await password.click();
    console.log('clicked password');
    await password.type('Abcdef1!');
    console.log('typed into password');

    const toggle = page.locator('button[aria-label="Show password"], button[aria-label="Hide password"]');
    if (await toggle.count() > 0) {
      await toggle.first().click();
      console.log('clicked toggle');
    } else {
      console.log('no toggle found');
    }

    await page.waitForTimeout(800);

    await page.screenshot({ path: 'live-after.png', fullPage: true });
    console.log('saved live-after.png');

    console.log('url:', page.url());
    console.log('page title:', await page.title());

    await browser.close();
    console.log('done');
  } catch (e) {
    console.error('script-error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();

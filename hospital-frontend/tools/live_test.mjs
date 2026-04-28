import { chromium } from 'playwright';
import fs from 'fs';
(async () => {
  try {
    const exePath = 'C:\\Users\\Hp\\AppData\\Local\\ms-playwright\\chromium-1217\\chrome-win64\\chrome.exe';
    const browser = await chromium.launch({ headless: true, executablePath: exePath });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const logs = [];
    page.on('console', msg => logs.push(['console', msg.type(), msg.text()]));
    page.on('pageerror', err => logs.push(['pageerror', err.message]));

    await page.goto('http://localhost:5173/auth/register/doctor', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'live-before.png', fullPage: true });

    const password = page.locator('input[name=password]');
    await password.click();
    await password.type('Abcdef1!');

    const toggle = page.locator('button[aria-label="Show password"], button[aria-label="Hide password"]');
    if (await toggle.count() > 0) await toggle.first().click();

    await page.waitForTimeout(800);

    const bodyText = await page.locator('body').innerText();
    const hasCreateAccount = bodyText.includes('Create Account');
    const hasPasswordStrength = bodyText.includes('Password Strength');
    const htmlLen = (await page.content()).length;

    await page.screenshot({ path: 'live-after.png', fullPage: true });

    console.log('url:', page.url());
    console.log('hasCreateAccount:', hasCreateAccount);
    console.log('hasPasswordStrength:', hasPasswordStrength);
    console.log('htmlLength:', htmlLen);
    console.log('logCount:', logs.length);
    logs.forEach((l, i) => console.log('log' + i + ':', JSON.stringify(l)));

    await browser.close();
  } catch (e) {
    console.error('script-error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();

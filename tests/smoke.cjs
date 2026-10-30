const { chromium } = require(process.env.PW || '/usr/local/lib/node_modules/playwright');
const OUT = process.env.OUT || '/tmp/shots';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }).catch(async () => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/index.html');
  await page.waitForSelector('#wform');
  await page.fill('#w-name', 'Maya'); await page.click('#wform button[type=submit]');
  await page.waitForSelector('.page-head h1');
  console.log('home title:', await page.textContent('.page-head h1'));
  await page.screenshot({ path: OUT + '/home-light.png' });
  console.log('errors', errs);
  await browser.close();
})();

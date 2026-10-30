const { chromium } = require(process.env.PW);
const OUT = '/tmp/shots/audit'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const mk = async (w, h, scheme) => { const c = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme }); const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto('http://localhost:8765/index.html'); return p; };
  const seed = async p => { await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.fill('#w-name', 'Maya'); await p.fill('#w-date', '2027-03-13'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1'); };
  for (const [w, h, tag] of [[1360, 860, 'd'], [390, 844, 'm']]) {
    const p = await mk(w, h, 'light'); await seed(p);
    await p.screenshot({ path: `${OUT}/${tag}-home.png`, fullPage: true });
    await p.goto('http://localhost:8765/index.html#/practice'); await p.waitForSelector('.page-head h1'); await p.screenshot({ path: `${OUT}/${tag}-practice.png`, fullPage: true });
    await p.evaluate(() => UI.quickSet({ title: 'Sample set', skills: ['bnd', 'cid'], n: 5, diff: 2 })); await p.waitForSelector('.sess'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${tag}-session.png`, fullPage: true });
  }
  const dk = await mk(390, 844, 'dark'); await seed(dk); await dk.screenshot({ path: `${OUT}/m-home-dark.png`, fullPage: true });
  await b.close();
})();

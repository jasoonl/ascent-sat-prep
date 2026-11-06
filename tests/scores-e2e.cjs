// Browser test for score history, PSAT scale, Selection Index and exam switching.
const { chromium } = require(process.env.PW);
const U = process.env.URL || 'http://localhost:8767/index.html', O = process.env.OUT || '/home/user/work/s3';
const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errs.push(m.text()); });
  await p.goto(U); await p.waitForSelector('#wform');
  await p.fill('#w-name', 'Maya'); await p.check('input[name="w-exam"][value="psat"]');
  ok('slider adapts to PSAT', (await p.$eval('#w-target', e => e.max)) === '1520');
  await p.click('#w-prior summary'); await p.selectOption('#w-exam', 'psat'); await p.fill('#w-date', '2025-10-15');
  ok('ids are unique on the welcome form', (await p.$$('#w-date')).length === 1 && (await p.$$('#w-testdate')).length === 1);
  await p.fill('#w-rw', '770'); await p.fill('#w-math', '700'); await p.click('#wform button[type=submit]');
  ok('bad section rejected inline', (await p.isVisible('#w-e-fields')) && (await p.textContent('#w-e-fields')).includes('160 to 760'));
  await p.fill('#w-rw', '680'); await p.fill('#w-math', '640');
  ok('total auto-filled', (await p.inputValue('#w-total')) === '1320');
  await p.screenshot({ path: O + '/welcome-prior.png', fullPage: true });
  await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
  const prof = await p.evaluate(() => { const q = Store.profile(); return { exam: q.exam, prior: q.prior }; });
  ok('profile exam psat + prior saved', prof.exam === 'psat' && prof.prior.length === 1 && prof.prior[0].total === 1320);
  const card = await p.textContent('.score-mini'); ok('home shows real score card', card.includes('1320') && card.includes('680') && card.includes('640'));
  await p.screenshot({ path: O + '/home-psat.png', fullPage: true });
  await p.evaluate(() => { location.hash = '#/scores'; }); await p.waitForSelector('.list-table');
  ok('scores table shows NM index 200', (await p.textContent('.list-table tbody')).includes('200'));
  await p.click('.page-head [data-act="addScore"]'); await p.waitForSelector('.dialog'); await p.selectOption('#sc-exam', 'sat'); await p.fill('#sc-date', '2026-03-14'); await p.fill('#sc-total', '1405');
  await p.click('.dialog-actions .btn-primary'); ok('modal stays open on error', (await p.isVisible('.dialog')) && (await p.isVisible('#sc-e-fields')));
  await p.fill('#sc-total', '1400'); await p.click('.dialog-actions .btn-primary'); await p.waitForTimeout(300);
  ok('second score listed + chart', (await p.$$('.list-table tbody tr')).length === 2 && !!(await p.$('svg.chart')));
  await p.screenshot({ path: O + '/scores.png', fullPage: true });
  await p.evaluate(() => { location.hash = '#/scholarship'; }); await p.waitForSelector('#nm-index');
  ok('nm index prefilled 200', (await p.textContent('#nm-index')) === '200');
  await p.fill('#nm-rw', '700'); await p.fill('#nm-math', '700'); ok('live calc 210', (await p.textContent('#nm-index')) === '210');
  await p.fill('#nm-target', '218'); await p.press('#nm-target', 'Tab'); await p.waitForTimeout(200);
  ok('gap text and inputs kept', (await p.textContent('#nm-gap')).includes('8 index points') && (await p.inputValue('#nm-rw')) === '700');
  await p.screenshot({ path: O + '/scholarship.png', fullPage: true });
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForSelector('[data-act="setExamAct"]');
  const t0 = await p.evaluate(() => Store.profile().target); await p.click('[data-act="setExamAct"][data-arg="sat"]'); await p.waitForTimeout(250);
  const t1 = await p.evaluate(() => Store.profile().target); ok(`target converts on exam switch (${t0} to ${t1})`, t1 === t0 + 80);
  await p.click('[data-act="setExamAct"][data-arg="psat"]'); await p.waitForTimeout(200);
  await p.evaluate(() => UI.startTest('full')); await p.click('[data-act="sessStart"]'); await p.waitForSelector('.sess');
  // answer every question correctly in all four modules through the session API, then finish
  const total = await p.evaluate(() => {
    const S = () => Store.profile().session; let guard = 0;
    while (S() && guard++ < 10) {
      const m = S().mods[S().mi]; m.ans = m.qs.map(q => q.grid ? q.a : q.ci);
      UI.acts.sessSubmit(); break;
    }
    return 0;
  });
  await p.waitForTimeout(200);
  ok('toScale caps PSAT section at 760', (await p.evaluate(() => Engine.toScale(Store.profile(), 800))) === 760);
  console.log(errs.length ? errs : 'no console errors'); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });

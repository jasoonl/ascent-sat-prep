const { chromium } = require(process.env.PW);
const OUT = process.env.OUT || '/tmp/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const cur = () => page.evaluate(() => { const S = Store.profile().session; if (!S) return null; const m = S.mods[S.mi], q = m.qs[S.qi]; return { phase: S.phase, i: S.qi, n: m.qs.length, grid: !!q.grid, ci: q.ci, a: q.a, dom: q.dom, tutor: S.tutor, sec: q.sec, mi: S.mi }; });
  const answerAll = async (acc, shotPrefix) => {
    let shots = 0, guard = 0;
    while (guard++ < 400) {
      const c = await cur(); if (!c) break;
      if (c.phase === 'intro') { await page.click('[data-act="sessStart"]'); continue; }
      if (c.phase === 'break') { await page.click('[data-act="sessEndBreak"]'); continue; }
      const right = Math.random() < (acc[c.dom] ?? 0.6);
      if (c.grid) { await page.fill('#gridin', right ? String(c.a) : '9999'); }
      else { const pick = right ? c.ci : (c.ci + 1) % 4; await page.click(`.choice:nth-child(${pick + 1}) label`); }
      if (shotPrefix && shots < 2 && c.i === 1) { await page.screenshot({ path: `${OUT}/${shotPrefix}-q-${c.sec}.png` }); shots++; }
      if (c.tutor) {
        await page.click('[data-act="sessCheck"]');
        if (shotPrefix && c.i === 0) await page.screenshot({ path: `${OUT}/${shotPrefix}-feedback.png` });
        await page.click('[data-act="sessNext"]');
      } else {
        if (c.i === c.n - 1) {
          await page.click('[data-act="sessNext"]'); await page.waitForSelector('.dialog');
          if (shotPrefix && c.mi === 0) await page.screenshot({ path: `${OUT}/${shotPrefix}-nav.png` });
          await page.click('.dialog-actions .btn-primary');
          await sleep(100);
          if (await page.$('.dialog .btn-primary')) await page.click('.dialog .btn-primary'); // confirm unanswered
          await sleep(150);
        } else await page.click('[data-act="sessNext"]');
      }
    }
  };
  await page.goto('http://localhost:8765/index.html'); await page.waitForSelector('#wform');
  await page.fill('#w-name', 'Maya'); await page.fill('#w-date', '2027-03-13'); await page.click('#wform button[type=submit]');
  await page.waitForSelector('.page-head h1');
  // diagnostic (quick)
  await page.click('[data-act="startDiag"][data-arg="1"]'); await page.waitForSelector('.sess');
  await answerAll({ cs: 0.7, ii: 0.6, sec: 0.35, eoi: 0.6, alg: 0.9, adv: 0.5, psda: 0.7, geo: 0.4 }, 'diag');
  await page.waitForSelector('.results'); console.log('diag results ok'); await page.screenshot({ path: OUT + '/results-diag.png', fullPage: true });
  await page.goto('http://localhost:8765/index.html#/home'); await page.waitForSelector('.page-head h1'); await page.screenshot({ path: OUT + '/home-after.png', fullPage: true });
  for (const r of ['progress', 'plan', 'skills', 'mistakes', 'practice', 'tests', 'parent', 'settings']) { await page.goto('http://localhost:8765/index.html#/' + r); await page.waitForSelector('.page-head h1'); await page.screenshot({ path: `${OUT}/${r}.png`, fullPage: true }); }
  // practice tutor set
  await page.goto('http://localhost:8765/index.html#/practice'); await page.click('[data-act="fixWeak"]'); await page.waitForSelector('.sess');
  await answerAll({ sec: 0.4 }, 'prac'); await page.waitForSelector('.results'); console.log('practice ok');
  // mini tests
  for (const k of ['rw1', 'math1']) {
    await page.goto('http://localhost:8765/index.html#/tests'); await page.click(`[data-act="startTest"][data-arg="${k}"]`); await page.waitForSelector('[data-act="sessStart"]');
    await page.screenshot({ path: `${OUT}/intro-${k}.png` });
    await answerAll({ cs: 0.8, ii: 0.8, sec: 0.7, eoi: 0.7, alg: 0.8, adv: 0.7, psda: 0.8, geo: 0.6 }, 'mini-' + k); await page.waitForSelector('.results'); console.log(k, 'ok');
  }
  // full test: fast path through all modules
  await page.goto('http://localhost:8765/index.html#/tests'); await page.click('[data-act="startTest"][data-arg="full"]'); await page.waitForSelector('[data-act="sessStart"]');
  await answerAll({ cs: 0.8, ii: 0.8, sec: 0.7, eoi: 0.7, alg: 0.8, adv: 0.7, psda: 0.8, geo: 0.6 }, 'full'); await page.waitForSelector('.results');
  console.log('full score:', await page.textContent('.score-big')); await page.screenshot({ path: OUT + '/results-full.png', fullPage: true });
  const summary = await page.evaluate(() => { const p = Store.profile(); return { hist: p.hist.length, missed: Object.keys(p.missed).length, tests: p.tests.length, size: JSON.stringify(Store.get()).length }; });
  console.log(summary); console.log('errors', errs);
  await browser.close();
})().catch(e => { console.error('E2E FAIL', e); process.exit(1); });

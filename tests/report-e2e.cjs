// Browser test: score report details (grade, ranges, domain bands) and the progress highlights built from them.
const { chromium } = require(process.env.PW);
const URL = process.env.URL || 'http://localhost:8767/index.html', OUT = process.env.OUT || '/home/user/work/s9';
const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) process.exitCode = 1; };
const BANDS1 = { ii: 5, cs: 5, eoi: 6, sec: 5, alg: 5, adv: 4, psda: 5, geo: 3 }, BANDS2 = { ii: 6, cs: 6, eoi: 6, sec: 7, alg: 6, adv: 5, psda: 6, geo: 4 };
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); const errs = [];
  for (const [w, h, tag] of [[1360, 900, 'd'], [390, 844, 'm']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    const prof = () => p.evaluate(() => JSON.parse(JSON.stringify(Store.profile())));
    const fillReport = async (pre, grade, ranges, bands) => {
      if (!(await p.$eval(`#${pre}-rep`, d => d.open))) await p.click(`#${pre}-rep summary`);
      await p.selectOption(`#${pre}-tgrade`, String(grade));
      for (const k of ['total', 'rw', 'math']) await p.fill(`#${pre}-r-${k}`, ranges[k] || '');
      for (const [d, v] of Object.entries(bands)) await p.selectOption(`#${pre}-b-${d}`, String(v));
    };
    // ---- welcome with a grade 10 PSAT/NMSQT and its report details ----
    await p.goto(URL); await p.waitForSelector('#wform');
    await p.fill('#w-name', 'Maya'); await p.selectOption('#w-grade', '11'); await p.click('input[name="w-exam"][value="psat"]');
    await p.click('#w-prior summary'); await p.selectOption('#w-exam', 'psat'); await p.fill('#w-date', '2024-10-16'); await p.fill('#w-rw', '600'); await p.fill('#w-math', '590');
    ok('report labels show PSAT domain shares', (await p.textContent('#w-dl-psda')).includes('20% of section, 7 to 9 questions'));
    await fillReport('w', 10, { total: '1240-1300', rw: '660-720' }, BANDS1);
    await p.click('#wform button[type=submit]');
    ok('a range that does not contain the score is rejected', (await p.isVisible('#w-e-report')) && (await p.textContent('#w-e-report')).includes('should include the score 600'));
    await p.fill('#w-r-total', '1130-1250'); await p.fill('#w-r-rw', '570-630'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
    let s = await prof(); ok('report details saved with the score', s.prior[0].grade === 10 && s.prior[0].ranges.total.join() === '1130,1250' && s.prior[0].domains.geo === 3);
    ok('home focus uses the lowest report band', (await p.textContent('.card .step-t b')).includes('Geometry and Trigonometry') && (await p.$$('.step .bands')).length >= 1);
    // ---- scholarship: grade 10 PSAT/NMSQT is practice ----
    await p.evaluate(() => { location.hash = '#/scholarship'; }); await p.waitForSelector('#nm-index');
    ok('scholarship notes a grade 10 PSAT/NMSQT does not count', (await p.textContent('.note-inline')).includes('11th grade'));
    // ---- second report, a year later ----
    await p.evaluate(() => { location.hash = '#/scores'; }); await p.waitForSelector('.list-table');
    ok('benchmark badges for the grade 10 test', (await p.textContent('.list-table')).includes('R&W benchmark met') && (await p.textContent('.list-table')).includes('Math benchmark met'));
    await p.click('.page-head [data-act="addScore"]'); await p.waitForSelector('#sc-exam');
    await p.selectOption('#sc-exam', 'psat'); await p.fill('#sc-date', '2025-10-22'); await p.fill('#sc-rw', '690'); await p.fill('#sc-math', '660');
    await fillReport('sc', 11, { total: '1300-1400', rw: '660-720', math: '620-700' }, BANDS2);
    await p.click('.dialog-actions .btn-primary'); await p.waitForTimeout(300);
    s = await prof(); ok('second score saved', s.prior.length === 2 && s.prior.some(e => e.grade === 11 && e.domains.sec === 7));
    const imp = await p.textContent('.improve');
    ok('improvement card shows +160 since the last test', imp.includes('+160 points since'));
    ok('section changes shown', imp.includes('+90') && imp.includes('+70'));
    ok('non-overlapping ranges called a likely real improvement', imp.includes('very likely a real improvement'));
    ok('domain bands that moved up are listed', imp.includes('Moved up') && imp.includes('Standard English Conventions (5 to 7)'));
    ok('band card lists all 8 domains with deltas', (await p.$$('.band-row')).length === 8 && (await p.$$('.band-row .delta.ok')).length === 7);
    await p.screenshot({ path: `${OUT}/${tag}-scores.png`, fullPage: true });
    // ---- edit: clearing a range removes it ----
    await p.click('.list-table tbody tr:first-child [data-act="editScore"]'); await p.waitForSelector('#sc-r-total');
    ok('edit form is prefilled with report details', (await p.inputValue('#sc-r-total')) === '1300-1400' && (await p.inputValue('#sc-b-sec')) === '7' && (await p.inputValue('#sc-tgrade')) === '11');
    await p.fill('#sc-r-math', ''); await p.click('.dialog-actions .btn-primary'); await p.waitForTimeout(250);
    s = await prof(); const latest = s.prior.find(e => e.date === '2025-10-22'); ok('cleared range is really removed', latest.ranges && !latest.ranges.math && latest.ranges.total);
    // ---- progress + home ----
    await p.evaluate(() => { location.hash = '#/progress'; }); await p.waitForSelector('.improve');
    ok('progress shows the improvement card and band card', (await p.$$('.improve')).length === 1 && (await p.$$('.band-row')).length === 8);
    ok('chart draws score-range whiskers', (await p.$$('.chart .whisk')).length === 6);
    await p.screenshot({ path: `${OUT}/${tag}-progress.png`, fullPage: true });
    await p.evaluate(() => { location.hash = '#/home'; }); await p.waitForSelector('.score-mini');
    ok('home score card shows the change since the last test', (await p.textContent('.score-mini')).includes('+160 since'));
    await p.screenshot({ path: `${OUT}/${tag}-home.png` });
    // ---- skill guide grouped by the official domains ----
    await p.evaluate(() => { location.hash = '#/skills'; }); await p.waitForSelector('.dom-group');
    ok('skill guide groups skills under the 8 domains', (await p.$$('.dom-group')).length === 8 && (await p.textContent('.dom-group')).length > 0);
    // ---- generated questions render and grade ----
    await p.evaluate(() => UI.quickSet({ title: 'Gen check', skills: ['rs', 'trn', 'bnd', 'fss', 'coe'], n: 10, diff: 'adaptive', back: '/home' }));
    await p.waitForSelector('.sess'); if (await p.$('[data-act="sessStart"]')) await p.click('[data-act="sessStart"]');
    await p.waitForSelector('.choice'); ok('generated RW question shows 4 choices', (await p.$$('.choice')).length === 4);
    await p.click('.choice'); if (await p.$('[data-act="sessCheck"]')) await p.click('[data-act="sessCheck"]'); await p.waitForTimeout(200);
    const fb = await p.$('.feedback'); if (fb) ok('feedback names the domain', /(Information and Ideas|Craft and Structure|Expression of Ideas|Standard English Conventions)/.test(await fb.textContent()));
    await p.screenshot({ path: `${OUT}/${tag}-genq.png` });
  }
  console.log(errs.length ? errs : 'no console errors'); if (errs.length) process.exitCode = 1; await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });

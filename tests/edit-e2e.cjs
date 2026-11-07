// Browser test: editing the target goal and previous (real) scores.
const { chromium } = require(process.env.PW);
const URL = process.env.URL || 'http://localhost:8767/index.html', OUT = process.env.OUT || '/home/user/work/s7';
const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) process.exitCode = 1; };
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const prof = () => p.evaluate(() => { const q = Store.profile(); return { target: q.target, prior: q.prior, exam: q.exam }; });
  await p.goto(URL); await p.waitForSelector('#wform');
  await p.fill('#w-name', 'Maya'); await p.click('#w-prior summary'); await p.selectOption('#w-exam', 'sat'); await p.fill('#w-date', '2026-03-14'); await p.fill('#w-rw', '660'); await p.fill('#w-math', '700');
  await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');

  // ---- goal: from Home ----
  ok('home offers Edit goal and Edit score', (await p.$$('.score-mini [data-act="editGoal"]')).length === 1 && (await p.$$('.score-mini [data-act="editScore"]')).length === 1);
  await p.click('.score-mini [data-act="editGoal"]'); await p.waitForSelector('#goal-form');
  ok('goal modal starts at the current goal', (await p.inputValue('#goal-n')) === '1300');
  await p.fill('#goal-n', '1355'); await p.click('#goal-form button[type=submit]');
  ok('a goal that is not a multiple of 10 is rejected inline', (await p.isVisible('#goal-err')) && (await p.textContent('#goal-err')).includes('multiple of 10') && (await p.isVisible('#goal-form')));
  await p.fill('#goal-n', '1700'); await p.click('#goal-form button[type=submit]');
  ok('a goal above the scale is rejected', (await p.textContent('#goal-err')).includes('800 to 1600'));
  await p.fill('#goal-n', '1400'); ok('typing moves the slider', (await p.inputValue('#goal-r')) === '1400');
  await p.fill('#goal-r', '1450'); ok('the slider updates the number', (await p.inputValue('#goal-n')) === '1450');
  ok('gap to the latest real score is shown', (await p.textContent('#goal-gap')).includes('1360'));
  await p.screenshot({ path: OUT + '/goal-modal.png' });
  await p.fill('#goal-n', '1350'); await p.click('#goal-form button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#goal-form'));
  ok('goal saved', (await prof()).target === 1350);
  ok('home shows the new goal', (await p.textContent('.score-mini')).includes('1350'));

  // ---- previous score: edit from Home ----
  await p.click('.score-mini [data-act="editScore"]'); await p.waitForSelector('#sc-exam');
  ok('edit form is prefilled', (await p.inputValue('#sc-exam')) === 'sat' && (await p.inputValue('#sc-rw')) === '660' && (await p.inputValue('#sc-math')) === '700' && (await p.inputValue('#sc-date')) === '2026-03-14');
  const idBefore = (await prof()).prior[0].id;
  await p.fill('#sc-math', '720'); ok('total follows the sections', (await p.inputValue('#sc-total')) === '1380');
  await p.click('.dialog-actions .btn-primary'); await p.waitForTimeout(250);
  let s = await prof(); ok('score edited in place, not duplicated', s.prior.length === 1 && s.prior[0].id === idBefore && s.prior[0].total === 1380 && s.prior[0].math === 720);
  ok('home reflects the corrected score', (await p.textContent('.score-mini')).includes('1380') || (await p.textContent('.score-mini')).includes('720'));

  // ---- My scores page: goal button + row edit + delete ----
  await p.evaluate(() => { location.hash = '#/scores'; }); await p.waitForSelector('.list-table');
  ok('my scores shows the goal as a button', (await p.textContent('.page-head')).includes('Goal 1350'));
  await p.click('.page-head [data-act="editGoal"]'); await p.waitForSelector('#goal-form'); await p.fill('#goal-n', '1420'); await p.click('#goal-form button[type=submit]');
  await p.waitForFunction(() => !document.querySelector('#goal-form')); ok('goal editable from my scores', (await prof()).target === 1420 && (await p.textContent('.page-head')).includes('Goal 1420'));
  await p.click('.list-table [data-act="editScore"]'); await p.waitForSelector('#sc-date'); await p.fill('#sc-date', '2026-03-15'); await p.fill('#sc-total', '1390');
  await p.click('.dialog-actions .btn-primary'); ok('a total that does not match the sections is rejected', (await p.isVisible('.dialog')) && (await p.textContent('#sc-e-fields')).includes('1380'));
  await p.fill('#sc-total', '1380'); await p.click('.dialog-actions .btn-primary'); await p.waitForTimeout(250);
  ok('date correction saved', (await prof()).prior[0].date === '2026-03-15' && (await p.textContent('.list-table tbody')).includes('Mar 15, 2026'));
  await p.screenshot({ path: OUT + '/scores-page.png', fullPage: true });
  await p.click('.list-table [data-act="delScore"]'); await p.waitForSelector('.dialog-actions .btn-danger'); await p.click('.dialog-actions .btn-danger'); await p.waitForTimeout(250);
  ok('score deleted', (await prof()).prior.length === 0 && (await p.textContent('.empty-state')).includes('No real scores yet'));

  // ---- other entry points ----
  await p.evaluate(() => { location.hash = '#/plan'; }); await p.waitForSelector('.page-head h1');
  await p.click('.card.stat [data-act="editGoal"]'); await p.waitForSelector('#goal-form'); ok('plan page opens the goal editor', (await p.inputValue('#goal-n')) === '1420'); await p.keyboard.press('Escape');
  await p.evaluate(() => { location.hash = '#/progress'; }); await p.waitForSelector('.page-head h1');
  ok('progress page links to goal and score editing', (await p.$$('[data-act="editGoal"]')).length >= 1 && (await p.$$('a[href="#/scores"]')).length >= 1);
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForSelector('[data-act="setExamAct"]');
  await p.click('[data-act="editGoal"]'); await p.waitForSelector('#goal-form'); ok('settings has an exact-score editor', (await p.inputValue('#goal-n')) === '1420'); await p.keyboard.press('Escape');

  // ---- PSAT scale ----
  await p.click('[data-act="setExamAct"][data-arg="psat"]'); await p.waitForTimeout(250);
  await p.click('[data-act="editGoal"]'); await p.waitForSelector('#goal-form');
  ok('psat goal uses the psat range', (await p.textContent('#goal-hint')).includes('640 to 1520') && (await p.getAttribute('#goal-r', 'max')) === '1520');
  await p.fill('#goal-n', '1600'); await p.click('#goal-form button[type=submit]'); ok('sat-only score rejected on the psat scale', (await p.textContent('#goal-err')).includes('640 to 1520'));
  await p.fill('#goal-n', '1300'); await p.click('#goal-form button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#goal-form'));
  ok('psat goal saved', (await prof()).target === 1300);
  console.log(errs.length ? errs : 'no console errors'); if (errs.length) process.exitCode = 1; await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });

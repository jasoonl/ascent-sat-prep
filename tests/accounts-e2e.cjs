// Browser test of cloud accounts against the built-in mock backend (window.ASCENT_CONFIG = { mock: true }).
// It checks sign up, linking progress, sync, sign out, sign in on a "fresh device", a shared computer, magic links and deletion.
const { chromium } = require(process.env.PW);
const URL = process.env.URL || 'http://localhost:8767/index.html', OUT = process.env.OUT || '/home/user/work/s5';
const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) process.exitCode = 1; };
const KEY = 'ascent.sat.v1';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); }); };
  const state = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  const mock = p => p.evaluate(() => JSON.parse(localStorage.getItem('ascent.mock.cloud') || '{"users":{},"rows":{}}'));

  /* ---- A: accounts are completely off when not configured ---- */
  {
    const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(); watch(p);
    await p.goto(URL); await p.waitForSelector('#wform');
    ok('no sign-in link on welcome when accounts are not configured', (await p.$$('.welcome-form [data-act="acctOpen"]')).length === 0);
    ok('welcome keeps the local-only privacy line', (await p.textContent('.welcome-hero')).includes('Nothing is sent anywhere'));
    await p.fill('#w-name', 'Solo'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
    ok('no account button anywhere', (await p.$$('[data-act="acctOpen"]')).length === 0 && (await p.evaluate(() => Cloud.enabled)) === false);
  }

  /* ---- B: full journey with the mock backend ---- */
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(() => { window.ASCENT_CONFIG = { mock: true }; });
  const p = await ctx.newPage(); watch(p);
  await p.goto(URL); await p.waitForSelector('#wform');
  ok('welcome offers sign in', (await p.$$('.welcome-form [data-act="acctOpen"]')).length === 1);
  ok('welcome explains cloud saving', (await p.textContent('.welcome-hero')).includes('saved to your account'));
  await p.fill('#w-name', 'Maya'); await p.click('#w-prior summary'); await p.selectOption('#w-exam', 'sat'); await p.fill('#w-date', '2026-03-14'); await p.fill('#w-rw', '660'); await p.fill('#w-math', '700');
  await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
  ok('sidebar shows Sign in', (await p.textContent('#acct-side')).includes('Sign in'));

  await p.click('#acct-side [data-act="acctOpen"]'); await p.waitForSelector('#auth-form');
  await p.click('.dialog [data-act="acctOpen"][data-arg="signup"]'); await p.waitForSelector('#auth-go');
  await p.fill('#auth-email', 'not-an-email'); await p.fill('#auth-pw', 'password123'); await p.click('#auth-go');
  ok('bad email is rejected inline', (await p.isVisible('#auth-err')) && (await p.textContent('#auth-err')).includes('valid email'));
  await p.fill('#auth-email', 'maya@example.com'); await p.fill('#auth-pw', 'short'); await p.click('#auth-go');
  ok('short password is rejected inline', (await p.textContent('#auth-err')).includes('at least 8'));
  await p.click('#auth-pwt'); ok('password can be shown', (await p.getAttribute('#auth-pw', 'type')) === 'text');
  await p.fill('#auth-pw', 'password123'); await p.screenshot({ path: OUT + '/signup.png' }); await p.click('#auth-go');
  await p.waitForSelector('.dialog-actions .btn-primary');   // "Save this progress to your account?"
  ok('asks before linking this device\'s progress', (await p.textContent('.dialog-body')).includes('Maya'));
  await p.screenshot({ path: OUT + '/link-prompt.png' });
  await p.click('.dialog-actions .btn-primary');
  await p.waitForFunction(() => Cloud.status === 'synced');
  let m = await mock(p), uid = Object.values(m.users)[0].user.id;
  ok('progress uploaded to the account', m.rows[uid] && m.rows[uid].data.name === 'Maya' && m.rows[uid].data.prior.length === 1);
  ok('uploaded profile has no live session', !('session' in m.rows[uid].data));
  ok('sidebar shows the email and sync status', (await p.textContent('#acct-side')).includes('maya@example.com') && (await p.textContent('#acct-side')).includes('Synced'));
  await p.screenshot({ path: OUT + '/signed-in.png' });

  // activity syncs
  const before = m.rows[uid].data.hist.length;
  await p.evaluate(() => { const pr = Store.profile(); for (let i = 0; i < 5; i++) { const q = Engine.pickQuestions(pr, [{ id: 'wic', w: 1 }], 1, 2)[0]; Engine.recordAnswer(pr, q, i % 2 === 0, 40000, 'p'); } Store.save(true); });
  await p.evaluate(() => Cloud.sync('test')); await p.waitForFunction(() => Cloud.status === 'synced');
  m = await mock(p); ok('new answers reach the cloud', m.rows[uid].data.hist.length === before + 5);

  // sign out and remove from this device
  await p.click('#acct-side [data-act="acctMenu"]'); await p.click('[data-act="acctSignOut"]'); await p.waitForSelector('.dialog-actions');
  await p.screenshot({ path: OUT + '/signout.png' });
  await p.click('.dialog-actions .btn-primary'); await p.waitForSelector('#wform');
  let s = await state(p);
  ok('sign out + remove clears this device', Object.keys(s.profiles).length === 0);
  ok('the account copy is untouched', (await mock(p)).rows[uid].data.hist.length === before + 5);

  // wrong password, then correct password on the "fresh device"
  await p.click('.welcome-form [data-act="acctOpen"]'); await p.waitForSelector('#auth-form');
  await p.fill('#auth-email', 'maya@example.com'); await p.fill('#auth-pw', 'wrong-password'); await p.click('#auth-go');
  await p.waitForSelector('#auth-err:not([hidden])'); ok('wrong password gives a friendly message and keeps the dialog open', (await p.textContent('#auth-err')).includes('do not match') && (await p.isVisible('#auth-form')));
  await p.fill('#auth-pw', 'password123'); await p.click('#auth-go');
  await p.waitForSelector('.page-head h1'); await p.waitForFunction(() => Cloud.status === 'synced');
  s = await state(p); const prof = Object.values(s.profiles)[0];
  ok('progress comes back on a fresh device', prof && prof.name === 'Maya' && prof.prior.length === 1 && prof.hist.length === before + 5 && prof.cloudUser === uid);
  ok('home greets by name', (await p.textContent('.page-head h1')).includes('Maya'));

  // shared computer: a second student must never inherit Maya's progress
  await p.click('#acct-side [data-act="acctMenu"]'); await p.click('[data-act="acctSignOut"]'); await p.waitForSelector('.dialog-actions');
  await p.click('.dialog-actions .btn-soft');                       // sign out, KEEP on device
  await p.waitForFunction(() => !Cloud.user);
  await p.evaluate(() => { location.hash = '#/home'; });
  await p.click('#acct-side [data-act="acctOpen"]'); await p.waitForSelector('#auth-form');
  await p.fill('#auth-email', 'sam@example.com');
  await p.click('#auth-link'); await p.waitForSelector('#auth-ok:not([hidden])'); ok('magic link confirms in plain words', (await p.textContent('#auth-ok')).includes('sign-in link'));
  await p.waitForSelector('#wform'); ok('new student is sent to set up their own profile, not given Maya\'s', true);
  await p.fill('#w-name', 'Sam'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
  await p.waitForFunction(() => Cloud.status === 'synced');
  s = await state(p); const all = Object.values(s.profiles), maya = all.find(x => x.name === 'Maya'), sam = all.find(x => x.name === 'Sam');
  const samId = Object.values((await mock(p)).users).find(u => u.user.email === 'sam@example.com').user.id;
  ok('Sam\'s profile is linked to Sam\'s account', sam.cloudUser === samId);
  ok('Maya\'s profile is still linked only to Maya', maya.cloudUser === uid && maya.cloudUser !== samId);
  ok('Maya\'s progress was not uploaded to Sam', (await mock(p)).rows[samId].data.name === 'Sam' && (await mock(p)).rows[samId].data.hist.length === 0);

  // delete account
  await p.evaluate(() => { location.hash = '#/settings'; }); await p.waitForSelector('[data-act="acctDelete"]');
  await p.screenshot({ path: OUT + '/settings-account.png', fullPage: true });
  await p.click('[data-act="acctDelete"]'); await p.waitForSelector('.dialog-actions .btn-danger'); await p.click('.dialog-actions .btn-danger');
  await p.waitForFunction(() => !Cloud.user); m = await mock(p);
  ok('account and cloud row are deleted', !m.rows[samId] && !Object.values(m.users).some(u => u.user.email === 'sam@example.com'));
  s = await state(p); ok('local profile stays but is unlinked', Object.values(s.profiles).find(x => x.name === 'Sam').cloudUser === null);

  /* ---- C: email not set up (typical for a fresh Supabase project) ---- */
  {
    const c2 = await b.newContext({ viewport: { width: 1360, height: 900 } }); await c2.addInitScript(() => { window.ASCENT_CONFIG = { mock: true, mockNoEmail: true }; });
    const q = await c2.newPage(); watch(q); await q.goto(URL); await q.waitForSelector('#wform');
    await q.fill('#w-name', 'Lee'); await q.click('#wform button[type=submit]'); await q.waitForSelector('.page-head h1');
    await q.click('#acct-side [data-act="acctOpen"]'); await q.waitForSelector('#auth-form'); await q.fill('#auth-email', 'lee@example.com'); await q.click('#auth-link');
    await q.waitForSelector('#auth-err:not([hidden])');
    ok('missing email setup gives a clear message', (await q.textContent('#auth-err')).includes('Use your password'));
  }

  console.log(errs.length ? errs : 'no console errors'); if (errs.length) process.exitCode = 1; await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });

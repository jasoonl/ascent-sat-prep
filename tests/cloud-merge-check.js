// Unit checks for the sync merge: it must never lose progress from either side.
global.window = global; const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
global.document = { addEventListener() {} }; global.navigator = { onLine: true }; global.location = { origin: 'https://x.test', pathname: '/', search: '', hash: '' };
global.addEventListener = () => {};
['skills', 'bank-rw1', 'bank-rw2', 'bank-rw3', 'bank-math', 'gen', 'core', 'config', 'cloud'].forEach(f => require('../js/' + f + '.js'));
const M = Cloud.mergeProfiles; let fails = 0; const t = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) fails++; };
const base = () => ({ id: 'p1', name: 'Maya', hist: [], prior: [], tests: [], missed: {}, seen: {}, retired: {}, doneTasks: {}, updatedAt: 100, cloudUser: 'u1', session: null });
const h = (t, q, ok = true) => ({ t, q, s: 'wic', d: 2, ok, ms: 1000, m: 'p' });

let a = base(), b = base(); a.hist = [h(1, 'a'), h(2, 'b')]; b.hist = [h(2, 'b'), h(3, 'c')]; a.updatedAt = 200;
let m = M(a, b); t('history is the union, no duplicates, in order', m.hist.map(x => x.q).join('') === 'abc');
t('neither side lost entries', m.hist.length === 3);

a = base(); b = base(); a.prior = [{ id: 's1', exam: 'sat', date: '2026-03-01', total: 1300 }]; b.prior = [{ id: 's2', exam: 'psat', date: '2025-10-01', total: 1200 }];
m = M(a, b); t('real scores from both devices are kept', m.prior.length === 2 && m.prior[0].id === 's2');
a = base(); b = base(); a.updatedAt = 50; b.updatedAt = 90; a.prior = [{ id: 's1', total: 1300 }]; b.prior = [{ id: 's1', total: 1310 }];
t('same score edited on both sides: the newer profile wins', M(a, b).prior[0].total === 1310);

a = base(); b = base(); a.updatedAt = 300; a.retired = { 'score:s9': 250 }; b.prior = [{ id: 's9', exam: 'sat', date: '2026-01-01', total: 1200 }, { id: 's10', exam: 'sat', date: '2026-02-01', total: 1300 }];
m = M(a, b); t('a deleted real score is not brought back by the other device', !m.prior.some(e => e.id === 's9') && m.prior.some(e => e.id === 's10'));
a = base(); b = base(); a.prior = [{ id: 's1', total: 1300, date: '2026-01-01' }]; a.updatedAt = 400; b.prior = [{ id: 's1', total: 1290, date: '2026-01-01' }]; b.updatedAt = 100;
t('a corrected score replaces the old value on the other device', M(a, b).prior[0].total === 1300 && M(b, a).prior[0].total === 1300);
a = base(); b = base(); b.missed = { q1: { q: { id: 'q1' }, last: 500 } }; a.retired = { q1: 600 }; a.updatedAt = 300;
t('a mistake retired later is not resurrected by the other device', !('q1' in M(a, b).missed));
a = base(); b = base(); b.missed = { q1: { q: { id: 'q1' }, last: 900 } }; a.retired = { q1: 600 };
t('a mistake missed again after retiring comes back', 'q1' in M(a, b).missed);

a = base(); b = base(); a.tests = [{ id: 't1', t: 5, slim: false, mods: [] }]; b.tests = [{ id: 't1', t: 5, slim: true, mods: [] }];
t('a detailed test is never replaced by its slim copy', M(a, b).tests[0].slim === false && M(b, a).tests[0].slim === false);

a = base(); b = base(); a.session = { id: 'live' }; b.session = { id: 'other-device' };
t('unfinished session stays on this device only', M(a, b).session.id === 'live');
a = base(); b = base(); b.session = { id: 'x' }; t('remote session is never imported', M(a, b).session === null);

a = base(); b = base(); a.updatedAt = 10; b.updatedAt = 99; a.target = 1200; b.target = 1400;
t('settings come from the newer profile', M(a, b).target === 1400 && M(b, a).target === 1400);
a = base(); b = base(); a.seen = { q1: 5 }; b.seen = { q1: 9, q2: 1 }; t('seen map keeps the latest time', M(a, b).seen.q1 === 9 && M(a, b).seen.q2 === 1);

// slim upload
const full = base(); full.session = { id: 'live', mods: [] }; full.tests = [{ id: 't', t: 1, mods: [{ name: 'M', sec: 'rw', ans: [0], ms: [1], flag: [false], qs: [{ id: 'q', s: 'wic', d: 1, sec: 'rw', dom: 'cs', p: 'long passage '.repeat(200), q: 'q?', choices: ['a', 'b', 'c', 'd'], ci: 0, e: 'x'.repeat(500) }] }] }];
const sl = Cloud.slim(full); t('upload drops the live session', !('session' in sl));
t('upload slims past tests', sl.tests[0].slim === true && !('p' in sl.tests[0].mods[0].qs[0]) && JSON.stringify(sl).length < JSON.stringify(full).length / 3);
t('upload does not alter the local profile', full.tests[0].slim === undefined && full.session.id === 'live');

t('wrong password message is friendly', Cloud.friendly({ code: 'invalid_credentials', message: 'x' }).includes('do not match'));
t('unauthorised email sender message is friendly', Cloud.friendly({ code: 'email_address_not_authorized' }).includes('Use your password'));
t('rate limit message is friendly', Cloud.friendly({ code: 'over_email_send_rate_limit' }).includes('Wait a minute'));
t('offline message is friendly', Cloud.friendly(new Error('Failed to fetch')).includes('offline'));
t('accounts are off with no config', Cloud.enabled === false);
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exitCode = fails ? 1 : 0;

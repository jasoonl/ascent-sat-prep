/* Optional cloud accounts: Supabase sign-in plus local-first sync of ONE student profile per account.
   Off unless js/config.js has a project URL and anon key. Everything works without it. */
(function () {
'use strict';
const CFG = window.ASCENT_CONFIG || {};
const SB_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
const Cloud = window.Cloud = { enabled: !!(CFG.mock || (CFG.supabaseUrl && CFG.supabaseAnonKey)), mock: !!CFG.mock, user: null, status: 'off', lastSync: 0, error: '', ready: false, hooks: {}, onChange: null };
const emit = () => { if (Cloud.onChange) { try { Cloud.onChange(); } catch (e) { /* ignore UI errors */ } } };
const setStatus = (s, err) => { Cloud.status = s; Cloud.error = err || ''; if (s === 'synced') Cloud.lastSync = Date.now(); emit(); };
const redirectUrl = () => location.origin + location.pathname;
const hook = (n, ...a) => (Cloud.hooks[n] ? Cloud.hooks[n](...a) : undefined);

/* ---------- friendly errors ---------- */
function friendly(err) {
  const m = String((err && err.message) || err || ''), c = err && (err.code || err.error_code);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(m)) return 'You seem to be offline. Check your connection and try again.';
  if (c === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'That email and password do not match.';
  if (c === 'user_already_exists' || /already registered|already exists/i.test(m)) return 'An account with that email already exists. Try signing in.';
  if (c === 'email_not_confirmed' || /not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link, then sign in.';
  if (c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit' || /rate limit|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  if (c === 'email_address_not_authorized' || c === 'email_provider_disabled') return 'Emails are not set up for this site yet, so links cannot be sent. Use your password instead.';
  if (c === 'weak_password' || /password should|weak password/i.test(m)) return m || 'Choose a stronger password.';
  if (c === 'signup_disabled' || /signups not allowed/i.test(m)) return 'New accounts are turned off for this site.';
  return m || 'Something went wrong. Try again.';
}
const isOffline = e => /failed to fetch|networkerror|load failed|network request failed/i.test(String((e && e.message) || e)) || (typeof navigator !== 'undefined' && navigator.onLine === false);

/* ---------- merge: never lose progress from either side ---------- */
const unionById = (a, b) => { const m = new Map(); for (const x of [].concat(a || [], b || [])) { const prev = m.get(x.id); if (!prev || (prev.slim && !x.slim)) m.set(x.id, x); } return Array.from(m.values()); };
const maxMerge = (a, b) => { const o = Object.assign({}, a); for (const k in (b || {})) o[k] = Math.max(o[k] || 0, b[k]); return o; };
function mergeProfiles(local, remote) {
  const localNewer = (local.updatedAt || 0) >= (remote.updatedAt || 0), newer = localNewer ? local : remote, older = localNewer ? remote : local;
  const out = Object.assign({}, older, newer), seen = new Set();
  out.hist = [].concat(local.hist || [], remote.hist || []).filter(h => { const k = h.t + ':' + h.q; if (seen.has(k)) return false; seen.add(k); return true; }).sort((x, y) => x.t - y.t).slice(-6000);
  out.prior = unionById(newer.prior, older.prior).sort((x, y) => (x.date || '').localeCompare(y.date || ''));      // same id on both sides: the newer profile's version wins
  out.tests = unionById(newer.tests, older.tests).sort((x, y) => y.t - x.t).slice(0, 60);
  out.retired = maxMerge(local.retired, remote.retired);
  out.prior = out.prior.filter(e => !out.retired['score:' + e.id]);                                                  // a deleted score stays deleted
  out.missed = {};
  for (const src of [older.missed || {}, newer.missed || {}]) for (const id in src) { const prev = out.missed[id]; if (!prev || (src[id].last || 0) >= (prev.last || 0)) out.missed[id] = src[id]; }
  for (const id in out.missed) if ((out.retired[id] || 0) >= (out.missed[id].last || 0)) delete out.missed[id];
  out.seen = maxMerge(local.seen, remote.seen);
  out.doneTasks = Object.assign({}, older.doneTasks, newer.doneTasks);
  out.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);
  out.session = local.session || null;                 // an unfinished session never travels between devices
  out.cloudUser = local.cloudUser || remote.cloudUser || null;
  return out;
}
/* What gets uploaded: no live session, and past test details are slimmed so the row stays small. */
function slim(p) {
  const c = JSON.parse(JSON.stringify(p)); delete c.session;
  c.tests = (c.tests || []).map(t => t.slim ? t : Object.assign({}, t, { slim: true, mods: t.mods.map(m => ({ name: m.name, sec: m.sec, ans: m.ans, ms: m.ms, flag: m.flag, qs: m.qs.map(q => ({ id: q.id, s: q.s, d: q.d, sec: q.sec, dom: q.dom })) })) }));
  if (JSON.stringify(c).length > 3500000) { c.hist = c.hist.slice(-3000); c.seen = {}; }
  return c;
}
const sig = x => [x.updatedAt, (x.hist || []).length, (x.prior || []).length, (x.tests || []).length, Object.keys(x.missed || {}).length, Object.keys(x.retired || {}).length].join('|');

/* ---------- adapters ---------- */
let client = null;
function loadLib() {
  if (window.supabase && window.supabase.createClient) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = SB_LIB; s.onload = res; s.onerror = () => rej(new Error('Could not load the sign-in service. Check your connection.')); document.head.appendChild(s); });
}
const real = {
  async init() {
    await loadLib();
    client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    client.auth.onAuthStateChange((event, session) => setTimeout(() => handleAuth(event, session && session.user), 0));   // defer: avoids re-entrancy inside the library
    const { data } = await client.auth.getSession(); return data.session ? data.session.user : null;
  },
  async signUp(email, password) { const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } }); if (error) throw error; return { needsConfirm: !data.session }; },
  async signIn(email, password) { const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async magicLink(email) { const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true } }); if (error) throw error; },
  async resetPassword(email) { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() }); if (error) throw error; },
  async updatePassword(password) { const { error } = await client.auth.updateUser({ password }); if (error) throw error; },
  async signOut() { const { error } = await client.auth.signOut(); if (error) throw error; },
  async pull() { const { data, error } = await client.from('student_data').select('data,updated_at').maybeSingle(); if (error) throw error; return data; },   // row-level security returns only the caller's own row
  async push(obj) { const { error } = await client.from('student_data').upsert({ user_id: Cloud.user.id, data: obj, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); if (error) throw error; },
  async deleteAccount() { const { error } = await client.rpc('delete_my_account'); if (error) throw error; try { await client.auth.signOut(); } catch (e) { /* account already gone */ } }
};
/* In-browser stand-in used by tests and demos (enable with window.ASCENT_CONFIG = { mock: true }). Not secure, never for real data. */
const MK = 'ascent.mock.cloud', MS = 'ascent.mock.session';
const mdb = () => { try { return JSON.parse(localStorage.getItem(MK)) || { users: {}, rows: {} }; } catch (e) { return { users: {}, rows: {} }; } };
const msave = d => localStorage.setItem(MK, JSON.stringify(d));
const mkErr = (msg, code) => { const e = new Error(msg); e.code = code; return e; };
const mock = {
  async init() { try { return JSON.parse(localStorage.getItem(MS)); } catch (e) { return null; } },
  async signUp(email, pw) {
    const d = mdb(); if (d.users[email]) throw mkErr('exists', 'user_already_exists');
    if (pw.length < 8) throw mkErr('Password should be at least 8 characters.', 'weak_password');
    const u = { id: 'mock-' + U.hash(email), email }; d.users[email] = { user: u, password: pw }; msave(d);
    if (CFG.mockConfirm) return { needsConfirm: true };
    localStorage.setItem(MS, JSON.stringify(u)); setTimeout(() => handleAuth('SIGNED_IN', u), 0); return { needsConfirm: false };
  },
  async signIn(email, pw) { const rec = mdb().users[email]; if (!rec || rec.password !== pw) throw mkErr('Invalid login credentials', 'invalid_credentials'); localStorage.setItem(MS, JSON.stringify(rec.user)); setTimeout(() => handleAuth('SIGNED_IN', rec.user), 0); },
  async magicLink(email) {
    if (CFG.mockNoEmail) throw mkErr('email', 'email_address_not_authorized');
    const d = mdb(); let rec = d.users[email]; if (!rec) { rec = d.users[email] = { user: { id: 'mock-' + U.hash(email), email }, password: null }; msave(d); }
    setTimeout(() => { localStorage.setItem(MS, JSON.stringify(rec.user)); handleAuth('SIGNED_IN', rec.user); }, 900);   // the "email" takes a moment to arrive and be opened
  },
  async resetPassword() { if (CFG.mockNoEmail) throw mkErr('email', 'email_address_not_authorized'); },
  async updatePassword(pw) { const d = mdb(); d.users[Cloud.user.email].password = pw; msave(d); },
  async signOut() { localStorage.removeItem(MS); setTimeout(() => handleAuth('SIGNED_OUT', null), 0); },
  async pull() { return mdb().rows[Cloud.user.id] || null; },
  async push(data) { const d = mdb(); d.rows[Cloud.user.id] = { data: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() }; msave(d); },
  async deleteAccount() { const d = mdb(); delete d.rows[Cloud.user.id]; delete d.users[Cloud.user.email]; msave(d); localStorage.removeItem(MS); setTimeout(() => handleAuth('SIGNED_OUT', null), 0); }
};
const adapter = CFG.mock ? mock : real;

/* ---------- auth events and login flow ---------- */
let inflight = null, inflightId = null;
function handleAuth(event, user) {
  if (event === 'SIGNED_OUT') { if (Cloud.user) { Cloud.user = null; setStatus('off'); hook('changed'); } return; }
  if (event === 'PASSWORD_RECOVERY') hook('recovery');
  if (user && ['SIGNED_IN', 'INITIAL_SESSION', 'PASSWORD_RECOVERY', 'USER_UPDATED'].includes(event)) ensureLogin({ id: user.id, email: user.email });
}
function ensureLogin(user) {
  if (Cloud.user && Cloud.user.id === user.id) return Promise.resolve();       // the library re-fires SIGNED_IN on tab focus
  if (inflight && inflightId === user.id) return inflight;
  inflightId = user.id;
  inflight = afterLogin(user).catch(e => setStatus(isOffline(e) ? 'offline' : 'error', friendly(e))).then(() => { inflight = null; inflightId = null; });
  return inflight;
}
const boundProfile = () => (Cloud.user ? Object.values(Store.get().profiles).find(p => p.cloudUser === Cloud.user.id) : null);
async function afterLogin(user) {
  Cloud.user = user; setStatus('syncing');
  const s = Store.get(), local = Object.values(s.profiles).find(p => p.cloudUser === user.id), remote = await adapter.pull();
  if (remote && remote.data) {
    if (local) { s.activeId = local.id; Store.save(true, { silent: true }); await doSync('login', remote); }
    else {                                               // first time on this device: bring the account's profile down. Never mix in other local profiles.
      const imp = Store.fix(Object.assign({}, remote.data, { cloudUser: user.id, session: null }));
      if (s.profiles[imp.id]) imp.id = U.uid();
      s.profiles[imp.id] = imp; s.activeId = imp.id; Store.save(true, { silent: true }); setStatus('synced');
    }
  } else if (local) { await doSync('login', null); }
  else {
    const active = Store.profile();
    if (active && !active.cloudUser) {
      const hasData = active.hist.length || active.prior.length || active.tests.length;
      if (!hasData || (await hook('askLink', active))) await bindProfile(active); else { setStatus('idle'); hook('needProfile'); }
    } else { setStatus('idle'); hook('needProfile'); }
  }
  hook('changed');
}
async function bindProfile(p) { p.cloudUser = Cloud.user.id; Store.get().activeId = p.id; Store.save(true, { silent: true }); return Cloud.sync('bind'); }

/* ---------- sync ---------- */
let chain = Promise.resolve(), pushTimer = null;
async function doSync(reason, preRemote) {
  const p = boundProfile(); if (!Cloud.user || !p) return;
  setStatus('syncing');
  try {
    const remote = preRemote !== undefined ? preRemote : await adapter.pull();
    if (remote && remote.data) { Object.assign(p, mergeProfiles(p, remote.data)); Store.save(true, { silent: true }); }
    const payload = slim(p);
    if (!remote || !remote.data || sig(payload) !== sig(remote.data)) await adapter.push(payload);
    setStatus('synced');
  } catch (e) { setStatus(isOffline(e) ? 'offline' : 'error', friendly(e)); }
}
Cloud.sync = reason => (chain = chain.then(() => doSync(reason)));
Cloud.schedulePush = () => {
  if (!Cloud.user || !boundProfile()) return;
  clearTimeout(pushTimer); pushTimer = setTimeout(() => { pushTimer = null; Cloud.sync('save'); }, 4000);
  if (Cloud.status === 'synced' || Cloud.status === 'idle') setStatus('pending');
};
Store.onSaved = () => Cloud.schedulePush();
document.addEventListener('visibilitychange', () => {
  if (!Cloud.user) return;
  if (document.hidden) { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; Cloud.sync('hide'); } }
  else if (Date.now() - Cloud.lastSync > 60000) Cloud.sync('focus');
});
window.addEventListener('online', () => { if (Cloud.user) Cloud.sync('online'); });

/* ---------- public API ---------- */
async function ready() {
  if (Cloud.ready) return;
  await Cloud.init();
  if (!Cloud.ready) throw new Error('Sign-in is unavailable right now. Check your connection and try again.');
}
const wrap = fn => async (...a) => { try { await ready(); return await fn(...a); } catch (e) { throw new Error(friendly(e)); } };
Cloud.signUp = wrap((e, p) => adapter.signUp(e, p));
Cloud.signIn = wrap((e, p) => adapter.signIn(e, p));
Cloud.magicLink = wrap(e => adapter.magicLink(e));
Cloud.resetPassword = wrap(e => adapter.resetPassword(e));
Cloud.updatePassword = wrap(p => adapter.updatePassword(p));
Cloud.init = async function () {
  if (!Cloud.enabled) return;
  try {
    const user = await adapter.init(); Cloud.ready = true;
    if (user) await ensureLogin({ id: user.id, email: user.email });
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
  } catch (e) { Cloud.ready = false; setStatus('error', friendly(e)); }
  emit(); hook('changed');
};
Cloud.boundProfile = boundProfile;
Cloud.linkActive = async () => { const p = Store.profile(); if (!Cloud.user || !p || p.cloudUser) return; await bindProfile(p); hook('changed'); };
Cloud.signOut = async function (opts) {
  const p = boundProfile();
  if (p) await Cloud.sync('signout');
  if (opts && opts.removeLocal && p && (Cloud.status === 'offline' || Cloud.status === 'error')) throw new Error('Your latest progress could not be saved to your account. Stay signed in, check your connection and try again, or sign out and keep the data on this device.');
  await adapter.signOut();
  Cloud.user = null; setStatus('off');
  if (opts && opts.removeLocal && p) Store.remove(p.id);
  emit(); hook('changed');
};
Cloud.deleteAccount = async function () {
  const p = boundProfile();
  await adapter.deleteAccount();
  if (p) { p.cloudUser = null; Store.save(true, { silent: true }); }
  Cloud.user = null; setStatus('off'); emit(); hook('changed');
};
Cloud.statusText = () => {
  if (!Cloud.user) return '';
  const ago = Math.round((Date.now() - Cloud.lastSync) / 60000);
  return { syncing: 'Syncing...', pending: 'Saving soon', offline: 'Offline, will retry', error: Cloud.error || 'Sync problem', idle: Cloud.user && !boundProfile() ? 'Signed in, not linked yet' : 'Signed in',
    synced: ago < 1 ? 'Synced just now' : `Synced ${ago} min ago` }[Cloud.status] || 'Signed in';
};
Cloud.mergeProfiles = mergeProfiles; Cloud.slim = slim; Cloud.friendly = friendly;
}());

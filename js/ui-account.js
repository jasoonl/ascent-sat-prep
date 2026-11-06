/* Account UI: sign in, create account, account menu, sign out, delete. Only shown when cloud accounts are configured. */
(function () {
'use strict';
const { $, ic } = UI;
const esc = U.esc, A = UI.account = {};
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
let dlg = null;

/* ---------- sidebar and top-bar entry point ---------- */
A.paint = () => {
  const side = $('#acct-side'), top = $('#acct-top'); if (!side && !top) return;
  let s = '', t = '';
  if (Cloud.enabled && !Cloud.user) {
    s = `<button class="who acct" data-act="acctOpen" data-arg="signin">${ic('user', 20)}<span class="who-t"><b>Sign in</b><small>Save progress to an account</small></span></button>`;
    t = `<button class="icon-btn" data-act="acctOpen" data-arg="signin" aria-label="Sign in">${ic('user', 20)}</button>`;
  } else if (Cloud.enabled) {
    const dot = `<span class="sync-dot ${Cloud.status}" aria-hidden="true"></span>`;
    s = `<button class="who acct" data-act="acctMenu" aria-label="Account menu. ${esc(Cloud.statusText())}">${dot}<span class="who-t"><b>${esc(Cloud.user.email)}</b><small>${esc(Cloud.statusText())}</small></span></button>`;
    t = `<button class="icon-btn pos-rel" data-act="acctMenu" aria-label="Account menu. ${esc(Cloud.statusText())}">${ic('user', 20)}${dot}</button>`;
  }
  if (side) side.innerHTML = s; if (top) top.innerHTML = t;
};
UI.afterRender = (UI.afterRender || []).concat([A.paint]);
Cloud.onChange = A.paint;
Cloud.hooks.changed = () => {
  A.paint();
  if (Cloud.user && dlg) dlg.close();                  // e.g. the emailed link was opened in another tab

  if (UI.route.name === 'welcome' && Cloud.user && Cloud.boundProfile()) { UI.shellOn = false; UI.go('/home'); return; }   // signed in on a new device: take them to their progress
  if (UI.route.name !== 'session') UI.render();
};
Cloud.hooks.needProfile = () => { UI.toast('Signed in. Set up your profile to continue.', 'ok'); UI.shellOn = false; UI.go('/welcome'); };
Cloud.hooks.askLink = profile => new Promise(res => {
  let answer = false;
  UI.modal({ title: 'Save this progress to your account?', body: `<p>This device already has progress for <b>${esc(profile.name)}</b> (${UI.plural(profile.hist.length, 'answer')}${profile.prior.length ? `, ${UI.plural(profile.prior.length, 'real score')}` : ''}). Link it to <b>${esc(Cloud.user.email)}</b> so it follows you to other devices?</p><p class="hint">Choose no if this progress belongs to someone else. You can then set up a fresh profile.</p>`,
    actions: [{ label: 'No, start fresh', cls: 'btn-ghost', value: false }, { label: 'Yes, save it', cls: 'btn-primary', fn: () => { answer = true; return true; } }], onClose: () => res(answer) });
});
Cloud.hooks.recovery = () => A.recovery();

/* ---------- sign in / create account / reset ---------- */
A.open = (mode = 'signin') => {
  if (dlg) dlg.close();
  const signup = mode === 'signup', reset = mode === 'reset';
  const pwField = reset ? '' : `<div class="field"><label for="auth-pw">Password</label><div class="pw-wrap"><input id="auth-pw" class="inp" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" required aria-describedby="auth-err auth-pw-hint"><button type="button" class="icon-btn sm pw-toggle" id="auth-pwt" aria-label="Show password" aria-pressed="false">${ic('eye', 18)}</button></div><p class="hint" id="auth-pw-hint">${signup ? 'At least 8 characters.' : ''}</p></div>`;
  const body = `<form id="auth-form" novalidate>
    <div class="field"><label for="auth-email">Email</label><input id="auth-email" class="inp" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required aria-describedby="auth-err"></div>
    ${pwField}
    <p class="err" id="auth-err" role="alert" hidden></p><p class="ok-t" id="auth-ok" role="status" hidden></p>
    <button class="btn btn-primary lg block" type="submit" id="auth-go" data-label="${reset ? 'Send reset link' : signup ? 'Create account' : 'Sign in'}">${reset ? 'Send reset link' : signup ? 'Create account' : 'Sign in'}</button>
    ${reset ? '' : `<button class="btn btn-ghost block" type="button" id="auth-link" style="margin-top:.5rem">Email me a sign-in link instead</button>`}
    <p class="hint tc" style="margin-top:1rem">${signup ? `Have an account? <button type="button" class="link" data-act="acctOpen" data-arg="signin">Sign in</button>` : reset ? `<button type="button" class="link" data-act="acctOpen" data-arg="signin">Back to sign in</button>` : `New here? <button type="button" class="link" data-act="acctOpen" data-arg="signup">Create an account</button> &middot; <button type="button" class="link" data-act="acctOpen" data-arg="reset">Forgot password?</button>`}</p>
    <p class="hint">Your email and practice progress are stored with Supabase so they follow you between devices. Only you can read them, and you can delete your account in Settings. You need to be 13 or older, or have a parent create the account.</p></form>`;
  dlg = UI.modal({ title: reset ? 'Reset your password' : signup ? 'Create your account' : 'Sign in', body, onClose: () => { dlg = null; } });
  wire(dlg, mode);
};
function wire(d, mode) {
  const el = d.el, form = $('#auth-form', el), err = $('#auth-err', el), ok = $('#auth-ok', el), go = $('#auth-go', el), link = $('#auth-link', el), pw = $('#auth-pw', el), email = $('#auth-email', el), pwt = $('#auth-pwt', el);
  const clear = () => { err.hidden = true; ok.hidden = true; [email, pw].forEach(i => i && i.removeAttribute('aria-invalid')); };
  const fail = (m, field) => { ok.hidden = true; err.textContent = m; err.hidden = false; if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); } };
  const info = m => { err.hidden = true; ok.textContent = m; ok.hidden = false; };
  const busy = b => { [go, link].forEach(x => { if (x) x.disabled = b; }); go.textContent = b ? 'Please wait...' : go.dataset.label; };
  if (pwt) pwt.addEventListener('click', () => { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; pwt.setAttribute('aria-pressed', show); pwt.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); pwt.innerHTML = ic(show ? 'eyeoff' : 'eye', 18); });
  const finish = () => { d.close(); UI.toast('Signed in.', 'ok'); };
  form.addEventListener('submit', async e => {
    e.preventDefault(); clear(); const em = email.value.trim().toLowerCase();
    if (!emailOk(em)) return fail('Enter a valid email address.', email);
    if (mode === 'reset') { busy(true); try { await Cloud.resetPassword(em); info('If that email has an account, a reset link is on its way. Open it in this browser.'); } catch (x) { fail(x.message); } busy(false); return; }
    if (pw.value.length < 8) return fail(mode === 'signup' ? 'Choose a password with at least 8 characters.' : 'Enter your password (at least 8 characters).', pw);
    busy(true);
    try {
      if (mode === 'signup') { const r = await Cloud.signUp(em, pw.value); if (r.needsConfirm) { info('Almost done. Check your email for a confirmation link, then come back and sign in.'); go.hidden = true; if (link) link.hidden = true; } else finish(); }
      else { await Cloud.signIn(em, pw.value); finish(); }
    } catch (x) { fail(x.message); }
    busy(false);
  });
  if (link) link.addEventListener('click', async () => {
    clear(); const em = email.value.trim().toLowerCase(); if (!emailOk(em)) return fail('Enter your email first, then choose the sign-in link.', email);
    busy(true); try { await Cloud.magicLink(em); info('We emailed you a sign-in link. Open it in this same browser to finish signing in.'); } catch (x) { fail(x.message); } busy(false);
  });
}
UI.acts.acctOpen = mode => A.open(mode);

/* ---------- set a new password after a reset link ---------- */
A.recovery = () => {
  const m = UI.modal({ title: 'Choose a new password', body: `<form id="rec-form" novalidate><div class="field"><label for="rec-pw">New password</label><input id="rec-pw" class="inp" type="password" autocomplete="new-password" minlength="8"><p class="hint">At least 8 characters.</p></div><div class="field"><label for="rec-pw2">Type it again</label><input id="rec-pw2" class="inp" type="password" autocomplete="new-password"></div><p class="err" id="rec-err" role="alert" hidden></p><button class="btn btn-primary block" type="submit">Save password</button></form>` });
  const f = $('#rec-form', m.el), err = $('#rec-err', m.el);
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.hidden = true; const a = $('#rec-pw', m.el).value, b = $('#rec-pw2', m.el).value;
    if (a.length < 8) { err.textContent = 'Use at least 8 characters.'; err.hidden = false; return; }
    if (a !== b) { err.textContent = 'The two passwords do not match.'; err.hidden = false; return; }
    try { await Cloud.updatePassword(a); m.close(); UI.toast('Password updated.', 'ok'); } catch (x) { err.textContent = x.message; err.hidden = false; }
  });
};

/* ---------- account menu, sync, sign out, delete ---------- */
A.menu = () => {
  if (!Cloud.user) return A.open('signin');
  const bound = Cloud.boundProfile(), active = Store.profile(), canLink = !bound && active && !active.cloudUser;
  const m = UI.modal({ title: 'Your account', body: `<p style="margin:0"><b>${esc(Cloud.user.email)}</b></p><p class="hint" style="margin-top:.25rem">${esc(Cloud.statusText())}</p>
    ${bound ? `<p class="hint">Saving progress for <b>${esc(bound.name)}</b>.</p>` : ''}
    ${canLink ? `<button class="btn btn-primary block" data-act="acctLink" style="margin:.75rem 0">Save ${esc(active.name)}'s progress to this account</button>` : ''}
    <div class="stack mt"><button class="btn btn-soft block" data-act="acctSync">Sync now</button><a class="btn btn-ghost block" href="#/settings" data-close-link>Account settings</a><button class="btn btn-ghost block" data-act="acctSignOut">Sign out</button></div>` });
  A.menuModal = m; m.el.addEventListener('click', e => { if (e.target.closest('[data-close-link]')) m.close(); });
};
UI.acts.acctMenu = () => A.menu();
UI.acts.acctSync = async () => { UI.toast('Syncing...'); await Cloud.sync('manual'); UI.toast(Cloud.status === 'synced' ? 'Everything is saved.' : Cloud.statusText(), Cloud.status === 'synced' ? 'ok' : 'warn'); A.paint(); };
UI.acts.acctLink = async () => { if (A.menuModal) A.menuModal.close(); await Cloud.linkActive(); UI.toast(Cloud.status === 'synced' ? 'Progress saved to your account.' : Cloud.statusText(), Cloud.status === 'synced' ? 'ok' : 'warn'); };
async function doOut(removeLocal) {
  try { UI.toast('Signing out...'); await Cloud.signOut({ removeLocal }); UI.toast('Signed out.', 'ok'); } catch (e) { UI.toast(e.message, 'warn'); }
}
UI.acts.acctSignOut = () => {
  if (A.menuModal) A.menuModal.close();
  UI.modal({ title: 'Sign out', body: `<p>Your progress is saved to your account. What should happen to the copy on this device?</p><p class="hint">Remove it if this is a shared or school computer.</p>`,
    actions: [{ label: 'Cancel', cls: 'btn-ghost' }, { label: 'Sign out, keep on this device', cls: 'btn-soft', fn: () => { setTimeout(() => doOut(false), 0); return true; } }, { label: 'Sign out and remove from this device', cls: 'btn-primary', fn: () => { setTimeout(() => doOut(true), 0); return true; } }] });
};
UI.acts.acctDelete = async () => {
  if (!(await UI.confirm('This permanently deletes your account and the progress saved in the cloud. Progress already on this device stays here. This cannot be undone.', 'Delete my account', true, 'Delete your account?'))) return;
  try { await Cloud.deleteAccount(); UI.toast('Your account was deleted.', 'ok'); } catch (e) { UI.toast(e.message, 'warn'); }
};
UI.accountCard = p => {
  if (!Cloud.enabled) return '';
  if (!Cloud.user) return `<section class="card"><h2>Account</h2><p class="sub">Sign in to save your progress to an account, so it follows you to your phone, laptop and school computer.</p><div class="row"><button class="btn btn-primary" data-act="acctOpen" data-arg="signin">Sign in</button><button class="btn btn-ghost" data-act="acctOpen" data-arg="signup">Create an account</button></div><p class="hint">You need to be 13 or older, or have a parent create the account.</p></section>`;
  return `<section class="card"><h2>Account</h2><p class="sub">Signed in as <b>${esc(Cloud.user.email)}</b>. ${esc(Cloud.statusText())}.</p><div class="row wrap"><button class="btn btn-soft" data-act="acctSync">Sync now</button><button class="btn btn-ghost" data-act="acctSignOut">Sign out</button></div>
    <hr><p class="hint" style="margin-top:0">Your email and progress are stored with Supabase. Only you can read them.</p><div class="row wrap"><button class="btn btn-danger-ghost" data-act="acctDelete">Delete my account</button></div></section>`;
};
}());

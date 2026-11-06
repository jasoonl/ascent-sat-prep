/* UI base: icons, router, shell, modals, toasts, event delegation. */
(function () {
'use strict';
const ic = (n, s = 20, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;

const UI = window.UI = { ic, routes: {}, acts: {}, ins: {}, afterRender: [], cleanup: null, route: { name: '', arg: '' } };
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
UI.$ = $; UI.$$ = $$;

/* ---------- theme ---------- */
UI.applyTheme = () => {
  const t = Store.get().settings.theme, r = document.documentElement;
  if (t === 'light' || t === 'dark') r.dataset.theme = t; else r.removeAttribute('data-theme');
};

/* ---------- toast ---------- */
UI.toast = (msg, kind = '') => {
  const box = $('#toasts'); const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg; box.appendChild(el);
  setTimeout(() => el.classList.add('out'), 3600); setTimeout(() => el.remove(), 4000);
};

/* ---------- modal / sheet ---------- */
let modalStack = [];
UI.modal = ({ title, body, actions = [], wide = false, sheet = false, onClose, label }) => {
  const root = $('#overlay'), prevFocus = document.activeElement;
  const el = document.createElement('div'); el.className = 'scrim';
  el.innerHTML = `<div class="dialog ${wide ? 'wide' : ''} ${sheet ? 'sheet' : ''}" role="dialog" aria-modal="true" aria-label="${U.esc(label || title || 'Dialog')}">
    <div class="dialog-head">${title ? `<h2>${U.esc(title)}</h2>` : '<span></span>'}<button class="icon-btn" data-close aria-label="Close dialog">${ic('x')}</button></div>
    <div class="dialog-body">${body}</div>
    ${actions.length ? `<div class="dialog-actions">${actions.map((a, i) => `<button class="btn ${a.cls || 'btn-ghost'}" data-i="${i}">${a.label}</button>`).join('')}</div>` : ''}</div>`;
  root.appendChild(el); document.body.classList.add('modal-open');
  const close = (res) => { el.remove(); modalStack = modalStack.filter(m => m !== api); if (!modalStack.length) document.body.classList.remove('modal-open'); if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { } if (onClose) onClose(res); };
  const api = { el, close };
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('[data-close]')) return close();
    const b = e.target.closest('[data-i]'); if (b) { const a = actions[+b.dataset.i]; const r = a.fn ? a.fn(api) : undefined; if (r !== false) close(a.value); }
  });
  modalStack.push(api);
  const f = $('input,select,textarea,button:not([data-close]),[tabindex="0"]', el.querySelector('.dialog-body')) || $('.btn', el) || $('[data-close]', el); if (f) f.focus();
  return api;
};
UI.confirm = (msg, ok = 'Confirm', danger = false, title = 'Are you sure?') => new Promise(res => {
  let done = false;
  UI.modal({ title, body: `<p>${msg}</p>`, actions: [{ label: 'Cancel', cls: 'btn-ghost', value: false }, { label: ok, cls: danger ? 'btn-danger' : 'btn-primary', value: true }], onClose: v => { if (!done) { done = true; res(!!v); } } });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalStack.length) { modalStack[modalStack.length - 1].close(); e.stopPropagation(); }
  if (e.key === 'Tab' && modalStack.length) { // simple focus trap
    const dlg = modalStack[modalStack.length - 1].el; const f = $$('button,input,select,textarea,a[href],[tabindex="0"]', dlg).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}, true);

/* ---------- event delegation ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = UI.acts[el.dataset.act]; if (fn) { fn(el.dataset.arg, el, e); }
});
document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && UI.ins[el.dataset.in]) UI.ins[el.dataset.in](el.value, el, e); });
document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && UI.ins[el.dataset.ch]) UI.ins[el.dataset.ch](el.type === 'checkbox' ? el.checked : el.value, el, e); });

/* ---------- navigation ---------- */
const NAV = [
  { id: 'home', label: 'Home', icon: 'home', tab: true },
  { id: 'practice', label: 'Practice', icon: 'practice', tab: true },
  { id: 'tests', label: 'Tests', icon: 'tests', tab: true },
  { id: 'progress', label: 'Progress', icon: 'progress', tab: true },
  { id: 'mistakes', label: 'Mistake notebook', icon: 'mistakes' },
  { id: 'plan', label: 'Study plan', icon: 'plan' },
  { id: 'skills', label: 'Skill guide', icon: 'skills' },
  { id: 'scores', label: 'My scores', icon: 'list' },
  { id: 'scholarship', label: 'Scholarship', icon: 'trophy' },
  { id: 'parent', label: 'Parent view', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];
UI.NAV = NAV;
UI.go = (path) => { if (location.hash === '#' + path) UI.render(); else location.hash = path; };

function shellHTML() {
  const prof = Store.profile();
  return `<a class="skip" href="#view" data-act="skip">Skip to content</a>
  <div class="shell">
    <aside class="side" aria-label="Main navigation">
      <a class="brand" href="#/home">${ic('logo', 26)}<span>Ascent <small>SAT &amp; PSAT Prep</small></span></a>
      <nav class="side-nav">${NAV.map(n => `<a class="nav-item" href="#/${n.id}" data-nav="${n.id}">${ic(n.icon, 20)}<span>${n.label}</span><i class="nav-badge" data-badge="${n.id}" hidden></i></a>`).join('')}</nav>
      <div class="side-foot">
        <div id="acct-side"></div>
        <button class="who" data-act="switchProfile" aria-label="Switch student profile"><span class="avatar" id="av1"></span><span class="who-t"><b id="whoName"></b><small>Switch student</small></span>${ic('down', 16)}</button>
        <button class="theme-btn" data-act="toggleTheme" aria-label="Toggle light and dark theme">${ic('moon', 18)}<span>Theme</span></button>
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <a class="brand sm" href="#/home">${ic('logo', 22)}<span>Ascent</span></a>
        <div class="top-r"><span id="acct-top"></span><button class="icon-btn" data-act="toggleTheme" aria-label="Toggle light and dark theme">${ic('moon', 20)}</button>
        <button class="who sm" data-act="switchProfile" aria-label="Switch student profile"><span class="avatar" id="av2"></span></button></div>
      </header>
      <main id="view" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Main navigation">${NAV.filter(n => n.tab).map(n => `<a class="tab" href="#/${n.id}" data-nav="${n.id}">${ic(n.icon, 22)}<span>${n.label}</span></a>`).join('')}
      <button class="tab" data-act="moreMenu" aria-haspopup="dialog">${ic('more', 22)}<span>More</span></button></nav>
  </div>`;
}
UI.profileInitial = p => (p && p.name ? p.name.trim()[0] : '?').toUpperCase();

UI.render = function render() {
  if (UI.cleanup) { try { UI.cleanup(); } catch (e) { } UI.cleanup = null; }
  const m = location.hash.match(/^#\/([a-z-]*)\/?(.*)$/) || [], name = m[1] || 'home', arg = decodeURIComponent(m[2] || '');
  const prof = Store.profile();
  UI.route = { name, arg };
  const app = $('#app');
  if (!prof && name !== 'welcome') { UI.go('/welcome'); return; }
  document.body.classList.toggle('focus', name === 'session');
  document.body.classList.toggle('welcome', name === 'welcome');
  if (name === 'welcome') {
    app.innerHTML = '<div id="view" tabindex="-1"></div>'; UI.shellOn = false;
  } else if (!UI.shellOn || !$('#view') || !$('.shell')) {
    app.innerHTML = shellHTML(); UI.shellOn = true;
  }
  const route = UI.routes[name] || UI.routes.home;
  const view = $('#view');
  const out = route(arg, prof);
  view.innerHTML = out.html;
  view.className = out.cls || '';
  if (prof && UI.shellOn) {
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name || (name === 'results' && a.dataset.nav === 'tests') || (name === 'session' && false)));
    $$('[data-nav]').forEach(a => a.setAttribute('aria-current', a.classList.contains('active') ? 'page' : 'false'));
    $('#whoName') && ($('#whoName').textContent = prof.name);
    $('#av1') && ($('#av1').textContent = UI.profileInitial(prof)); $('#av2') && ($('#av2').textContent = UI.profileInitial(prof));
    const due = Engine.dueMissed(prof).length, b = $('[data-badge="mistakes"]'); if (b) { b.hidden = !due; b.textContent = due; b.setAttribute('aria-label', due + ' due'); }
  }
  if (out.after) out.after(view);
  (UI.afterRender || []).forEach(f => { try { f(); } catch (e) { /* optional UI */ } });
  if (!out.keepScroll) window.scrollTo(0, 0);
  if (out.title) document.title = out.title + ' · Ascent SAT & PSAT Prep'; else document.title = 'Ascent SAT & PSAT Prep';
  if (!out.noFocus) { try { view.focus({ preventScroll: true }); } catch (e) { } }
};
window.addEventListener('hashchange', () => UI.render());

/* ---------- common acts ---------- */
UI.acts.toggleTheme = () => {
  const s = Store.get().settings, dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const cur = s.theme === 'auto' ? (dark ? 'dark' : 'light') : s.theme;
  s.theme = cur === 'dark' ? 'light' : 'dark'; Store.save(true); UI.applyTheme();
};
UI.acts.skip = (a, el, e) => { e.preventDefault(); const v = $('#view'); if (v) v.focus(); };
UI.acts.moreMenu = () => {
  const items = NAV.filter(n => !n.tab);
  const m = UI.modal({ title: 'More', sheet: true, body: `<div class="menu-list">${items.map(n => `<a class="menu-item" href="#/${n.id}" data-close-link>${ic(n.icon, 20)}<span>${n.label}</span></a>`).join('')}</div>` });
  m.el.addEventListener('click', e => { if (e.target.closest('[data-close-link]')) m.close(); });
};
UI.acts.switchProfile = () => {
  const s = Store.get(), ids = Object.keys(s.profiles);
  const m = UI.modal({ title: 'Who is studying?', body: `<div class="menu-list">${ids.map(id => { const p = s.profiles[id]; return `<button class="menu-item ${id === s.activeId ? 'on' : ''}" data-act="doSwitch" data-arg="${id}"><span class="avatar">${UI.profileInitial(p)}</span><span>${U.esc(p.name)}</span>${id === s.activeId ? ic('check', 18) : ''}</button>`; }).join('')}
    <button class="menu-item" data-act="newProfile">${ic('plus', 20)}<span>Add another student</span></button></div>` });
  UI._switchModal = m;
};
UI.acts.doSwitch = (id) => { Store.switchTo(id); if (UI._switchModal) UI._switchModal.close(); UI.shellOn = false; UI.go('/home'); UI.render(); };
UI.acts.newProfile = () => { if (UI._switchModal) UI._switchModal.close(); UI.go('/welcome'); };

/* ---------- small shared components ---------- */
UI.ring = (value, size = 96, label = '', sub = '') => {
  const r = 40, c = 2 * Math.PI * r, v = U.clamp(value, 0, 1);
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" role="img" aria-label="${U.esc(label)} ${Math.round(v * 100)} percent"><circle class="ring-bg" cx="50" cy="50" r="${r}"/><circle class="ring-fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c * v} ${c}" transform="rotate(-90 50 50)"/></svg><div class="ring-t"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
};
UI.bar = (v, cls = '', label = '') => `<div class="bar ${cls}" role="img" aria-label="${U.esc(label)} ${Math.round(U.clamp(v, 0, 1) * 100)} percent"><i style="width:${Math.round(U.clamp(v, 0, 1) * 100)}%"></i></div>`;
UI.masteryClass = (m, n) => n < 1 ? 'na' : m >= 0.72 ? 'good' : m >= 0.55 ? 'mid' : 'low';
UI.masteryLabel = (m, n) => n < 1 ? 'Not assessed' : n < 3 ? (m >= 0.55 ? 'Early read: OK' : 'Early read: weak') : m >= 0.72 ? 'Strong' : m >= 0.55 ? 'Developing' : 'Needs work';
UI.badge = (t, cls = '') => `<span class="badge ${cls}">${t}</span>`;
UI.tableHTML = t => t ? `<div class="tbl-wrap"><table class="sat-table"><thead><tr>${t.head.map(h => `<th scope="col">${fmt(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${fmt(c)}</th>` : `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
UI.fmtDate = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
UI.plural = (n, w, p) => n + ' ' + (n === 1 ? w : (p || w + 's'));
}());

/* UI base: icons, router, shell, modals, toasts, event delegation. */
(function () {
'use strict';
const ICONS = {
  logo: '<path d="m2.5 20 6.2-11 3.8 6.6 2.6-4.1L21.5 20z"/><path d="M8.7 9 10 6.8"/>',
  home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  practice: '<path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  tests: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  mistakes: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  progress: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  plan: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  skills: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-3-1-6-4-9-1 4-3 6-3 11 0 5 3 9 7 9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.4-1"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3"/>',
  ruler: '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0L2.7 16.7a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'
};
const ic = (n, s = 20, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;

const UI = window.UI = { ic, routes: {}, acts: {}, ins: {}, cleanup: null, route: { name: '', arg: '' } };
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
      <a class="brand" href="#/home">${ic('logo', 26)}<span>Ascent <small>SAT Prep</small></span></a>
      <nav class="side-nav">${NAV.map(n => `<a class="nav-item" href="#/${n.id}" data-nav="${n.id}">${ic(n.icon, 20)}<span>${n.label}</span><i class="nav-badge" data-badge="${n.id}" hidden></i></a>`).join('')}</nav>
      <div class="side-foot">
        <button class="who" data-act="switchProfile" aria-label="Switch student profile"><span class="avatar" id="av1"></span><span class="who-t"><b id="whoName"></b><small>Switch student</small></span>${ic('down', 16)}</button>
        <button class="theme-btn" data-act="toggleTheme" aria-label="Toggle light and dark theme">${ic('moon', 18)}<span>Theme</span></button>
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <a class="brand sm" href="#/home">${ic('logo', 22)}<span>Ascent</span></a>
        <div class="top-r"><button class="icon-btn" data-act="toggleTheme" aria-label="Toggle light and dark theme">${ic('moon', 20)}</button>
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
  if (!out.keepScroll) window.scrollTo(0, 0);
  if (out.title) document.title = out.title + ' · Ascent SAT Prep'; else document.title = 'Ascent SAT Prep';
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

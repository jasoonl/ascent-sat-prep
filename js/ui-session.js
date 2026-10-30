/* Session runner (practice sets, diagnostics, full adaptive tests), results and review. */
(function () {
'use strict';
const { $, $$, ic } = UI;
const MODE_CODE = { practice: 'p', daily: 'p', quiz: 'p', review: 'r', diag: 'd', test: 't' };
const SEC_NAME = { rw: 'Reading and Writing', math: 'Math' };
const LETTERS = ['A', 'B', 'C', 'D'];
let timerId = null, kbHandler = null;

const prof = () => Store.profile();
const SS = () => { const p = prof(); return p && p.session; };
const answered = a => a !== null && a !== undefined && a !== '';
const isOk = (q, a) => answered(a) && (q.grid ? gradeGrid(a, q.a) : a === q.ci);
const mod = S => S.mods[S.mi];
const persist = () => Store.save();

/* ---------- session construction ---------- */
function makeModule(S, i) {
  const def = S.plan[i]; if (S.mods[i]) return S.mods[i];
  let qs = def.qs;
  if (!qs) {
    const level = def.second ? (S.route[def.sec] && S.route[def.sec].hard ? 'hard' : 'easy') : 'mixed';
    const used = Engine.newUsed(); (S.used || []).forEach(id => used.ids.add(id));
    qs = Engine.buildModule(prof(), def.sec, level, def.count, used);
  }
  S.used = (S.used || []).concat(qs.map(q => q.id));
  const n = qs.length, p = prof(), factor = p.extended ? 1.5 : 1;
  const m = { name: def.name, sec: def.sec, qs, ans: Array(n).fill(null), flag: Array(n).fill(false), elim: qs.map(() => [false, false, false, false]), ms: Array(n).fill(0), checked: Array(n).fill(false), rec: Array(n).fill(false),
    limit: def.limit ? Math.round(def.limit * factor) : 0, done: false, hard: def.second ? !!(S.route[def.sec] && S.route[def.sec].hard) : null };
  S.mods[i] = m; return m;
}
function enterModule(S, i) {
  makeModule(S, i); S.mi = i; S.qi = 0; const m = S.mods[i];
  S.endAt = null; S._ending = false; S.phase = m.limit && !S.tutor ? 'intro' : 'q';
  if (S.phase === 'q' && m.limit) S.endAt = Date.now() + m.limit * 1000;
  S.qStart = Date.now();
}
UI.startSession = cfg => {
  const p = prof();
  if (p.session && !cfg.force) { /* replace silently, caller confirmed */ }
  const S = { id: U.uid(), mode: cfg.mode, kind: cfg.kind || 'set', title: cfg.title, tutor: !!cfg.tutor, plan: cfg.plan, mods: [], mi: 0, qi: 0, phase: 'q', startedAt: Date.now(), used: [], route: {}, back: cfg.back || '/home' };
  p.session = S; enterModule(S, 0); Store.save(true); UI.go('/session');
};
function reshuffle(q) {
  if (q.grid) return Object.assign({}, q);
  const c = U.shuffle(q.choices); return Object.assign({}, q, { choices: c, ci: c.indexOf(q.a) });
}
function paceLimit(qs) { return qs.reduce((s, q) => s + (Engine.TARGET_MS[q.sec] / 1000), 0); }

UI.quickSet = ({ title, skills, n = 10, diff = 'adaptive', tutor = true, timed = false, mode = 'practice', back = '/practice' }) => {
  const p = prof(), ids = skills && skills.length ? skills : SKILLS.map(s => s.id);
  const qs = Engine.pickQuestions(p, ids.map(id => ({ id, w: SKILL_BY_ID[id].w })), n, diff);
  if (!qs.length) { UI.toast('No questions available for that selection yet.', 'warn'); return; }
  const sec = qs.every(q => q.sec === qs[0].sec) ? qs[0].sec : 'mix';
  UI.startSession({ mode, kind: 'set', title, tutor, back, plan: [{ name: title, sec, qs, limit: timed ? Math.round(paceLimit(qs)) : 0 }] });
};
UI.startDaily = () => {
  const p = prof(), d = Engine.buildDaily(p);
  UI.startSession({ mode: 'daily', title: 'Today’s practice', tutor: true, back: '/home', plan: [{ name: 'Today’s practice', sec: 'mix', qs: d.qs, limit: 0 }] });
};
UI.startReview = (due = true) => {
  const p = prof(), list = (due ? Engine.dueMissed(p) : Object.values(p.missed)).slice(0, 25);
  if (!list.length) { UI.toast(due ? 'Nothing is due for review right now. Nice work!' : 'No saved mistakes yet.', 'ok'); return; }
  const qs = U.shuffle(list.map(m => reshuffle(m.q)));
  UI.startSession({ mode: 'review', title: due ? 'Mistake review (due now)' : 'Mistake review', tutor: true, back: '/mistakes', plan: [{ name: 'Mistake review', sec: 'mix', qs, limit: 0 }] });
};
UI.startDiagnostic = (perSkill) => {
  const p = prof(), mk = sec => {
    const used = Engine.newUsed(), qs = [];
    SKILLS.filter(s => s.sec === sec).forEach(s => {
      qs.push(...Engine.pickQuestions(p, [{ id: s.id, w: 1 }], 1, 2, used));
      if (perSkill > 1) qs.push(...Engine.pickQuestions(p, [{ id: s.id, w: 1 }], 1, U.pick([1, 3]), used));
    });
    return U.shuffle(qs);
  };
  UI.startSession({ mode: 'diag', kind: 'diag', title: 'Diagnostic', tutor: false, back: '/home', plan: [
    { name: 'Part 1: Reading and Writing', sec: 'rw', qs: mk('rw'), limit: 0 }, { name: 'Part 2: Math', sec: 'math', qs: mk('math'), limit: 0 }] });
};
UI.startTest = (kind) => {
  const T = { rw: { name: 'Reading and Writing', limit: 32 * 60, count: 27 }, math: { name: 'Math', limit: 35 * 60, count: 22 } };
  const pl = (sec, mi, pre) => ({ name: `${pre}Module ${mi + 1}: ${T[sec].name}`, sec, limit: T[sec].limit, count: T[sec].count, second: mi === 1 });
  const plans = {
    full: [pl('rw', 0, 'Section 1, '), pl('rw', 1, 'Section 1, '), pl('math', 0, 'Section 2, '), pl('math', 1, 'Section 2, ')],
    rw: [pl('rw', 0, ''), pl('rw', 1, '')], math: [pl('math', 0, ''), pl('math', 1, '')],
    rw1: [Object.assign(pl('rw', 0, ''), { name: 'Reading and Writing mini-test' })], math1: [Object.assign(pl('math', 0, ''), { name: 'Math mini-test' })]
  };
  const titles = { full: 'Full-length practice test', rw: 'Reading and Writing section test', math: 'Math section test', rw1: 'Reading and Writing mini-test', math1: 'Math mini-test' };
  UI.startSession({ mode: 'test', kind, title: titles[kind], tutor: false, back: '/tests', plan: plans[kind] });
};

/* ---------- module / session completion ---------- */
function commitModule(S, m) {
  const p = prof(), code = MODE_CODE[S.mode] || 'p';
  m.qs.forEach((q, i) => {
    const a = m.ans[i], ok = isOk(q, a);
    if (m.rec[i]) return;           // already recorded in tutor mode
    m.rec[i] = true;
    if (answered(a)) Engine.recordAnswer(p, q, ok, m.ms[i], code, a);
    else if (!p.missed[q.id]) p.missed[q.id] = { q, n: 1, box: 0, due: Date.now() + 86400000, last: Date.now(), ans: null };
  });
  m.done = true;
}
function modulePct(m) { return Engine.weightedPct(m.qs, m.qs.map((q, i) => isOk(q, m.ans[i]))); }
function submitModule() {
  const S = SS(); if (!S) return; leaveQ(S);
  const m = mod(S); commitModule(S, m);
  if (S.kind === 'full' || S.kind === 'rw' || S.kind === 'math') {
    if (!S.plan[S.mi].second) { const pct = modulePct(m); S.route[m.sec] = { m1: pct, hard: pct >= Engine.ROUTE_UP }; }
  }
  const nextI = S.mi + 1;
  if (nextI >= S.plan.length) return finishSession(S);
  const nextSec = S.plan[nextI].sec;
  enterModule(S, nextI);
  if (S.kind === 'full' && nextSec === 'math' && m.sec === 'rw') { S.phase = 'break'; S.breakEnd = Date.now() + 10 * 60 * 1000; }
  Store.save(true); UI.render();
}
function finishSession(S) {
  const p = prof(), mods = S.mods;
  const allQ = []; mods.forEach(m => m.qs.forEach((q, i) => allQ.push({ q, a: m.ans[i], ok: isOk(q, m.ans[i]), ms: m.ms[i], flag: m.flag[i], sec: m.sec })));
  const sum = { n: allQ.length, correct: allQ.filter(x => x.ok).length, answered: allQ.filter(x => answered(x.a)).length, ms: allQ.reduce((s, x) => s + x.ms, 0) };
  sum.pct = sum.n ? sum.correct / sum.n : 0;
  const scoreFor = sec => {
    const ms = mods.filter(m => m.sec === sec); if (ms.length < 2) return null;
    const hard = !!(S.route[sec] && S.route[sec].hard), m1 = modulePct(ms[0]), m2 = modulePct(ms[1]);
    return { score: Engine.scoreSection(m1, m2, hard), hard, m1, m2, c1: ms[0].qs.filter((q, i) => isOk(q, ms[0].ans[i])).length, c2: ms[1].qs.filter((q, i) => isOk(q, ms[1].ans[i])).length, n1: ms[0].qs.length, n2: ms[1].qs.length };
  };
  if (S.kind === 'full' || S.kind === 'rw') sum.rw = scoreFor('rw');
  if (S.kind === 'full' || S.kind === 'math') sum.math = scoreFor('math');
  if (S.kind === 'full' && sum.rw && sum.math) sum.total = sum.rw.score + sum.math.score;
  const rec = { id: S.id, t: Date.now(), mode: S.mode, kind: S.kind, title: S.title, tutor: S.tutor, sum, mods: mods.map(m => ({ name: m.name, sec: m.sec, qs: m.qs, ans: m.ans, ms: m.ms, flag: m.flag })), took: Date.now() - S.startedAt };
  p.tests.unshift(rec);
  p.tests.forEach((r, i) => { if (i >= 6 && !r.slim) { r.mods = r.mods.map(m => ({ name: m.name, sec: m.sec, ans: m.ans, ms: m.ms, flag: m.flag, qs: m.qs.map(q => ({ id: q.id, s: q.s, d: q.d, sec: q.sec, dom: q.dom })) })); r.slim = true; } });
  if (p.tests.length > 60) p.tests.length = 60;
  p.session = null; Store.save(true); UI.go('/results/' + rec.id);
}
UI.finishSessionNow = () => { const S = SS(); if (!S) return; leaveQ(S); const m = mod(S); commitModule(S, m); for (let i = S.mi + 1; i < S.plan.length; i++) { /* skip unbuilt modules */ } S.plan = S.plan.slice(0, S.mi + 1); finishSession(S); };

/* ---------- time tracking ---------- */
function leaveQ(S) { const m = mod(S); if (!m || S.phase !== 'q') return; const now = Date.now(); if (S.qStart) m.ms[S.qi] += Math.min(now - S.qStart, 600000); S.qStart = now; }
function gotoQ(i) { const S = SS(); if (!S) return; leaveQ(S); S.qi = U.clamp(i, 0, mod(S).qs.length - 1); S.qStart = Date.now(); persist(); UI.render(); }

/* ---------- rendering ---------- */
function passageHTML(q) {
  let s = '';
  if (q.p) s += `<div class="passage">${fmt(q.p)}</div>`;
  if (q.table) s += UI.tableHTML(q.table);
  if (q.fig) s += `<div class="figure">${q.fig}</div>`;
  return s;
}
function choicesHTML(q, st) {
  // st: {ans, elim, locked, reveal}
  if (q.grid) {
    const val = answered(st.ans) ? U.esc(st.ans) : '';
    const parsed = answered(st.ans) ? parseGrid(st.ans) : NaN;
    let cls = '', note = '';
    if (st.reveal) { const ok = gradeGrid(st.ans, q.a); cls = ok ? 'right' : 'wrong'; note = ok ? `<p class="grid-note ok">${ic('check', 16)} Correct</p>` : `<p class="grid-note bad">${ic('x', 16)} Correct answer: <b>${U.esc(q.show || q.a)}</b></p>`; }
    return `<div class="grid-box"><label class="lbl" for="gridin">Your answer</label>
      <input id="gridin" class="grid-in ${cls}" data-in="sessGrid" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="9" value="${val}" ${st.locked ? 'readonly' : ''} aria-describedby="gridhelp">
      <p id="gridhelp" class="hint">Enter a whole number, decimal, or fraction like 3/4. Use a minus sign for negatives. <span id="gridprev" aria-live="polite">${!isNaN(parsed) && answered(st.ans) ? 'Reads as ' + (Math.round(parsed * 10000) / 10000) : ''}</span></p>${note}</div>`;
  }
  return `<div class="choices" role="radiogroup" aria-label="Answer choices">${q.choices.map((c, i) => {
    let cls = '';
    if (st.ans === i) cls += ' sel';
    if (st.elim && st.elim[i]) cls += ' elim';
    if (st.reveal) { if (i === q.ci) cls += ' correct'; else if (st.ans === i) cls += ' wrong'; }
    const mark = st.reveal ? (i === q.ci ? `<span class="mark ok">${ic('check', 16)}<i>Correct</i></span>` : st.ans === i ? `<span class="mark bad">${ic('x', 16)}<i>Your answer</i></span>` : '') : '';
    return `<div class="choice${cls}"><label><input type="radio" name="choice" value="${i}" ${st.ans === i ? 'checked' : ''} ${st.locked ? 'disabled' : ''} data-ch="sessPick"><span class="letter" aria-hidden="true">${LETTERS[i]}</span><span class="ctext"><span class="sr">Choice ${LETTERS[i]}: </span>${fmt(c)}</span>${mark}</label>${st.noElim ? '' : `<button class="elim-btn" data-act="sessElim" data-arg="${i}" aria-pressed="${!!(st.elim && st.elim[i])}" aria-label="Cross out choice ${LETTERS[i]}" ${st.locked ? 'disabled' : ''}>${ic('ban', 16)}</button>`}</div>`;
  }).join('')}</div>`;
}
const MATH_REF = `<div class="ref-grid"><div><b>Circle</b><p>A = πr² &nbsp; C = 2πr</p><p>Arc length = (θ/360)·2πr</p><p>Sector area = (θ/360)·πr²</p></div>
<div><b>Rectangle &amp; triangle</b><p>A = ℓw &nbsp; A = ½bh</p><p>a² + b² = c²</p></div>
<div><b>Special right triangles</b><p>30°-60°-90°: x, x√3, 2x</p><p>45°-45°-90°: x, x, x√2</p></div>
<div><b>Volume</b><p>Box: V = ℓwh</p><p>Cylinder: V = πr²h</p><p>Sphere: V = ⁴⁄₃πr³</p><p>Cone: V = ⅓πr²h</p><p>Pyramid: V = ⅓ℓwh</p></div>
<div><b>Facts</b><p>A circle has 360° (2π radians).</p><p>A triangle’s angles sum to 180°.</p><p>The SAT lists these formulas for you on test day.</p></div></div>`;

function leftPaneNeeded(q) { return !!(q.p || q.table || q.fig) && (q.sec === 'rw' || q.p); }

function sessionTop(S, m) {
  const p = prof(), isMath = m.sec === 'math', hasTimer = !!(m.limit && S.endAt), show = p.showTimer !== false;
  return `<header class="sess-top"><div class="sess-title"><b>${U.esc(m.name)}</b><small>${S.tutor ? 'Tutor mode · feedback after each question' : S.mode === 'test' ? 'Test mode' : 'Test mode · answers revealed at the end'}</small></div>
    <div class="sess-timer" ${hasTimer ? '' : 'hidden'}><span id="timer" class="timer" role="timer" ${show ? '' : 'hidden'}>--:--</span><button class="icon-btn sm" data-act="sessTimerToggle" aria-pressed="${!show}" aria-label="${show ? 'Hide timer' : 'Show timer'}">${ic(show ? 'eyeoff' : 'eye', 18)}</button></div>
    <div class="sess-tools">${isMath ? `<button class="tool-btn" data-act="sessRef">${ic('ruler', 18)}<span>Reference</span></button><button class="tool-btn" data-act="sessCalc">${ic('calc', 18)}<span>Calculator</span></button>` : ''}
    <button class="tool-btn" data-act="sessExit">${ic('x', 18)}<span>Exit</span></button></div></header>`;
}
function questionScreen(S) {
  const p = prof(), m = mod(S), q = m.qs[S.qi], n = m.qs.length, i = S.qi;
  const ans = m.ans[i], checked = m.checked[i], locked = S.tutor && checked;
  const left = leftPaneNeeded(q) ? `<section class="pane pane-l" aria-label="Passage">${passageHTML(q)}</section>` : '';
  const topFig = !left && (q.table || q.fig) ? `<div class="inline-media">${passageHTML(q)}</div>` : '';
  const sk = SKILL_BY_ID[q.s];
  const fb = S.tutor && checked ? (() => { const ok = isOk(q, ans); return `<div class="feedback ${ok ? 'ok' : 'bad'}" role="status"><div class="fb-head">${ok ? ic('check', 20) + '<b>Correct</b>' : ic('x', 20) + '<b>Not quite</b>'}<span class="chips">${UI.badge(sk.name)}${UI.badge(['', 'Easy', 'Medium', 'Hard'][q.d], 'd' + q.d)}</span></div>
      <p class="fb-exp">${fmt(q.e)}</p><div class="fb-tip">${ic('bulb', 18)}<p><b>Skill tip: ${U.esc(sk.name)}.</b> ${U.esc(sk.tip)}</p></div></div>`; })() : '';
  const canCheck = answered(ans);
  const last = i === n - 1;
  const navBtn = `<button class="nav-q" data-act="sessNav" aria-haspopup="dialog"><span class="qw">Question </span>${i + 1} of ${n} ${ic('up', 16)}</button>`;
  const right = S.tutor
    ? (checked ? `<button class="btn btn-primary" data-act="sessNext">${last ? 'Finish' : 'Next'} ${ic('arrow', 18)}</button>` : `<button class="btn btn-ghost" data-act="sessSkip">Skip</button><button class="btn btn-primary" data-act="sessCheck" ${canCheck ? '' : 'disabled'}>Check answer</button>`)
    : `<button class="btn btn-ghost" data-act="sessBack" ${i === 0 ? 'disabled' : ''}>${ic('left', 18)} Back</button><button class="btn btn-primary" data-act="sessNext">${last ? 'Review &amp; submit' : 'Next'} ${last ? '' : ic('right', 18)}</button>`;
  return `<div class="sess ${left ? 'two' : 'one'}">${sessionTop(S, m)}
    <div class="sess-main">${left}<section class="pane pane-r" aria-label="Question">
      <div class="qhead"><span class="qnum">${i + 1}</span>${S.tutor ? '' : `<button class="flag-btn ${m.flag[i] ? 'on' : ''}" data-act="sessFlag" aria-pressed="${m.flag[i]}">${ic('flag', 16)}<span>${m.flag[i] ? 'Marked for review' : 'Mark for review'}</span></button>`}
      ${S.tutor && S.mode === 'review' ? UI.badge('From your notebook', 'dim') : ''}</div>
      ${topFig}<p class="prompt">${fmt(q.q)}</p>
      ${choicesHTML(q, { ans, elim: m.elim[i], locked, reveal: S.tutor && checked, noElim: S.tutor && checked })}${fb}</section></div>
    <footer class="sess-foot"><span class="foot-name">${U.esc(p.name)}</span>${navBtn}<div class="foot-r">${right}</div></footer></div>`;
}
function introScreen(S) {
  const m = mod(S), mins = Math.round(m.limit / 60);
  return `<div class="center-card"><div class="card tall"><span class="eyebrow">${S.kind === 'full' ? 'Full-length practice test' : U.esc(S.title)}</span><h1>${U.esc(m.name)}</h1>
    <ul class="facts"><li>${ic('list', 18)}<span><b>${m.qs.length}</b> questions</span></li><li>${ic('clock', 18)}<span><b>${mins}</b> minutes${prof().extended ? ' (extended time on)' : ''}</span></li>
    <li>${ic('flag', 18)}<span>Mark questions for review and move freely within this module</span></li>${m.sec === 'math' ? `<li>${ic('calc', 18)}<span>Calculator and reference sheet are available</span></li>` : ''}</ul>
    <p class="hint">The timer starts when you press Start. Once you submit a module you cannot go back to it, just like the real test.</p>
    <div class="row"><button class="btn btn-primary lg" data-act="sessStart">Start ${ic('arrow', 18)}</button><button class="btn btn-ghost" data-act="sessExit">Exit</button></div></div></div>`;
}
function breakScreen(S) {
  return `<div class="center-card"><div class="card tall tc"><span class="eyebrow">Break</span><h1>Take 10 minutes</h1><div class="bigtime" id="breaktime" role="timer">10:00</div>
    <p class="hint">Stand up, stretch, drink some water. Math is next. The calculator and reference sheet will be available.</p>
    <div class="row c"><button class="btn btn-primary lg" data-act="sessEndBreak">Resume testing ${ic('arrow', 18)}</button></div></div></div>`;
}
UI.routes.session = () => {
  const S = SS();
  if (!S) return { html: '<div class="card"><p>No active session.</p><a class="btn btn-primary" href="#/home">Back home</a></div>' };
  const html = S.phase === 'intro' ? introScreen(S) : S.phase === 'break' ? breakScreen(S) : questionScreen(S);
  return { html, cls: 'session-view', title: S.title, noFocus: S.phase === 'q', keepScroll: S.phase === 'q', after: setupSession };
};
function setupSession() {
  const S = SS(); if (!S) return;
  clearInterval(timerId);
  const tick = () => {
    const S2 = SS(); if (!S2) return; const m = mod(S2);
    if (S2.phase === 'q' && S2.endAt) {
      const left = Math.max(0, Math.round((S2.endAt - Date.now()) / 1000)), el = $('#timer');
      if (el) { el.textContent = U.mmss(left); el.classList.toggle('low', left <= 300); el.classList.toggle('crit', left <= 60); }
      if (left <= 0 && !S2._ending) { S2._ending = true; UI.toast('Time is up for this module.', 'warn'); submitModule(); }
    } else if (S2.phase === 'break') {
      const left = Math.max(0, Math.round((S2.breakEnd - Date.now()) / 1000)), el = $('#breaktime'); if (el) el.textContent = U.mmss(left);
      if (left <= 0) UI.acts.sessEndBreak();
    }
  };
  tick(); timerId = setInterval(tick, 500);
  if (kbHandler) document.removeEventListener('keydown', kbHandler);
  kbHandler = e => {
    const S3 = SS(); if (!S3 || S3.phase !== 'q' || modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' && e.target.type !== 'radio' || tag === 'textarea';
    const m = mod(S3), q = m.qs[S3.qi];
    if (typing) { if (e.key === 'Enter' && S3.tutor && !m.checked[S3.qi]) UI.acts.sessCheck(); return; }
    if (!q.grid && /^[1-4a-dA-D]$/.test(e.key) && !(S3.tutor && m.checked[S3.qi])) { const i = /\d/.test(e.key) ? +e.key - 1 : e.key.toLowerCase().charCodeAt(0) - 97; UI.ins.sessPick(String(i)); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && !S3.tutor) { if (S3.qi < m.qs.length - 1) gotoQ(S3.qi + 1); }
    else if (e.key === 'ArrowLeft' && !S3.tutor) { if (S3.qi > 0) gotoQ(S3.qi - 1); }
    else if ((e.key === 'f' || e.key === 'F') && !S3.tutor) UI.acts.sessFlag();
  };
  document.addEventListener('keydown', kbHandler);
  UI.cleanup = () => { clearInterval(timerId); if (kbHandler) document.removeEventListener('keydown', kbHandler); kbHandler = null; if (UI.route.name !== 'session') closeCalc(); };
}
const modalOpen = () => document.body.classList.contains('modal-open');

/* ---------- actions ---------- */
UI.ins.sessPick = (v) => {
  const S = SS(); if (!S) return; const m = mod(S); if (S.tutor && m.checked[S.qi]) return;
  m.ans[S.qi] = +v; persist();
  $$('.choice').forEach((c, i) => { c.classList.toggle('sel', i === +v); const r = $('input', c); if (r) r.checked = i === +v; });
  const cb = $('[data-act="sessCheck"]'); if (cb) cb.disabled = false;
};
UI.ins.sessGrid = (v, el) => {
  const S = SS(); if (!S) return; const m = mod(S); if (S.tutor && m.checked[S.qi]) return;
  const clean = v.replace(/[^0-9./\-−]/g, ''); if (clean !== v) el.value = clean;
  m.ans[S.qi] = clean === '' ? null : clean; persist();
  const pv = parseGrid(clean); $('#gridprev').textContent = clean && !isNaN(pv) ? 'Reads as ' + (Math.round(pv * 10000) / 10000) : '';
  const cb = $('[data-act="sessCheck"]'); if (cb) cb.disabled = !answered(m.ans[S.qi]);
};
UI.acts.sessElim = (i) => { const S = SS(), m = mod(S); m.elim[S.qi][+i] = !m.elim[S.qi][+i]; const c = $$('.choice')[+i]; c.classList.toggle('elim', m.elim[S.qi][+i]); $('.elim-btn', c).setAttribute('aria-pressed', m.elim[S.qi][+i]); if (m.ans[S.qi] === +i && m.elim[S.qi][+i]) { /* keep selection */ } persist(); };
UI.acts.sessFlag = () => { const S = SS(), m = mod(S); m.flag[S.qi] = !m.flag[S.qi]; persist(); const b = $('.flag-btn'); if (b) { b.classList.toggle('on', m.flag[S.qi]); b.setAttribute('aria-pressed', m.flag[S.qi]); $('span', b).textContent = m.flag[S.qi] ? 'Marked for review' : 'Mark for review'; } };
UI.acts.sessBack = () => gotoQ(SS().qi - 1);
UI.acts.sessNext = () => {
  const S = SS(), m = mod(S), last = S.qi === m.qs.length - 1;
  if (S.tutor) { if (last) return UI.finishSessionNow(); return gotoQ(S.qi + 1); }
  if (last) return UI.acts.sessNav('submit'); gotoQ(S.qi + 1);
};
UI.acts.sessSkip = () => { const S = SS(), m = mod(S); if (S.qi === m.qs.length - 1) return UI.finishSessionNow(); gotoQ(S.qi + 1); };
UI.acts.sessCheck = () => {
  const S = SS(); if (!S) return; const m = mod(S), i = S.qi, q = m.qs[i]; if (m.checked[i] || !answered(m.ans[i])) return;
  leaveQ(S); m.checked[i] = true; const ok = isOk(q, m.ans[i]);
  if (!m.rec[i]) { m.rec[i] = true; Engine.recordAnswer(prof(), q, ok, m.ms[i], MODE_CODE[S.mode] || 'p', m.ans[i]); }
  Store.save(true); S.qStart = Date.now(); UI.render();
  const fb = $('.feedback'); if (fb) fb.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};
UI.acts.sessStart = () => { const S = SS(), m = mod(S); S.phase = 'q'; S.endAt = Date.now() + m.limit * 1000; S.qStart = Date.now(); Store.save(true); UI.render(); };
UI.acts.sessEndBreak = () => { const S = SS(); if (!S || S.phase !== 'break') return; S.phase = 'intro'; Store.save(true); UI.render(); };
UI.acts.sessTimerToggle = () => { const p = prof(); p.showTimer = p.showTimer === false; Store.save(); UI.render(); };
UI.acts.sessRef = () => UI.modal({ title: 'Reference sheet', body: MATH_REF, wide: true });
UI.acts.sessNav = (mode) => {
  const S = SS(), m = mod(S), isSubmit = mode === 'submit';
  const unans = m.qs.filter((q, i) => !answered(m.ans[i])).length, flagged = m.flag.filter(Boolean).length;
  const grid = m.qs.map((q, i) => { const a = answered(m.ans[i]); return `<button class="qdot ${a ? 'done' : ''} ${i === S.qi ? 'cur' : ''} ${m.flag[i] ? 'flag' : ''}" data-act="sessGoto" data-arg="${i}" aria-label="Question ${i + 1}, ${a ? 'answered' : 'unanswered'}${m.flag[i] ? ', marked for review' : ''}${i === S.qi ? ', current' : ''}">${i + 1}${m.flag[i] ? ic('flag', 12) : ''}</button>`; }).join('');
  const body = `<p class="hint">${S.tutor ? '' : isSubmit ? 'You reached the end of this module. Check your work before you submit.' : 'Jump to any question in this module.'}</p><div class="qgrid">${grid}</div>
    <div class="legend"><span><i class="qdot done sm"></i> Answered</span><span><i class="qdot sm"></i> Unanswered</span><span><i class="qdot sm flag"></i> Marked</span></div>
    ${S.tutor ? '' : `<p class="${unans ? 'warn-t' : 'ok-t'}">${unans ? `${ic('alert', 16)} ${UI.plural(unans, 'question')} unanswered` : `${ic('check', 16)} Every question has an answer`}${flagged ? ` · ${flagged} marked for review` : ''}</p>`}`;
  UI._navModal = UI.modal({ title: m.name, body, sheet: true, wide: true, actions: S.tutor ? [] : [{ label: 'Keep working', cls: 'btn-ghost' }, { label: S.plan[S.mi + 1] ? 'Submit module' : 'Submit &amp; see results', cls: 'btn-primary', fn: () => { UI.acts.sessSubmit(); return true; } }] });
};
UI.acts.sessGoto = (i) => { if (UI._navModal) UI._navModal.close(); gotoQ(+i); };
UI.acts.sessSubmit = () => {
  const S = SS(), m = mod(S), un = m.qs.filter((q, i) => !answered(m.ans[i])).length;
  const go = () => submitModule();
  if (un) setTimeout(() => UI.confirm(`${UI.plural(un, 'question')} ${un === 1 ? 'is' : 'are'} unanswered and will count as incorrect. Submit anyway?`, 'Submit', false, 'Submit this module?').then(ok => ok && go()), 30); else setTimeout(go, 30);
};
UI.acts.sessExit = () => {
  const S = SS(); if (!S) return; const timed = S.mods[S.mi] && S.mods[S.mi].limit && S.phase === 'q';
  UI.modal({ title: 'Leave this session?', body: `<p>Your progress is saved automatically.${timed ? ' The timer keeps running while you are away.' : ''}</p>`, actions: [
    { label: 'Keep working', cls: 'btn-ghost' },
    { label: 'Save &amp; exit', cls: 'btn-primary', fn: () => { leaveQ(S); Store.save(true); UI.go(S.back || '/home'); return true; } },
    { label: 'End &amp; see results', cls: 'btn-danger', fn: () => { setTimeout(UI.finishSessionNow, 30); return true; } }] });
};
UI.resumeSession = () => UI.go('/session');
UI.acts.discardSession = async () => { if (await UI.confirm('Discard the unfinished session? Answers you already checked are kept in your stats.', 'Discard', true)) { prof().session = null; Store.save(true); UI.render(); } };

/* ---------- calculator ---------- */
let desmosCalc = null;
function closeCalc() { const c = $('#calc'); if (c) c.remove(); desmosCalc = null; }
function loadDesmos(cb) {
  if (window.Desmos) return cb(true); let done = false; const fin = v => { if (!done) { done = true; cb(v); } };
  const s = document.createElement('script'); s.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'; s.onload = () => fin(!!window.Desmos); s.onerror = () => fin(false); document.head.appendChild(s); setTimeout(() => fin(!!window.Desmos), 6000);
}
UI.acts.sessCalc = () => {
  if ($('#calc')) return closeCalc();
  const el = document.createElement('div'); el.id = 'calc'; el.className = 'calc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Graphing calculator');
  el.innerHTML = `<div class="calc-head"><b>${ic('calc', 16)} Calculator</b><button class="icon-btn sm" data-act="closeCalc" aria-label="Close calculator">${ic('x', 18)}</button></div><div class="calc-body" id="calcbody"><p class="hint pad">Loading Desmos…</p></div>`;
  document.body.appendChild(el);
  loadDesmos(ok => {
    const body = $('#calcbody'); if (!body) return;
    if (ok) { body.innerHTML = '<div id="desmos" style="height:100%"></div>'; try { desmosCalc = Desmos.GraphingCalculator($('#desmos'), { keypad: true, expressions: true, settingsMenu: false }); } catch (e) { basicCalc(body); } }
    else basicCalc(body);
  });
};
UI.acts.closeCalc = closeCalc;
function basicCalc(body) {
  body.innerHTML = `<div class="basic-calc pad"><p class="hint">Offline calculator. Supports + − × ÷ ^ ( ), sqrt(), sin(), cos(), tan() (degrees), pi.</p><input id="bc-in" class="grid-in" placeholder="e.g. 3*(4+5)^2" aria-label="Expression"><div class="bc-out" id="bc-out" aria-live="polite">&nbsp;</div></div>`;
  $('#bc-in').addEventListener('input', e => {
    const raw = e.target.value.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    try {
      if (!/^[0-9a-z+\-*/().^,\s%]*$/.test(raw)) throw 0; const words = raw.match(/[a-z]+/g) || []; if (words.some(w => !['sqrt', 'sin', 'cos', 'tan', 'pi', 'abs', 'log', 'ln', 'e'].includes(w))) throw 0;
      const js = raw.replace(/\^/g, '**').replace(/\bpi\b/g, 'Math.PI').replace(/\bsqrt\b/g, 'Math.sqrt').replace(/\babs\b/g, 'Math.abs').replace(/\bln\b/g, 'Math.log').replace(/\blog\b/g, 'Math.log10').replace(/\b(sin|cos|tan)\(/g, 'D$1(').replace(/\be\b/g, 'Math.E');
      const v = Function('Dsin', 'Dcos', 'Dtan', '"use strict";return (' + (js || '0') + ')')(x => Math.sin(x * Math.PI / 180), x => Math.cos(x * Math.PI / 180), x => Math.tan(x * Math.PI / 180));
      $('#bc-out').textContent = raw.trim() === '' ? ' ' : (isFinite(v) ? '= ' + Math.round(v * 1e9) / 1e9 : 'undefined');
    } catch (err) { $('#bc-out').textContent = raw.trim() ? '…' : ' '; }
  });
}

/* =================== RESULTS & REVIEW =================== */
function recQuestions(rec) { const a = []; rec.mods.forEach((m, mi) => m.qs.forEach((q, i) => a.push({ q, a: m.ans[i], ok: isOk(q, m.ans[i]), ms: m.ms[i], flag: m.flag[i], mi, i, sec: m.sec, mod: m.name }))); return a; }
UI.reviewItem = (x, idx) => {
  const q = x.q; if (!q.p && !q.q) return `<p class="hint">Details are only kept for your 6 most recent sessions.</p>`;
  const sk = SKILL_BY_ID[q.s];
  const status = !answered(x.a) ? 'skip' : x.ok ? 'ok' : 'bad';
  return `<details class="rv ${status}${x.flag ? ' fl' : ''}"><summary><span class="rv-n">${idx}</span><span class="rv-s">${status === 'ok' ? ic('check', 16) : status === 'skip' ? ic('alert', 16) : ic('x', 16)}<span class="sr">${status === 'ok' ? 'Correct' : status === 'skip' ? 'Unanswered' : 'Incorrect'}</span></span>
    <span class="rv-t">${U.esc(sk.name)}</span>${UI.badge(['', 'Easy', 'Medium', 'Hard'][q.d], 'd' + q.d)}${x.flag ? UI.badge(ic('flag', 12) + ' Marked', 'dim') : ''}<span class="rv-ms">${x.ms ? Math.round(x.ms / 1000) + 's' : ''}</span>${ic('down', 16, 'chev')}</summary>
    <div class="rv-body">${q.p ? `<div class="passage sm">${fmt(q.p)}</div>` : ''}${UI.tableHTML(q.table)}${q.fig ? `<div class="figure">${q.fig}</div>` : ''}<p class="prompt">${fmt(q.q)}</p>
    ${choicesHTML(q, { ans: x.a, locked: true, reveal: true, noElim: true })}
    ${!answered(x.a) ? `<p class="grid-note bad">${ic('alert', 16)} You did not answer this one.${q.grid ? ` Correct answer: <b>${U.esc(q.show || q.a)}</b>` : ''}</p>` : ''}
    <div class="feedback ${x.ok ? 'ok' : 'bad'}"><p class="fb-exp">${fmt(q.e)}</p><div class="fb-tip">${ic('bulb', 18)}<p><b>Skill tip: ${U.esc(sk.name)}.</b> ${U.esc(sk.tip)}</p></div></div></div></details>`;
};
UI.routes.results = (id) => {
  const p = prof(), rec = p.tests.find(r => r.id === id);
  if (!rec) return { html: `<div class="card"><h1>Results not found</h1><p>This session is no longer saved.</p><a class="btn btn-primary" href="#/home">Back home</a></div>` };
  const qs = recQuestions(rec), s = rec.sum;
  const byDom = {}; qs.forEach(x => { const d = x.q.dom; (byDom[d] = byDom[d] || { n: 0, ok: 0 }); byDom[d].n++; if (x.ok) byDom[d].ok++; });
  const bySk = {}; qs.forEach(x => { const k = x.q.s; (bySk[k] = bySk[k] || { n: 0, ok: 0, ms: 0 }); bySk[k].n++; if (x.ok) bySk[k].ok++; bySk[k].ms += x.ms || 0; });
  const worst = Object.entries(bySk).filter(([k, v]) => v.n >= 1 && v.ok / v.n < 0.75).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 4);
  const doms = Object.keys(byDom).sort((a, b) => DOMAINS[a].sec.localeCompare(DOMAINS[b].sec));
  const scoreBlock = s.total ? `<div class="score-hero"><div><span class="eyebrow">Estimated score</span><div class="score-big">${s.total}</div><small>out of 1600 · target ${p.target}</small></div>
      <div class="score-split"><div><b>${s.rw.score}</b><span>Reading &amp; Writing</span><small>${s.rw.c1}/${s.rw.n1} then ${s.rw.c2}/${s.rw.n2} · ${s.rw.hard ? 'harder' : 'easier'} 2nd module</small></div>
      <div><b>${s.math.score}</b><span>Math</span><small>${s.math.c1}/${s.math.n1} then ${s.math.c2}/${s.math.n2} · ${s.math.hard ? 'harder' : 'easier'} 2nd module</small></div></div></div>`
    : (s.rw && !s.math) || (s.math && !s.rw) ? (() => { const x = s.rw || s.math; return `<div class="score-hero"><div><span class="eyebrow">Estimated section score</span><div class="score-big">${x.score}</div><small>out of 800 · ${x.hard ? 'second module was harder' : 'second module was easier'}</small></div></div>`; })()
    : `<div class="score-hero"><div><span class="eyebrow">${U.esc(rec.title)}</span><div class="score-big">${s.correct}<small class="of">/${s.n}</small></div><small>${U.pct(s.pct)} correct</small></div></div>`;
  const nextSteps = worst.length ? worst.map(([k, v]) => `<div class="step"><div><b>${U.esc(SKILL_BY_ID[k].name)}</b><small>${v.ok}/${v.n} correct this session</small></div><button class="btn btn-soft sm" data-act="practiceSkill" data-arg="${k}">${ic('practice', 16)} Practice</button></div>`).join('') : `<p class="hint">No weak spots in this session, keep the streak going.</p>`;
  const html = `<div class="page results">
    <div class="page-head"><div><span class="eyebrow">${UI.fmtDate(rec.t)} · ${Math.round(rec.took / 60000)} min</span><h1>${U.esc(rec.title)}${rec.mode === 'diag' ? ' results' : ''}</h1></div>
      <div class="row"><a class="btn btn-ghost" href="#/${rec.mode === 'test' ? 'tests' : rec.mode === 'diag' ? 'plan' : 'practice'}">${rec.mode === 'diag' ? 'See my study plan' : 'Done'}</a></div></div>
    ${scoreBlock}
    <div class="grid2">
      <section class="card"><h2>Accuracy by area</h2><div class="stack">${doms.map(d => { const v = byDom[d], a = v.ok / v.n; return `<div class="rowbar"><span class="rb-l">${DOMAINS[d].short}</span>${UI.bar(a, UI.masteryClass(a, 9), DOMAINS[d].name)}<span class="rb-v">${v.ok}/${v.n}</span></div>`; }).join('')}</div></section>
      <section class="card"><h2>Next steps</h2>${rec.mode === 'diag' ? `<p class="hint">Your diagnostic has set your starting skill levels. The study plan now targets these first:</p>` : ''}${nextSteps}
        ${rec.mode === 'diag' ? `<a class="btn btn-primary mt" href="#/plan">${ic('plan', 18)} Build my study plan</a>` : `<a class="btn btn-soft mt" href="#/mistakes">${ic('mistakes', 18)} Open mistake notebook</a>`}</section></div>
    ${s.n ? `<section class="card"><h2>Pace</h2><div class="stats3"><div><b>${Math.round(s.ms / Math.max(1, s.answered) / 1000)}s</b><span>avg per answered question</span></div><div><b>${s.answered}/${s.n}</b><span>answered</span></div><div><b>${qs.filter(x => x.flag).length}</b><span>marked for review</span></div></div>
      <p class="hint">Real-test pace is about ${Math.round(Engine.TARGET_MS.rw / 1000)}s per Reading &amp; Writing question and ${Math.round(Engine.TARGET_MS.math / 1000)}s per Math question.</p></section>` : ''}
    <section class="card"><div class="card-head"><h2>Review every question</h2><div class="chips-row" role="group" aria-label="Filter questions">
      ${[['all', 'All'], ['bad', 'Incorrect'], ['skip', 'Unanswered'], ['flag', 'Marked']].map(([k, l], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-act="rvFilter" data-arg="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div></div>
      <div id="rvlist">${rec.slim ? `<p class="hint">Detailed question review is kept for your 6 most recent sessions. Missed questions are still in your mistake notebook.</p>` : qs.map((x, i) => UI.reviewItem(x, i + 1)).join('')}</div></section></div>`;
  return { html, title: 'Results' };
};
UI.acts.rvFilter = (k, el) => {
  $$('.chips-row .chip').forEach(c => { c.classList.toggle('on', c === el); c.setAttribute('aria-pressed', c === el); });
  $$('#rvlist .rv').forEach(d => { const show = k === 'all' || (k === 'bad' && d.classList.contains('bad')) || (k === 'skip' && d.classList.contains('skip')) || (k === 'flag' && d.classList.contains('fl')); d.hidden = !show; });
};
UI.acts.practiceSkill = (id) => UI.quickSet({ title: SKILL_BY_ID[id].name + ' practice', skills: [id], n: 10, diff: 'adaptive', back: '/practice' });
UI.confirmStart = async (fn) => { const p = prof(); if (p.session && !(await UI.confirm('You have an unfinished session. Starting a new one will replace it.', 'Start new', true, 'Replace current session?'))) return; fn(); };
}());

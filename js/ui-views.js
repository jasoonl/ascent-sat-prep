/* Main views: welcome, home, practice, tests, mistakes, progress, plan, skills, parent, settings. */
(function () {
'use strict';
const { $, $$, ic } = UI;
const prof = () => Store.profile();
const SEC_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const esc = U.esc;

function pageHead(title, sub, right = '') { return `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="row">${right}</div></div>`; }
function countdownChip(p) {
  const d = U.daysUntil(p.testDate); if (d === null) return '';
  return `<span class="chip-stat ${d <= 14 ? 'hot' : ''}">${ic('plan', 16)}${d < 0 ? 'Test date passed' : d === 0 ? 'Test day!' : `${d} day${d === 1 ? '' : 's'} to test`}</span>`;
}

/* Welcome / onboarding lives in ui-scores.js */
UI.ins.restoreFile = (v, el) => {
  const f = el.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => { try { Store.importAll(r.result); UI.toast('Backup restored.', 'ok'); UI.shellOn = false; UI.go('/home'); UI.render(); } catch (e) { UI.toast(e.message || 'That file could not be read.', 'warn'); } };
  r.readAsText(f);
};

/* =================== HOME =================== */
UI.routes.home = (a, p) => {
  const est = Engine.estimate(p), an = Engine.analyze(p), st = Engine.streak(p), td = Engine.todayStats(p), due = Engine.dueMissed(p).length, sc = Engine.examOf(p), lvl = Engine.currentLevel(p), E = Engine.EXAMS;
  const goalMin = p.dailyMin, doneMin = Math.round(td.ms / 60000), goalPct = U.clamp(doneMin / goalMin, 0, 1);
  const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const lastFull = p.tests.find(t => t.sum && t.sum.total);
  const act = Engine.activityDays(p, 14), maxAct = Math.max(5, ...act.map(d => d.n));
  const first = p.hist.length < 10;
  const resume = p.session ? `<div class="banner">${ic('clock', 20)}<div><b>Unfinished session</b><span>${esc(p.session.title)}</span></div><div class="row"><button class="btn btn-primary sm" data-act="resumeSession">Resume</button><button class="btn btn-ghost sm" data-act="discardSession">Discard</button></div></div>` : '';
  const ringTo = lvl.total != null ? UI.ring(U.clamp((lvl.total - sc.min) / Math.max(1, p.target - sc.min), 0, 1), 104, lvl.total, lvl.source === 'practice' ? 'estimated' : 'last real') : '';
  const gapText = lvl.total != null ? (lvl.total >= p.target ? `You are at your ${p.target} goal. Aim higher or lock it in with timed tests.` : `${p.target - lvl.total} points to your ${p.target} goal.`) : '';
  const scoreCard = lvl.source !== 'none' ? `<div class="score-mini"><div class="sm-top">${ringTo}
      <div class="sm-r"><div><b>${lvl.rw}</b><span>Reading &amp; Writing</span></div><div><b>${lvl.math}</b><span>Math</span></div></div></div>
      <p class="hint">${gapText} ${lvl.source === 'practice' ? `Estimated from ${est.n} practice questions.` : `From your ${E[lvl.entry.exam].name} on ${new Date(lvl.entry.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}. Practice will refine this.`}</p></div>`
    : `<div class="score-mini"><div class="sm-top">${UI.ring(U.clamp(est.n / 40, 0, 1), 104, est.n + '/40', 'questions')}<div class="sm-r"><p>Answer about <b>40 questions</b> to unlock your score estimate and weak-spot analysis, or <button class="link" data-act="addScore">add a real score</button>.</p></div></div></div>`;
  const priorPrompt = p.prior.length ? '' : `<div class="banner soft">${ic('trophy', 20)}<div><b>Taken the SAT or PSAT before?</b><span>Add your score so practice starts at the right level and your plan knows the gap to your goal.</span></div><button class="btn btn-soft sm" data-act="addScore">Add a score</button></div>`;
  const nm = sc.id !== 'sat' ? Engine.nmEstimate(p) : null;
  const focusHTML = an.focus.length ? an.focus.map(x => `<div class="step"><div class="step-t"><b>${esc(x.skill.name)}</b><small>${esc(DOMAINS[x.skill.dom].short)} · ${esc(Engine.reasonFor(x))}</small>${UI.bar(x.m, UI.masteryClass(x.m, x.n), x.skill.name + ' mastery')}</div><button class="btn btn-soft sm" data-act="practiceSkill" data-arg="${x.skill.id}">${ic('practice', 16)} Practice</button></div>`).join('')
    : `<p class="empty">${first ? 'Take the diagnostic and your weakest skills will show up here.' : 'No clear weak spots yet. Keep practicing across different skills.'}</p>`;
  const stepsHTML = `<section class="card"><h2>How this works</h2><ol class="steps"><li><b>1. Take the diagnostic</b><span>About 27 questions, one per skill, so we can see where you stand.</span></li><li><b>2. See your weak spots</b><span>Your results rank every skill and show what to practice first.</span></li><li><b>3. Follow your daily plan</b><span>Short sessions that adapt as you improve, plus a notebook for every miss.</span></li></ol></section>`;
  const html = `<div class="page">
    ${pageHead(`${greet}, ${esc(p.name)}`, `${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`, `${st ? `<span class="chip-stat hot">${ic('flame', 16)}${st}-day streak</span>` : ''}${sc.id !== 'sat' ? `<a class="chip-stat" href="#/scholarship">${ic('trophy', 16)}${sc.name}${nm ? ` · NM index ~${nm.index}` : ''}</a>` : ''}${countdownChip(p)}`)}
    ${resume}
    ${priorPrompt}
    ${first ? `<section class="hero-card"><div><span class="eyebrow">Start here</span><h2>Take the diagnostic</h2><p>A one-sitting check of every ${sc.name} skill. It takes about ${p.hist.length ? '25' : '35'}-70 minutes (you can stop and resume) and tells us exactly what to practice first.</p>
      <div class="row"><button class="btn btn-primary lg" data-act="startDiag" data-arg="1">${ic('target', 18)} Quick diagnostic · 27 questions</button><button class="btn btn-ghost" data-act="startDiag" data-arg="2">Full · 54 questions</button></div></div></section>` : ''}
    <div class="grid3">
      <section class="card today"><div class="card-head"><h2>Today’s practice</h2></div><p class="sub">${p.dailyMin}-minute plan · built from your weak spots${due ? ` and ${due} due mistake${due > 1 ? 's' : ''}` : ''}.</p>
        <div class="today-prog"><div class="bar"><i style="width:${Math.round(goalPct * 100)}%"></i></div><small>${doneMin} of ${goalMin} min · ${td.n} question${td.n === 1 ? '' : 's'} today</small></div>
        <button class="btn ${first ? 'btn-soft' : 'btn-primary'} lg block" data-act="startDaily">${ic('play', 18)} ${td.n ? 'Keep going' : 'Start'} today’s practice</button></section>
      <section class="card"><div class="card-head"><h2>Score estimate</h2></div>${scoreCard}${lastFull ? `<p class="hint">Last full test: <b>${lastFull.sum.total}</b> on ${UI.fmtDate(lastFull.t)}</p>` : ''}</section>
      <section class="card"><div class="card-head"><h2>Mistake notebook</h2></div><div class="big-n">${Object.keys(p.missed).length}<small>saved</small></div><p class="sub">${due ? `<b>${due}</b> ${due === 1 ? 'is' : 'are'} due for review now.` : 'Nothing due right now.'}</p>
        <div class="row"><button class="btn btn-soft" data-act="reviewDue" ${due ? '' : 'disabled'}>${ic('refresh', 16)} Review due</button><a class="btn btn-ghost" href="#/mistakes">Open</a></div></section>
    </div>
    ${first ? stepsHTML : `<div class="grid2">
      <section class="card"><div class="card-head"><h2>Where to focus</h2><a class="link" href="#/progress">All skills ${ic('right', 14)}</a></div>${focusHTML}
        ${an.unassessed.length && !first ? `<p class="hint">${an.unassessed.length} skills have too few questions to judge yet.</p>` : ''}</section>
      <section class="card"><div class="card-head"><h2>Last 14 days</h2></div><div class="spark" role="img" aria-label="Questions answered per day for the last 14 days">${act.map(d => `<div class="spark-c" title="${d.key}: ${d.n} questions"><i style="height:${Math.max(4, Math.round(d.n / maxAct * 100))}%" class="${d.n ? 'on' : ''}"></i><small>${'SMTWTFS'[d.dow]}</small></div>`).join('')}</div>
        ${an.notes.length ? an.notes.map(n => `<div class="note ${n.k === 'up' ? 'ok' : ''}">${ic(n.k === 'up' ? 'trophy' : 'bulb', 18)}<p>${esc(n.t)}</p></div>`).join('') : `<p class="hint">${p.hist.length} questions answered in total.</p>`}</section>
    </div>`}</div>`;
  return { html, title: 'Home' };
};
UI.acts.startDaily = () => UI.confirmStart(() => UI.startDaily());
UI.acts.startDiag = (n) => UI.confirmStart(() => UI.startDiagnostic(+n));
UI.acts.reviewDue = () => UI.confirmStart(() => UI.startReview(true));

/* =================== PRACTICE =================== */
UI.setup = { sec: 'both', skills: new Set(), n: 10, diff: 'adaptive', tutor: true, timed: false };
function builderHTML() {
  const S = UI.setup, p = prof(), st = Engine.skillStats(p);
  const doms = Object.values(DOMAINS).filter(d => S.sec === 'both' || d.sec === S.sec);
  const picked = S.skills.size;
  return `<div class="field"><span class="lbl">Section</span><div class="seg" role="radiogroup" aria-label="Section">${[['both', 'Both'], ['rw', 'Reading & Writing'], ['math', 'Math']].map(([k, l]) => `<button class="seg-i ${S.sec === k ? 'on' : ''}" role="radio" aria-checked="${S.sec === k}" data-act="setupSec" data-arg="${k}"><span>${l}</span></button>`).join('')}</div></div>
  <div class="field"><span class="lbl">Skills <span class="opt">${picked ? picked + ' selected' : 'none selected = all skills'}</span></span>
    ${doms.map(d => { const sk = SKILLS.filter(s => s.dom === d.id), all = sk.every(s => S.skills.has(s.id)); return `<div class="dom-g"><div class="dom-h"><b>${d.name}</b><button class="link" data-act="setupDom" data-arg="${d.id}">${all ? 'Clear' : 'Select all'}</button></div><div class="chips-row">${sk.map(s => { const x = st[s.id], cls = UI.masteryClass(x.m, x.n); return `<button class="chip skill ${S.skills.has(s.id) ? 'on' : ''}" data-act="setupSkill" data-arg="${s.id}" aria-pressed="${S.skills.has(s.id)}"><i class="dot ${cls}" aria-hidden="true"></i>${esc(s.name)}<span class="sr"> (${UI.masteryLabel(x.m, x.n)})</span></button>`; }).join('')}</div></div>`; }).join('')}</div>
  <div class="form-row"><div class="field"><label for="s-n">Questions</label><select id="s-n" class="inp" data-ch="setupN">${[5, 10, 15, 20, 30, 40].map(n => `<option ${S.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label for="s-d">Difficulty</label><select id="s-d" class="inp" data-ch="setupD">${[['adaptive', 'Adaptive (recommended)'], ['mixed', 'Mixed'], ['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']].map(([k, l]) => `<option value="${k}" ${String(S.diff) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
  <div class="toggles"><label class="switch"><input type="checkbox" data-ch="setupTutor" ${S.tutor ? 'checked' : ''}><span class="sw"></span><span><b>Tutor mode</b><small>See the answer and explanation after each question</small></span></label>
    <label class="switch"><input type="checkbox" data-ch="setupTimed" ${S.timed ? 'checked' : ''}><span class="sw"></span><span><b>Timed</b><small>Real-test pace (about 71s Reading &amp; Writing, 95s Math per question)</small></span></label></div>
  <button class="btn btn-primary lg" data-act="setupStart">${ic('play', 18)} Start ${S.n} questions</button>`;
}
function refreshBuilder() { const b = $('#builder'); if (b) b.innerHTML = builderHTML(); }
UI.routes.practice = (a, p) => {
  const an = Engine.analyze(p), due = Engine.dueMissed(p).length, ai = Store.get().aiCfg;
  const html = `<div class="page">${pageHead('Practice', 'Targeted sets with instant explanations.')}
    <div class="tiles">
      <button class="tile" data-act="startDaily"><span class="tile-i">${ic('zap', 22)}</span><b>Today’s practice</b><small>${p.dailyMin} min · auto-picked for you</small></button>
      <button class="tile" data-act="fixWeak" ${an.focus.length ? '' : 'disabled'}><span class="tile-i">${ic('target', 22)}</span><b>Fix my weak spots</b><small>${an.focus.length ? an.focus.map(x => esc(x.skill.name)).slice(0, 2).join(', ') : 'Needs more data, try the diagnostic'}</small></button>
      <button class="tile" data-act="reviewDue" ${due ? '' : 'disabled'}><span class="tile-i">${ic('refresh', 22)}</span><b>Review mistakes</b><small>${due ? due + ' due now' : 'Nothing due'}</small></button>
      <button class="tile" data-act="startDiag" data-arg="1"><span class="tile-i">${ic('grid', 22)}</span><b>Diagnostic</b><small>27 questions · one per skill</small></button>
    </div>
    <section class="card"><div class="card-head"><h2>Build your own set</h2></div><div id="builder">${builderHTML()}</div></section>
    <section class="card"><details class="plain"><summary><h2>${ic('sparkles', 18)} Add more questions (optional)</h2></summary>
      <p class="sub">The built-in bank has ${Bank.total()} written questions plus unlimited generated math problems. You can also import your own question packs or generate extra questions with an AI key.</p>
      <div class="row"><a class="btn btn-soft" href="#/settings">${ic('upload', 16)} Import or generate</a></div></details></section></div>`;
  return { html, title: 'Practice' };
};
UI.acts.setupSec = (k) => { UI.setup.sec = k; UI.setup.skills = new Set([...UI.setup.skills].filter(id => k === 'both' || SKILL_BY_ID[id].sec === k)); refreshBuilder(); };
UI.acts.setupSkill = (id) => { const s = UI.setup.skills; s.has(id) ? s.delete(id) : s.add(id); refreshBuilder(); };
UI.acts.setupDom = (d) => { const ids = SKILLS.filter(s => s.dom === d).map(s => s.id), s = UI.setup.skills, all = ids.every(i => s.has(i)); ids.forEach(i => all ? s.delete(i) : s.add(i)); refreshBuilder(); };
UI.ins.setupN = v => { UI.setup.n = +v; $('[data-act="setupStart"]').lastChild.textContent = ` Start ${v} questions`; };
UI.ins.setupD = v => { UI.setup.diff = v === 'adaptive' || v === 'mixed' ? v : +v; };
UI.ins.setupTutor = v => { UI.setup.tutor = v; };
UI.ins.setupTimed = v => { UI.setup.timed = v; };
UI.acts.setupStart = () => {
  const S = UI.setup; let ids = [...S.skills]; if (!ids.length && S.sec !== 'both') ids = SKILLS.filter(s => s.sec === S.sec).map(s => s.id);
  const title = ids.length === 1 ? SKILL_BY_ID[ids[0]].name : S.sec === 'rw' ? 'Reading & Writing practice' : S.sec === 'math' ? 'Math practice' : ids.length ? 'Custom practice' : 'Mixed practice';
  UI.confirmStart(() => UI.quickSet({ title, skills: ids, n: S.n, diff: S.diff, tutor: S.tutor, timed: S.timed, back: '/practice' }));
};
UI.acts.fixWeak = () => { const an = Engine.analyze(prof()); UI.confirmStart(() => UI.quickSet({ title: 'Weak-spot practice', skills: an.focus.map(x => x.skill.id), n: 15, diff: 'adaptive', back: '/practice' })); };

/* =================== TESTS =================== */
UI.routes.tests = (a, p) => {
  const sc = Engine.examOf(p);
  const card = (kind, icon, title, desc, facts, primary) => `<article class="card test-card ${primary ? 'primary' : ''}"><span class="tile-i">${ic(icon, 22)}</span><h2>${title}</h2><p>${desc}</p><ul class="facts sm">${facts.map(f => `<li>${f}</li>`).join('')}</ul><button class="btn ${primary ? 'btn-primary' : 'btn-soft'}" data-act="startTest" data-arg="${kind}">${ic('play', 16)} Start</button></article>`;
  const hist = p.tests.filter(t => t.mode === 'test' || t.mode === 'diag' || t.mode === 'quiz' || t.mode === 'practice' || t.mode === 'daily' || t.mode === 'review').slice(0, 12);
  const html = `<div class="page">${pageHead('Practice tests', `Timed, adaptive and built like the Digital ${sc.name}: two modules per section, and Module 2 gets harder or easier based on Module 1.${sc.id !== 'sat' ? ` Scores use the ${sc.name} scale (${sc.min} to ${sc.max}).` : ''}`)}
    <div class="banner soft">${ic('info', 20)}<div><b>${p.extended ? 'Extended time (1.5×) is on' : 'Standard timing'}</b><span>Change this in <a href="#/settings">Settings</a>. Your score here is an estimate, expect real results to vary.</span></div></div>
    <div class="grid3">
      ${card('full', 'tests', 'Full-length test', '2 Reading &amp; Writing modules, a 10-minute break, then 2 Math modules.', ['98 questions', '2 h 14 min', 'Adaptive'], true)}
      ${card('rw', 'book', 'Reading &amp; Writing section', 'Both adaptive modules of the verbal section.', ['54 questions', '64 min'], false)}
      ${card('math', 'calc', 'Math section', 'Both adaptive modules, with calculator and reference sheet.', ['44 questions', '70 min'], false)}
      ${card('rw1', 'clock', 'R&amp;W mini-test', 'One module of Reading &amp; Writing.', ['27 questions', '32 min'], false)}
      ${card('math1', 'clock', 'Math mini-test', 'One module of Math.', ['22 questions', '35 min'], false)}
      <article class="card test-card"><span class="tile-i">${ic('target', 22)}</span><h2>Diagnostic</h2><p>One question per skill (or two). Untimed, great for a fresh baseline.</p><ul class="facts sm"><li>27 or 54 questions</li><li>Untimed</li></ul><div class="row"><button class="btn btn-soft" data-act="startDiag" data-arg="1">Quick</button><button class="btn btn-ghost" data-act="startDiag" data-arg="2">Full</button></div></article>
    </div>
    <section class="card"><div class="card-head"><h2>History</h2></div>${hist.length ? `<div class="tbl-wrap"><table class="list-table"><thead><tr><th scope="col">Date</th><th scope="col">Session</th><th scope="col">Score / result</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>${hist.map(r => `<tr><td>${UI.fmtDate(r.t)}</td><td>${esc(r.title)}</td><td>${r.sum.total ? `<b>${r.sum.total}</b> <small>RW ${r.sum.rw.score} · Math ${r.sum.math.score}</small>` : r.sum.rw && !r.sum.math ? `<b>${r.sum.rw.score}</b> <small>/${Engine.EXAMS[r.sum.exam || 'sat'].secMax}</small>` : r.sum.math && !r.sum.rw ? `<b>${r.sum.math.score}</b> <small>/${Engine.EXAMS[r.sum.exam || 'sat'].secMax}</small>` : `${r.sum.correct}/${r.sum.n} <small>${U.pct(r.sum.pct)}</small>`}</td><td><a class="btn btn-ghost sm" href="#/results/${r.id}">Review</a></td></tr>`).join('')}</tbody></table></div>` : `<p class="empty">No sessions yet. Your first test will appear here.</p>`}</section></div>`;
  return { html, title: 'Tests' };
};
UI.acts.startTest = (k) => UI.confirmStart(() => UI.startTest(k));

/* =================== MISTAKES =================== */
UI.mistakeFilter = 'all';
UI.routes.mistakes = (a, p) => {
  const now = Date.now(), all = Object.values(p.missed).sort((x, y) => x.due - y.due), due = all.filter(m => m.due <= now).length;
  const list = all.filter(m => UI.mistakeFilter === 'all' || (UI.mistakeFilter === 'due' ? m.due <= now : m.q.sec === UI.mistakeFilter));
  const html = `<div class="page">${pageHead('Mistake notebook', 'Every question you miss lands here and comes back after 1, 3, 7, 14 and 30 days. Answer it right each time to retire it.',
    `<button class="btn btn-primary" data-act="reviewDue" ${due ? '' : 'disabled'}>${ic('refresh', 16)} Review ${due} due</button><button class="btn btn-ghost" data-act="reviewAll" ${all.length ? '' : 'disabled'}>Review all</button>`)}
    <div class="chips-row" role="group" aria-label="Filter">${[['all', `All (${all.length})`], ['due', `Due (${due})`], ['rw', 'Reading & Writing'], ['math', 'Math']].map(([k, l]) => `<button class="chip ${UI.mistakeFilter === k ? 'on' : ''}" aria-pressed="${UI.mistakeFilter === k}" data-act="mFilter" data-arg="${k}">${l}</button>`).join('')}</div>
    ${list.length ? `<div class="rvlist">${list.map((m, i) => { const x = { q: m.q, a: m.ans === undefined ? null : m.ans, ok: false, ms: 0 }; const isDue = m.due <= now; return `<div class="mrow"><div class="mrow-h"><span class="badge ${isDue ? 'warn' : 'dim'}">${isDue ? 'Due now' : 'Next ' + UI.fmtDate(m.due)}</span><span class="mrow-n">Missed ${m.n}× · step ${m.box + 1}/5</span><button class="icon-btn sm" data-act="mDelete" data-arg="${m.q.id}" aria-label="Remove from notebook">${ic('trash', 16)}</button></div>${UI.reviewItem(x, i + 1)}</div>`; }).join('')}</div>`
      : `<div class="empty-state">${ic('check', 40)}<h2>${all.length ? 'Nothing matches this filter' : 'Your notebook is empty'}</h2><p>${all.length ? 'Try another filter.' : 'Missed questions appear here automatically. Go practice!'}</p><a class="btn btn-primary" href="#/practice">Start practicing</a></div>`}</div>`;
  return { html, title: 'Mistakes' };
};
UI.acts.mFilter = (k) => { UI.mistakeFilter = k; UI.render(); };
UI.acts.mDelete = (id) => { const p = prof(); delete p.missed[id]; (p.retired = p.retired || {})[id] = Date.now(); Store.save(true); UI.render(); };
UI.acts.reviewAll = () => UI.confirmStart(() => UI.startReview(false));

/* =================== PROGRESS =================== */
UI.lineChart = function (points, target, sc) {
  sc = sc || Engine.EXAMS.sat;
  if (points.length < 2) return `<p class="empty">Add a real score and finish a full-length test, or add two scores, to see your trend.</p>`;
  const W = 640, H = 250, l = 48, r = 28, t = 16, b = 36, pw = W - l - r, ph = H - t - b;
  const vals = points.map(p => p.v).concat(target ? [target] : []);
  let min = Math.max(sc.min, Math.floor((Math.min(...vals) - 100) / 100) * 100), max = Math.min(sc.max, Math.ceil((Math.max(...vals) + 100) / 100) * 100);
  if (max - min < 300) { const mid = (max + min) / 2; min = Math.max(sc.min, Math.round((mid - 150) / 100) * 100); max = Math.min(sc.max, min + 300); min = Math.max(sc.min, max - 300); }
  const X = i => l + i / (points.length - 1) * pw, Y = v => t + ph - U.clamp((v - min) / (max - min), 0, 1) * ph;
  const ticks = [0, 1, 2, 3].map(i => Math.round((min + (max - min) * i / 3) / 10) * 10);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Scores over time: ${points.map(p => (p.k === 'real' ? 'real test ' : 'practice test ') + p.v + ' on ' + p.d).join(', ')}">`;
  ticks.forEach(v => { s += `<line class="grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
  if (target) s += `<line class="target" x1="${l}" x2="${W - r}" y1="${Y(target)}" y2="${Y(target)}"/><text class="tick tgt" x="${l + 4}" y="${Y(target) + 14}">Goal ${target}</text>`;
  s += `<polyline class="ln" points="${points.map((p, i) => X(i) + ',' + Y(p.v)).join(' ')}"/>`;
  points.forEach((p, i) => {
    const x = X(i), y = Y(p.v), tip = `<title>${p.k === 'real' ? 'Real ' + (p.label || 'test') : 'Practice test'}: ${p.v} on ${p.d}</title>`;
    s += p.k === 'real' ? `<rect class="pt real" x="${x - 6}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${x} ${y})">${tip}</rect>` : `<circle class="pt" cx="${x}" cy="${y}" r="5">${tip}</circle>`;
    const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle', ax = i === 0 ? x - 6 : i === points.length - 1 ? x + 6 : x;
    s += `<text class="tick" x="${ax}" y="${y - 12}" text-anchor="${anchor}">${p.v}</text><text class="tick" x="${ax}" y="${H - 12}" text-anchor="${anchor}">${p.d}</text>`;
  });
  return s + `</svg><p class="legend-chart"><span><i class="lg-dot"></i> Practice test</span><span><i class="lg-dia"></i> Real test</span></p>`;
};
UI.routes.progress = (a, p) => {
  const sc = Engine.examOf(p), E = Engine.EXAMS, an = Engine.analyze(p), est = Engine.estimate(p);
  const fmtD = t => UI.fmtDate(t);
  const pts = p.tests.filter(t => t.sum && t.sum.total).map(t => ({ t: t.t, v: U.clamp(t.sum.total + 2 * (E[t.sum.exam || 'sat'].offset - sc.offset), sc.min, sc.max), d: fmtD(t.t), k: 'practice' }))
    .concat(Engine.priorScores(p).map(e => ({ t: new Date(e.date + 'T00:00:00').getTime(), v: Engine.inProfileScale(p, e).total, d: fmtD(new Date(e.date + 'T00:00:00').getTime()), k: 'real', label: E[e.exam].name })))
    .sort((x, y) => x.t - y.t);
  const pace = sec => { const b = an.bySec[sec]; return b.ms.length ? Math.round(U.median(b.ms) / 1000) : null; };
  const dRow = (d, l) => { const [ok, n] = an.byDiff[d]; return `<div class="rowbar"><span class="rb-l">${l}</span>${UI.bar(n ? ok / n : 0, n ? UI.masteryClass(ok / n, 9) : 'na', l + ' accuracy')}<span class="rb-v">${n ? Math.round(ok / n * 100) + '%' : '-'} <small>(${n})</small></span></div>`; };
  const domBlock = d => { const sk = an.list.filter(x => x.skill.dom === d.id); const avg = sk.reduce((s, x) => s + x.m, 0) / sk.length;
    return `<div class="dom-card"><div class="dom-t"><b>${d.name}</b><small>${SEC_LABEL[d.sec]} · ~${Math.round(d.w * 100)}% of the section</small></div>${sk.map(x => `<div class="skrow"><div class="skrow-t"><span>${esc(x.skill.name)}</span><small>${x.n >= 1 ? Math.round(x.m * 100) + '% mastery · ' + x.ok + '/' + x.n + (x.n < 3 ? ' (early read)' : '') : 'not assessed yet'}</small></div>${UI.bar(x.n >= 1 ? x.m : 0, UI.masteryClass(x.m, x.n), x.skill.name + ' mastery')}<span class="tag ${UI.masteryClass(x.m, x.n)}">${UI.masteryLabel(x.m, x.n)}</span><button class="icon-btn sm" data-act="practiceSkill" data-arg="${x.skill.id}" aria-label="Practice ${esc(x.skill.name)}">${ic('play', 16)}</button></div>`).join('')}</div>`; };
  const html = `<div class="page">${pageHead('Progress', `${p.hist.length} questions answered · ${UI.plural(p.tests.length, 'session')}`)}
    <div class="grid3">
      <section class="card stat"><span class="eyebrow">Estimated total</span><div class="big-n">${est.enough ? est.total : '-'}<small>/${sc.max}</small></div><p class="hint">${est.enough ? `Goal ${p.target}. Rough estimate from practice accuracy; full tests are the better measure.` : 'Answer more questions in both sections to unlock this.'}</p></section>
      <section class="card stat"><span class="eyebrow">Reading &amp; Writing</span><div class="big-n">${est.rwN >= 8 ? est.rw : '-'}<small>/${sc.secMax}</small></div><p class="hint">Median ${pace('rw') ? pace('rw') + 's' : '-'} per question (test pace ${Math.round(Engine.TARGET_MS.rw / 1000)}s)</p></section>
      <section class="card stat"><span class="eyebrow">Math</span><div class="big-n">${est.mathN >= 8 ? est.math : '-'}<small>/${sc.secMax}</small></div><p class="hint">Median ${pace('math') ? pace('math') + 's' : '-'} per question (test pace ${Math.round(Engine.TARGET_MS.math / 1000)}s)</p></section></div>
    <section class="card"><div class="card-head"><h2>Real and practice test scores</h2></div>${UI.lineChart(pts, p.target, sc)}</section>
    <section class="card"><div class="card-head"><h2>Skill by skill</h2><span class="hint">Mastery is a rolling estimate that weights recent answers and question difficulty.</span></div><div class="dom-grid">${Object.values(DOMAINS).map(domBlock).join('')}</div></section>
    <div class="grid2"><section class="card"><h2>Accuracy by difficulty</h2><div class="stack">${dRow(1, 'Easy')}${dRow(2, 'Medium')}${dRow(3, 'Hard')}</div><p class="hint">Missing easy questions points to a rule or formula gap. Missing only hard ones is a good place to be.</p></section>
      <section class="card"><h2>What the data says</h2>${an.notes.length || an.focus.length ? `${an.focus.slice(0, 3).map(x => `<div class="note">${ic('target', 18)}<p><b>${esc(x.skill.name)}</b>: ${esc(Engine.reasonFor(x))}.</p></div>`).join('')}${an.notes.map(n => `<div class="note ${n.k === 'up' ? 'ok' : ''}">${ic(n.k === 'up' ? 'trophy' : 'bulb', 18)}<p>${esc(n.t)}</p></div>`).join('')}` : '<p class="empty">Insights show up after about 30 questions.</p>'}</section></div></div>`;
  return { html, title: 'Progress' };
};

/* =================== STUDY PLAN =================== */
UI.routes.plan = (a, p) => {
  const an = Engine.analyze(p), est = Engine.estimate(p), days = U.daysUntil(p.testDate), wk = Engine.weekPlan(p), dow = new Date().getDay(), td = Engine.todayStats(p), lvl = Engine.currentLevel(p), sc = Engine.examOf(p);
  const gap = lvl.source === 'none' ? 0 : Math.max(0, p.target - lvl.total), perDay = Math.round(p.dailyMin / 1.6);
  const diff = lvl.source === 'none' ? 0 : Math.abs(lvl.rw - lvl.math), weakNote = diff >= 40 ? ` ${lvl.math < lvl.rw ? 'Math' : 'Reading &amp; Writing'} is ${diff} points lower, so start there.` : '';
  const horizon = days !== null && days > 0 ? days : 56;
  const phases = [['Close the gaps', 0.4, 'Daily targeted sets on your weakest skills; read each Skill Guide tip.'], ['Build speed and stamina', 0.4, 'Mixed, timed sets and a section test each week.'], ['Test-day readiness', 0.2, 'Full-length tests, then review every mistake. Light practice the last 2 days.']];
  let cursor = Date.now();
  const phaseHTML = phases.map(([n, f, d], i) => { const len = Math.round(horizon * f), start = new Date(cursor), end = new Date(cursor + len * 86400000); cursor += len * 86400000; return `<li class="phase"><span class="ph-n">${i + 1}</span><div><b>${n}</b><small>${UI.fmtDate(start)} to ${UI.fmtDate(end)} · ${len} days</small><p>${d}</p></div></li>`; }).join('');
  const html = `<div class="page">${pageHead('Study plan', 'Built from your target, test date and current weak spots. It updates as you improve.')}
    <div class="grid3">
      <section class="card stat"><span class="eyebrow">Goal</span><div class="big-n">${p.target}<small>target</small></div><p class="hint">${lvl.source === 'none' ? `Take the diagnostic, or <button class="link" data-act="addScore">add a real score</button>, to measure your starting point.` : `${lvl.source === 'practice' ? 'Now about' : 'Last real score:'} ${lvl.total}. ${gap ? gap + ' points to go.' : 'You are at goal level.'}${weakNote}`}</p></section>
      <section class="card stat"><span class="eyebrow">Time left</span><div class="big-n">${days === null ? '-' : Math.max(0, days)}<small>days</small></div>${days === null ? `<label class="lbl" for="p-date">Add your test date</label><input id="p-date" class="inp" type="date" min="${U.today()}" data-ch="planDate">` : `<p class="hint">Test date ${new Date(p.testDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}. <a href="#/settings">Change</a></p>`}</section>
      <section class="card stat"><span class="eyebrow">Daily load</span><div class="big-n">${p.dailyMin}<small>min</small></div><p class="hint">About ${perDay} questions a day, adjusted to your weak spots.</p></section></div>
    <div class="grid2">
      <section class="card"><div class="card-head"><h2>This week</h2></div><ul class="week">${wk.map((d, i) => `<li class="${i + 1 === dow || (dow === 0 && i === 6) ? 'today' : ''}"><span class="wd">${d.d}</span><span>${esc(d.t)}</span>${(i + 1 === dow || (dow === 0 && i === 6)) ? '<span class="badge">Today</span>' : ''}</li>`).join('')}</ul></section>
      <section class="card"><div class="card-head"><h2>Today’s mission</h2></div>${an.focus.length ? `<p class="sub">Focus skills: <b>${an.focus.map(x => esc(x.skill.name)).join(', ')}</b></p>` : '<p class="sub">Start with the diagnostic so the plan knows where to aim.</p>'}
        <div class="today-prog"><div class="bar"><i style="width:${Math.round(U.clamp(td.ms / 60000 / p.dailyMin, 0, 1) * 100)}%"></i></div><small>${Math.round(td.ms / 60000)} of ${p.dailyMin} minutes done</small></div>
        <div class="row"><button class="btn btn-primary" data-act="startDaily">${ic('play', 16)} Start today’s practice</button>${p.hist.length < 10 ? `<button class="btn btn-soft" data-act="startDiag" data-arg="1">Diagnostic first</button>` : ''}</div></section></div>
    <section class="card"><div class="card-head"><h2>Roadmap</h2></div><ol class="phases">${phaseHTML}</ol>
      <p class="hint">Take a full-length test about every two weeks, and always review every missed question. The notebook schedules that for you.</p></section></div>`;
  return { html, title: 'Study plan' };
};
UI.ins.planDate = (v) => { prof().testDate = v; Store.save(true); UI.render(); };

/* =================== SKILL GUIDE =================== */
UI.skillFilter = 'all';
UI.routes.skills = (a, p) => {
  const st = Engine.skillStats(p), list = SKILLS.filter(s => UI.skillFilter === 'all' || s.sec === UI.skillFilter);
  const html = `<div class="page">${pageHead('Skill guide', 'What each skill tests, the strategy that works, and your current level.')}
    <div class="chips-row" role="group" aria-label="Filter by section">${[['all', 'All skills'], ['rw', 'Reading & Writing'], ['math', 'Math']].map(([k, l]) => `<button class="chip ${UI.skillFilter === k ? 'on' : ''}" aria-pressed="${UI.skillFilter === k}" data-act="skFilter" data-arg="${k}">${l}</button>`).join('')}</div>
    <div class="skill-grid">${list.map(s => { const x = st[s.id], n = Bank.staticCount(s.id); return `<article class="card skill-card"><div class="card-head"><div><span class="eyebrow">${esc(DOMAINS[s.dom].name)}</span><h2>${esc(s.name)}</h2></div><span class="tag ${UI.masteryClass(x.m, x.n)}">${UI.masteryLabel(x.m, x.n)}</span></div>
      ${UI.bar(x.n >= 1 ? x.m : 0, UI.masteryClass(x.m, x.n), s.name + ' mastery')}<p class="tipt">${ic('bulb', 18)}<span>${esc(s.tip)}</span></p>
      <div class="skill-foot"><small>${n} written question${n === 1 ? '' : 's'}${Gen.has(s.id) ? ' + unlimited generated' : ''}</small><button class="btn btn-soft sm" data-act="practiceSkill" data-arg="${s.id}">${ic('play', 16)} Practice 10</button></div></article>`; }).join('')}</div></div>`;
  return { html, title: 'Skill guide' };
};
UI.acts.skFilter = (k) => { UI.skillFilter = k; UI.render(); };

/* =================== PARENT VIEW =================== */
UI.routes.parent = () => {
  const s = Store.get(), profs = Object.values(s.profiles);
  const card = p => {
    const est = Engine.estimate(p), an = Engine.analyze(p), st = Engine.streak(p), wk = p.hist.filter(h => Date.now() - h.t < 7 * 86400000), wkOk = wk.filter(h => h.ok).length, last = p.hist.length ? p.hist[p.hist.length - 1].t : null;
    const lastFull = p.tests.find(t => t.sum && t.sum.total), days = U.daysUntil(p.testDate);
    return `<article class="card kid"><div class="kid-h"><span class="avatar lg">${UI.profileInitial(p)}</span><div><h2>${esc(p.name)}</h2><small>Grade ${p.grade} · goal ${p.target}${days !== null && days >= 0 ? ` · ${days} days to test` : ''}</small></div><div class="row"><button class="btn btn-soft sm" data-act="doSwitch" data-arg="${p.id}">Open</button></div></div>
      <div class="stats4"><div><b>${est.enough ? est.total : '-'}</b><span>est. score</span></div><div><b>${lastFull ? lastFull.sum.total : '-'}</b><span>last full test</span></div><div><b>${wk.length}</b><span>questions this week${wk.length ? ` (${Math.round(wkOk / wk.length * 100)}% right)` : ''}</span></div><div><b>${st}</b><span>day streak</span></div></div>
      <div class="kid-r"><div><h3>Needs work</h3>${an.focus.length ? `<ul class="plain-list">${an.focus.map(x => `<li>${esc(x.skill.name)} <small>${Math.round(x.m * 100)}%</small></li>`).join('')}</ul>` : '<p class="hint">Not enough data yet.</p>'}</div>
        <div><h3>Going well</h3>${an.strong.length ? `<ul class="plain-list">${an.strong.map(x => `<li>${esc(x.skill.name)} <small>${Math.round(x.m * 100)}%</small></li>`).join('')}</ul>` : '<p class="hint">Not enough data yet.</p>'}</div></div>
      <p class="hint">${last ? 'Last practiced ' + new Date(last).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Has not practiced yet.'} · ${Object.keys(p.missed).length} mistakes in notebook${Engine.priorScores(p)[0] ? ` · Latest real score: ${Engine.EXAMS[Engine.priorScores(p)[0].exam].name} ${Engine.priorScores(p)[0].total}` : ''}</p></article>`;
  };
  return { html: `<div class="page">${pageHead('Parent view', 'A quick look at how each student is doing. Everything stays on this device.', `<button class="btn btn-soft" onclick="window.print()">${ic('print', 16)} Print report</button><button class="btn btn-ghost" data-act="newProfile">${ic('plus', 16)} Add student</button>`)}<div class="kids">${profs.map(card).join('')}</div>
    <section class="card"><h2>How to help</h2><ul class="plain-list tips"><li>Aim for short daily sessions (the plan sets the length) rather than marathon weekends.</li><li>Ask them to explain a missed question out loud, the mistake notebook is built for that.</li><li>Do a full-length test every two weeks in a quiet space, timed, calculator ready.</li><li>Use Settings → Download backup occasionally, since progress is stored in this browser.</li></ul></section></div>`, title: 'Parent view' };
};

/* =================== SETTINGS =================== */
UI.routes.settings = (a, p) => {
  const sc = Engine.examOf(p);
  const s = Store.get(), ai = s.aiCfg, defModel = { gemini: 'gemini-2.0-flash', openai: 'gpt-4o-mini', anthropic: 'claude-haiku-5-5' };
  const html = `<div class="page narrow">${pageHead('Settings')}
    <section class="card"><h2>Student profile</h2><div class="form-grid">
      <div class="field wide"><span class="lbl">Exam focus</span><div class="seg" role="radiogroup" aria-label="Exam focus">${[['sat', 'SAT'], ['psat', 'PSAT/NMSQT'], ['psat10', 'PSAT 10']].map(([k, l]) => `<button class="seg-i ${sc.id === k ? 'on' : ''}" role="radio" aria-checked="${sc.id === k}" data-act="setExamAct" data-arg="${k}"><span>${l}</span></button>`).join('')}</div><p class="hint">The SAT is the main focus. Choose a PSAT to practice on its scale for National Merit. <a href="#/scores">Your real scores</a></p></div>
      <div class="field"><label for="st-name">Name</label><input id="st-name" class="inp" value="${esc(p.name)}" maxlength="24" data-ch="setName"></div>
      <div class="field"><label for="st-grade">Grade</label><select id="st-grade" class="inp" data-ch="setGrade">${[9, 10, 11, 12].map(g => `<option ${p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="field"><label for="st-target">Target score: <output id="st-tout">${p.target}</output></label><input id="st-target" type="range" min="${sc.id === 'sat' ? 800 : 640}" max="${sc.max}" step="10" value="${p.target}" data-in="setTarget"></div>
      <div class="field"><label for="st-date">Test date</label><input id="st-date" class="inp" type="date" value="${p.testDate || ''}" data-ch="setDate"></div>
      <div class="field"><label for="st-min">Daily study time</label><select id="st-min" class="inp" data-ch="setMin">${[15, 30, 45, 60, 90, 120].map(m => `<option value="${m}" ${p.dailyMin === m ? 'selected' : ''}>${m} minutes</option>`).join('')}</select></div></div>
      <div class="toggles"><label class="switch"><input type="checkbox" data-ch="setExt" ${p.extended ? 'checked' : ''}><span class="sw"></span><span><b>Extended time (1.5×)</b><small>For students with testing accommodations</small></span></label>
      <label class="switch"><input type="checkbox" data-ch="setTimer" ${p.showTimer !== false ? 'checked' : ''}><span class="sw"></span><span><b>Show timer during tests</b><small>You can also hide it from inside a test</small></span></label></div></section>
    <section class="card"><h2>Appearance</h2><div class="seg" role="radiogroup" aria-label="Theme">${[['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => `<button class="seg-i ${s.settings.theme === k ? 'on' : ''}" role="radio" aria-checked="${s.settings.theme === k}" data-act="setTheme" data-arg="${k}"><span>${l}</span></button>`).join('')}</div></section>
    <section class="card"><h2>Question bank</h2><p class="sub">${Bank.total()} written questions (${s.custom.length} imported, ${s.ai.length} AI-generated) plus unlimited generated math problems.</p>
      <div class="row wrap"><label class="btn btn-soft file-btn">${ic('upload', 16)} Import question pack (.json)<input type="file" accept="application/json,.json" data-ch="importPack" hidden></label><button class="btn btn-ghost" data-act="packTemplate">${ic('download', 16)} Download template</button>${s.custom.length || s.ai.length ? `<button class="btn btn-ghost" data-act="clearPacks">${ic('trash', 16)} Remove imported &amp; AI questions</button>` : ''}</div>
      <details class="plain mt"><summary><h3>${ic('sparkles', 16)} Generate extra questions with AI (optional)</h3></summary>
        <p class="hint">Bring your own API key. It stays in this browser and is sent only to the provider you choose. AI questions can contain mistakes. Treat them as extra practice and double-check answers you disagree with.</p>
        <div class="form-grid"><div class="field"><label for="ai-p">Provider</label><select id="ai-p" class="inp" data-ch="aiProvider">${[['gemini', 'Google Gemini'], ['openai', 'OpenAI'], ['anthropic', 'Anthropic Claude']].map(([k, l]) => `<option value="${k}" ${ai.provider === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="ai-m">Model</label><input id="ai-m" class="inp" value="${esc(ai.model || defModel[ai.provider])}" data-ch="aiModel" autocomplete="off"></div>
        <div class="field wide"><label for="ai-k">API key</label><input id="ai-k" class="inp" type="password" value="${esc(ai.key || '')}" data-ch="aiKey" autocomplete="off" placeholder="Paste key"></div>
        <div class="field"><label for="ai-s">Skill</label><select id="ai-s" class="inp">${SKILLS.map(k => `<option value="${k.id}">${esc(SEC_LABEL[k.sec])}: ${esc(k.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="ai-n">How many</label><select id="ai-n" class="inp">${[3, 5, 8, 10].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
        <div class="row"><button class="btn btn-primary" id="ai-go" data-act="aiGen">${ic('sparkles', 16)} Generate</button><span class="hint" id="ai-status" role="status"></span></div></details></section>
    ${UI.accountCard ? UI.accountCard(p) : ''}
    <section class="card"><h2>Your data</h2><p class="sub">Progress lives in this browser. Download a backup to move to another device or keep it safe.</p>
      <div class="row wrap"><button class="btn btn-soft" data-act="exportAll">${ic('download', 16)} Download backup</button><label class="btn btn-ghost file-btn">${ic('upload', 16)} Restore backup<input type="file" accept="application/json,.json" data-ch="restoreFile" hidden></label></div>
      <hr><div class="row wrap"><button class="btn btn-danger-ghost" data-act="resetProfile">Reset ${esc(p.name)}’s progress</button><button class="btn btn-danger-ghost" data-act="deleteProfile">Delete this student</button></div></section>
    <p class="hint tc">SAT is a registered trademark of the College Board, which is not affiliated with this app. All questions here are original practice items.</p></div>`;
  return { html, title: 'Settings' };
};
const setP = (k, v) => { prof()[k] = v; Store.save(true); };
UI.ins.setName = v => { if (v.trim()) { setP('name', v.trim()); } };
UI.ins.setGrade = v => setP('grade', +v);
UI.acts.setExamAct = (k) => {
  const p = prof(), from = Engine.examOf(p), to = Engine.EXAMS[k]; if (!to || from.id === to.id) return;
  const satTotal = p.target + 2 * from.offset;
  p.target = U.clamp(Math.round((satTotal - 2 * to.offset) / 10) * 10, k === 'sat' ? 800 : 640, to.max);
  p.exam = k; Store.save(true); UI.toast(`Practice now uses the ${to.name} scale. Your target is ${p.target}.`, 'ok'); UI.render();
};
UI.ins.setTarget = (v) => { $('#st-tout').textContent = v; setP('target', +v); };
UI.ins.setDate = v => setP('testDate', v);
UI.ins.setMin = v => setP('dailyMin', +v);
UI.ins.setExt = v => setP('extended', v);
UI.ins.setTimer = v => setP('showTimer', v);
UI.acts.setTheme = k => { Store.get().settings.theme = k; Store.save(true); UI.applyTheme(); UI.render(); };
UI.ins.aiProvider = v => { Store.get().aiCfg.provider = v; Store.get().aiCfg.model = ''; Store.save(true); UI.render(); };
UI.ins.aiModel = v => { Store.get().aiCfg.model = v.trim(); Store.save(true); };
UI.ins.aiKey = v => { Store.get().aiCfg.key = v.trim(); Store.save(true); };
UI.acts.exportAll = () => { const blob = new Blob([Store.exportAll()], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ascent-backup-${U.today()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); UI.toast('Backup downloaded.', 'ok'); };
UI.acts.resetProfile = async () => { if (await UI.confirm('This clears all answers, tests and notebook entries for this student. This cannot be undone.', 'Reset progress', true)) { const p = prof(); Object.assign(p, { hist: [], missed: {}, flagged: {}, seen: {}, tests: [], session: null }); Store.save(true); UI.toast('Progress reset.'); UI.go('/home'); UI.render(); } };
UI.acts.deleteProfile = async () => { const p = prof(); if (await UI.confirm(`Delete ${esc(p.name)} and all of their progress? Download a backup first if you might need it.`, 'Delete student', true)) { Store.remove(p.id); UI.shellOn = false; UI.go(Store.profile() ? '/home' : '/welcome'); UI.render(); } };
UI.acts.packTemplate = () => {
  const t = [{ skill: 'wic', d: 2, p: 'Passage or context text (optional).', q: 'Which choice completes the text with the most logical and precise word or phrase?', a: 'Correct answer', w: ['Wrong 1', 'Wrong 2', 'Wrong 3'], e: 'Why the answer is correct.' },
    { skill: 'lin1', d: 1, q: 'If 3x + 2 = 11, what is x? (grid-in: leave "w" out)', a: '3', e: 'Subtract 2, then divide by 3.' }];
  const blob = new Blob([JSON.stringify({ _skills: SKILLS.map(s => s.id), questions: t }, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ascent-question-pack-template.json'; a.click();
};
UI.ins.importPack = (v, el) => {
  const f = el.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result), arr = Array.isArray(o) ? o : o.questions; if (!Array.isArray(arr)) throw new Error('Expected a list of questions.');
      const good = []; let bad = 0; arr.forEach(q => { try { Bank.validate(q); good.push({ skill: q.skill || q.s, d: q.d, p: q.p, q: q.q, a: String(q.a), w: q.w, e: q.e }); } catch (e) { bad++; } });
      Store.get().custom.push(...good); Store.save(true); UI.toast(`Imported ${good.length} question${good.length === 1 ? '' : 's'}${bad ? `, skipped ${bad} invalid` : ''}.`, good.length ? 'ok' : 'warn'); UI.render();
    } catch (e) { UI.toast('Could not import: ' + (e.message || 'invalid file'), 'warn'); }
  };
  r.readAsText(f);
};
UI.acts.clearPacks = async () => { if (await UI.confirm('Remove all imported and AI-generated questions? Built-in questions stay.', 'Remove', true)) { const s = Store.get(); s.custom = []; s.ai = []; Store.save(true); UI.render(); } };
}());

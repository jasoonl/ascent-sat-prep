/* Onboarding, real score history (SAT and PSAT) and the National Merit scholarship page. */
(function () {
'use strict';
const { $, $$, ic } = UI;
const esc = U.esc, E = Engine.EXAMS, prof = () => Store.profile();
const EXAM_OPTS = [['sat', 'SAT'], ['psat', 'PSAT/NMSQT'], ['psat10', 'PSAT 10'], ['psat89', 'PSAT 8/9']];
const fmtDay = iso => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const pageHead = (title, sub, right = '') => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="row">${right}</div></div>`;

/* ---------- reusable score form ---------- */
const hintFor = exam => { const e = E[exam]; return `${e.name}: each section is ${e.secMin} to ${e.secMax} and the total is ${e.min} to ${e.max}. Enter both sections, or just the total.`; };
UI.scoreForm = (pre, o = {}) => {
  const ex = E[o.exam || 'sat'], field = (k, label, val, ph) => `<div class="field"><label for="${pre}-${k}">${label}</label><input id="${pre}-${k}" class="inp" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="${ph}" value="${val == null ? '' : val}" ${k === 'total' ? `data-in="scoreTotal" data-prefix="${pre}"` : `data-in="scoreSec" data-prefix="${pre}"`} aria-describedby="${pre}-e-fields"></div>`;
  return `<div class="form-row"><div class="field"><label for="${pre}-exam">Which test?</label><select id="${pre}-exam" class="inp" data-ch="scoreExam" data-prefix="${pre}">${EXAM_OPTS.map(([k, l]) => `<option value="${k}" ${(o.exam || 'sat') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="${pre}-date">Date taken</label><input id="${pre}-date" class="inp" type="date" max="${U.today()}" value="${o.date || ''}" aria-describedby="${pre}-e-date"><p class="err" id="${pre}-e-date" role="alert" hidden></p></div></div>
    <div class="score-fields">${field('rw', 'Reading &amp; Writing', o.rw, `${ex.secMin} to ${ex.secMax}`)}${field('math', 'Math', o.math, `${ex.secMin} to ${ex.secMax}`)}${field('total', 'Total', o.total, `${ex.min} to ${ex.max}`)}</div>
    <p class="err" id="${pre}-e-fields" role="alert" hidden></p>
    <p class="hint" id="${pre}-hint">${hintFor(o.exam || 'sat')}</p>`;
};
const readForm = pre => ({ exam: $(`#${pre}-exam`).value, date: $(`#${pre}-date`).value, rw: $(`#${pre}-rw`).value.trim(), math: $(`#${pre}-math`).value.trim(), total: $(`#${pre}-total`).value.trim() });
function showErrors(pre, err) {
  ['exam', 'date', 'rw', 'math', 'total'].forEach(k => { const i = $(`#${pre}-${k}`); if (i) i.removeAttribute('aria-invalid'); });
  const dm = $(`#${pre}-e-date`), fm = $(`#${pre}-e-fields`); dm.hidden = true; dm.textContent = ''; fm.hidden = true; fm.textContent = '';
  let first = null; const fieldMsgs = [];
  ['exam', 'date', 'rw', 'math', 'total'].forEach(k => {
    if (!err[k]) return; const i = $(`#${pre}-${k}`); if (i) { i.setAttribute('aria-invalid', 'true'); first = first || i; }
    if (k === 'date') { dm.textContent = err[k]; dm.hidden = false; } else if (k !== 'exam') fieldMsgs.push(err[k]);
  });
  if (fieldMsgs.length) { fm.textContent = fieldMsgs.join(' '); fm.hidden = false; }
  if (first) first.focus();
}
UI.ins.scoreExam = (v, el) => {
  const pre = el.dataset.prefix, e = E[v]; $(`#${pre}-hint`).textContent = hintFor(v);
  ['rw', 'math'].forEach(k => { $(`#${pre}-${k}`).placeholder = `${e.secMin} to ${e.secMax}`; }); $(`#${pre}-total`).placeholder = `${e.min} to ${e.max}`;
};
UI.ins.scoreSec = (v, el) => {
  const pre = el.dataset.prefix, rw = +$(`#${pre}-rw`).value, m = +$(`#${pre}-math`).value, t = $(`#${pre}-total`);
  if (rw && m && Number.isInteger(rw) && Number.isInteger(m) && t.dataset.auto !== '0') { t.value = rw + m; t.dataset.auto = '1'; }
};
UI.ins.scoreTotal = (v, el) => { el.dataset.auto = v === '' ? '1' : '0'; };

/* ---------- welcome / onboarding ---------- */
const TARGET = { sat: { min: 800, max: 1600, def: 1300 }, psat: { min: 640, max: 1520, def: 1200 }, psat10: { min: 640, max: 1520, def: 1200 } };
UI.routes.welcome = () => {
  const s = Store.get(), has = Object.keys(s.profiles).length > 0;
  const html = `<div class="welcome-wrap"><div class="welcome-hero"><div class="brand big">${ic('logo', 36)}<span>Ascent <small>SAT &amp; PSAT Prep</small></span></div>
    <h1>Free SAT practice that finds what to work on next.</h1>
    <p class="lede">Built for the SAT, with PSAT/NMSQT practice for students going after National Merit.</p>
    <ul class="bullets"><li>${ic('target', 20)}<span>A short diagnostic pinpoints weak skills across all 4 Reading &amp; Writing and 4 Math areas.</span></li>
    <li>${ic('tests', 20)}<span>Full-length adaptive practice tests with the real format, timing and a built-in calculator.</span></li>
    <li>${ic('trophy', 20)}<span>Enter scores from real SAT and PSAT tests, and see how close you are to your goal and to National Merit.</span></li>
    <li>${ic('mistakes', 20)}<span>A mistake notebook brings missed questions back at the right time until they stick.</span></li></ul>
    <p class="hint">${window.Cloud && Cloud.enabled ? 'Your progress is saved on this device. If you sign in, it is also saved to your account so it follows you between devices.' : 'Your progress is saved privately on this device. Nothing is sent anywhere.'}</p></div>
    <form class="card welcome-form" id="wform" novalidate><h2>${has ? 'Add a student' : 'Set up your profile'}</h2>
      ${window.Cloud && Cloud.enabled ? (Cloud.user ? `<p class="hint" style="margin-top:-.25rem">Signed in as <b>${esc(Cloud.user.email)}</b>. Set up your profile to continue.</p>` : `<p class="hint" style="margin-top:-.25rem">Already have an account? <button type="button" class="link" data-act="acctOpen" data-arg="signin">Sign in</button></p>`) : ''}
      <div class="field"><label for="w-name">First name</label><input id="w-name" class="inp" required maxlength="24" autocomplete="given-name"><p class="err" id="w-err" role="alert" hidden>Please enter a name.</p></div>
      <div class="field"><label for="w-grade">Grade</label><select id="w-grade" class="inp"><option>9</option><option>10</option><option selected>11</option><option>12</option></select></div>
      <fieldset class="field"><legend>Which test are you preparing for?</legend><div class="seg" role="radiogroup">${[['sat', 'SAT'], ['psat', 'PSAT/NMSQT'], ['psat10', 'PSAT 10']].map(([k, l]) => `<label class="seg-i"><input type="radio" name="w-exam" value="${k}" data-ch="wExam" ${k === 'sat' ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div><p class="hint">The SAT is the main focus. Pick a PSAT to practice for National Merit. You can change this later.</p></fieldset>
      <div class="field"><label for="w-target">Target total score: <output id="w-tout">1300</output></label><input id="w-target" type="range" min="800" max="1600" step="10" value="1300"><p class="hint" id="w-thint">Out of 1600. You can change this any time.</p></div>
      <div class="field"><label for="w-testdate">Test date you are aiming for <span class="opt">(optional)</span></label><input id="w-testdate" class="inp" type="date" min="${U.today()}"></div>
      <fieldset class="field"><legend>Daily study time</legend><div class="seg" role="radiogroup">${[15, 30, 45, 60, 90].map(m => `<label class="seg-i"><input type="radio" name="w-min" value="${m}" ${m === 30 ? 'checked' : ''}><span>${m} min</span></label>`).join('')}</div></fieldset>
      <details class="plain prior" id="w-prior"><summary>${ic('trophy', 18)} I already have a real score <span class="opt">(optional)</span></summary><div class="prior-body">${UI.scoreForm('w')}</div></details>
      <button class="btn btn-primary lg block" type="submit">Create profile ${ic('arrow', 18)}</button>
      ${has ? `<a class="btn btn-ghost block" href="#/home">Cancel</a>` : `<label class="btn btn-ghost block file-btn">${ic('upload', 18)} Restore from a backup file<input type="file" accept="application/json,.json" data-ch="restoreFile" hidden></label>`}
    </form></div>`;
  return { html, title: 'Welcome', after: () => {
    $('#w-target').addEventListener('input', e => { $('#w-tout').textContent = e.target.value; });
    $('#wform').addEventListener('submit', e => {
      e.preventDefault(); const name = $('#w-name').value.trim();
      if (!name) { $('#w-err').hidden = false; $('#w-name').setAttribute('aria-invalid', 'true'); $('#w-name').focus(); return; }
      let prior = null; const f = readForm('w');
      if (f.rw || f.math || f.total) { const v = Engine.validateScore(f); if (!v.ok) { $('#w-prior').open = true; showErrors('w', v.err); return; } prior = v.entry; }
      const p = Store.create({ name, grade: +$('#w-grade').value, exam: $('input[name="w-exam"]:checked').value, target: +$('#w-target').value, testDate: $('#w-testdate').value, dailyMin: +$('input[name="w-min"]:checked').value });
      if (prior) { p.prior.push(prior); Store.save(true); }
      if (window.Cloud && Cloud.user && !Cloud.boundProfile()) Cloud.linkActive();
      UI.shellOn = false; UI.go('/home'); UI.render();
    });
  } };
};
UI.ins.wExam = (v) => {
  const t = TARGET[v], r = $('#w-target'); r.min = t.min; r.max = t.max; r.value = t.def; $('#w-tout').textContent = t.def;
  $('#w-thint').textContent = `Out of ${E[v].max}. You can change this any time.`;
};

/* ---------- add / edit / delete a real score ---------- */
UI.acts.addScore = (id) => {
  const p = prof(), existing = id ? p.prior.find(x => x.id === id) : null;
  UI.modal({ title: existing ? 'Edit score' : 'Add a real score', body: `<p class="hint" style="margin-top:0">Scores from a test you actually took. They set your starting level and appear on your progress chart.</p>${UI.scoreForm('sc', existing || { exam: Engine.examOf(p).id === 'sat' ? 'sat' : Engine.examOf(p).id })}`,
    actions: [{ label: 'Cancel', cls: 'btn-ghost' }, { label: 'Save score', cls: 'btn-primary', fn: () => {
      const v = Engine.validateScore(Object.assign(readForm('sc'), existing ? { id: existing.id } : {}));
      if (!v.ok) { showErrors('sc', v.err); return false; }
      if (existing) Object.assign(existing, v.entry); else p.prior.push(v.entry);
      Store.save(true); UI.toast('Score saved.', 'ok'); setTimeout(() => UI.render(), 0); return true;
    } }] });
};
UI.acts.editScore = id => UI.acts.addScore(id);
UI.acts.delScore = async (id) => {
  if (!(await UI.confirm('Remove this score from your history?', 'Remove', true))) return;
  const p = prof(); p.prior = p.prior.filter(x => x.id !== id); Store.save(true); UI.render();
};

/* ---------- My scores ---------- */
UI.routes.scores = (a, p) => {
  const list = Engine.priorScores(p), sc = Engine.examOf(p), latest = list[0];
  const pts = list.slice().reverse().map(e => ({ t: 0, v: Engine.inProfileScale(p, e).total, d: UI.fmtDate(new Date(e.date + 'T00:00:00').getTime()), k: 'real', label: E[e.exam].name }));
  const nmCell = e => (e.exam === 'psat' || e.exam === 'psat10') && e.rw != null && e.math != null ? `<b>${Engine.selectionIndex(e.rw, e.math)}</b>` : '-';
  const row = e => `<tr><td data-label="Date" class="c-date">${fmtDay(e.date)}</td><td data-label="Test" class="c-test">${E[e.exam].name}</td><td data-label="Total"><b>${e.total}</b> <small>/${E[e.exam].max}</small></td><td data-label="Reading &amp; Writing">${e.rw != null ? e.rw : '-'}</td><td data-label="Math">${e.math != null ? e.math : '-'}</td><td data-label="NM index">${nmCell(e)}</td><td class="act-cell"><button class="btn btn-ghost sm" data-act="editScore" data-arg="${e.id}">Edit</button> <button class="btn btn-danger-ghost sm" data-act="delScore" data-arg="${e.id}" aria-label="Remove score from ${fmtDay(e.date)}">${ic('trash', 16)}</button></td></tr>`;
  const conv = latest && latest.exam !== sc.id ? (() => { const v = Engine.inProfileScale(p, latest); return `<p class="hint">Your latest ${E[latest.exam].name} score is about <b>${v.total}</b> on the ${sc.name} scale. Conversions are approximate: PSAT section scores run about 40 points below the SAT on the same skills.</p>`; })() : '';
  const html = `<div class="page">${pageHead('My scores', 'Real scores from SAT and PSAT tests you have taken.', `<button class="btn btn-primary" data-act="addScore">${ic('plus', 16)} Add a score</button>`)}
    ${list.length ? `<section class="card"><div class="tbl-wrap"><table class="list-table stack-table"><thead><tr><th scope="col">Date</th><th scope="col">Test</th><th scope="col">Total</th><th scope="col">Reading &amp; Writing</th><th scope="col">Math</th><th scope="col" title="National Merit Selection Index, PSAT/NMSQT and PSAT 10 only">NM index</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>${conv}</section>
      ${list.length > 1 ? `<section class="card"><div class="card-head"><h2>Score trend</h2></div>${UI.lineChart(pts, p.target, sc)}</section>` : ''}`
      : `<div class="empty-state">${ic('trophy', 40)}<h2>No real scores yet</h2><p>If you have taken the SAT, PSAT/NMSQT, PSAT 10 or PSAT 8/9, add the result. Practice will start at the right level and your plan will know the gap to your goal.</p><button class="btn btn-primary" data-act="addScore">${ic('plus', 16)} Add your first score</button></div>`}
    <section class="card"><h2>How your scores are used</h2><ul class="plain-list tips"><li><b>Starting level.</b> Until you have answered enough practice questions, your latest real score decides how hard your first questions are.</li><li><b>Plan and goal.</b> The gap between your latest score and your target sets your study plan, and the weaker section is flagged.</li><li><b>Scholarship tracking.</b> PSAT/NMSQT scores with both sections give a National Merit Selection Index. See <a href="#/scholarship">Scholarship</a>.</li><li><b>Stays private.</b> Scores are saved only in this browser. Download a backup in Settings to keep them safe.</li></ul></section></div>`;
  return { html, title: 'My scores' };
};

/* ---------- Scholarship (National Merit) ---------- */
const NM_MIN = 48, NM_MAX = 228, NM_COMMENDED = 210, NM_TOP = 225;
const pos = v => U.clamp((v - NM_MIN) / (NM_MAX - NM_MIN), 0, 1) * 100;
function nmReadout(rw, math, target) {
  const okR = Number.isInteger(rw) && rw >= 160 && rw <= 760 && rw % 10 === 0, okM = Number.isInteger(math) && math >= 160 && math <= 760 && math % 10 === 0;
  if (!okR || !okM) return { ok: false };
  const idx = Engine.selectionIndex(rw, math), gap = target ? target - idx : null;
  return { ok: true, idx, gap, fill: pos(idx) };
}
UI.routes.scholarship = (a, p) => {
  const sc = Engine.examOf(p), nm = Engine.nmEstimate(p), tgt = p.nmTarget || 0, grade = p.grade;
  const latestPsat = Engine.priorScores(p).find(e => (e.exam === 'psat' || e.exam === 'psat10') && e.rw != null && e.math != null);
  const start = latestPsat ? { rw: latestPsat.rw, math: latestPsat.math, src: `From your ${E[latestPsat.exam].name} on ${fmtDay(latestPsat.date)}` } : nm ? { rw: nm.rw, math: nm.math, src: nm.source === 'practice' ? 'Estimated from your practice. A rough guide only.' : 'Converted from your latest real score. A rough guide only.' } : { rw: '', math: '', src: 'Enter your PSAT/NMSQT section scores, or practice to get an estimate.' };
  const r0 = start.rw === '' ? { ok: false } : nmReadout(+start.rw, +start.math, tgt);
  const gradeMsg = grade === 11 ? 'You are in the year that counts. Most students take the PSAT/NMSQT in October of 11th grade.' : grade === 12 ? 'The PSAT/NMSQT you took in 11th grade is the one the program used. An SAT or ACT score is part of the Finalist step.' : 'Entry is usually in junior year. Use this year to build skills: PSAT 10 and SAT practice both help.';
  const html = `<div class="page">${pageHead('Scholarship: National Merit', 'The PSAT/NMSQT is the qualifying test. The SAT still matters, because Finalists confirm their score with an SAT or ACT.')}
    <section class="card"><div class="card-head"><h2>Your Selection Index</h2></div>
      <div class="form-row nm-form"><div class="field"><label for="nm-rw">Reading &amp; Writing (PSAT scale)</label><input id="nm-rw" class="inp" inputmode="numeric" maxlength="3" value="${start.rw}" placeholder="160 to 760" data-in="nmCalc"></div>
      <div class="field"><label for="nm-math">Math (PSAT scale)</label><input id="nm-math" class="inp" inputmode="numeric" maxlength="3" value="${start.math}" placeholder="160 to 760" data-in="nmCalc"></div></div>
      <p class="hint" style="margin-top:0" id="nm-src">${esc(start.src)}</p>
      <div class="nm-out"><div><span class="eyebrow">Selection Index</span><div class="big-n"><span id="nm-index">${r0.ok ? r0.idx : '-'}</span><small>of ${NM_MAX}</small></div></div>
        <div class="nm-meter"><div class="nm-scale" id="nm-scale" role="img" aria-label="Selection index scale from ${NM_MIN} to ${NM_MAX}"><i class="nm-fill" id="nm-fill" style="width:${r0.ok ? r0.fill : 0}%"></i><b class="nm-tick" style="left:${pos(NM_COMMENDED)}%" title="Class of 2026 Commended cutoff, ${NM_COMMENDED}"></b><b class="nm-tick" style="left:${pos(NM_TOP)}%" title="Highest Class of 2026 Semifinalist cutoff, ${NM_TOP}"></b>${tgt ? `<b class="nm-tick me" style="left:${pos(tgt)}%" title="Your target, ${tgt}"></b>` : ''}</div>
        <p class="legend-chart"><span><i class="lg-tick"></i> Class of 2026: Commended ${NM_COMMENDED}, top Semifinalist cutoff ${NM_TOP}</span></p></div></div>
      <div class="field nm-target"><label for="nm-target">My state's Semifinalist cutoff or goal <span class="opt">(optional)</span></label><input id="nm-target" class="inp" inputmode="numeric" maxlength="3" value="${tgt || ''}" placeholder="${NM_MIN} to ${NM_MAX}" data-ch="nmTarget"><p class="hint" id="nm-gap" role="status">${r0.ok && tgt ? nmGapText(r0.idx, tgt) : 'Cutoffs differ by state and change every year. Look up your state, then enter it here.'}</p></div>
      <p class="hint">Estimate only. The index is (2 &times; Reading &amp; Writing + Math) &divide; 10, from ${NM_MIN} to ${NM_MAX}. Your official Selection Index is printed on your PSAT/NMSQT score report.</p></section>
    <div class="grid2"><section class="card"><h2>How National Merit works</h2><ol class="phases tight">
      <li class="phase"><span class="ph-n">1</span><div><b>Take the PSAT/NMSQT</b><p>Usually in October of junior year. Earlier PSAT tests are practice and do not enter you.</p></div></li>
      <li class="phase"><span class="ph-n">2</span><div><b>Get recognized</b><p>About 50,000 of the highest scorers are recognized: roughly 34,000 Commended Students and about 16,000 Semifinalists.</p></div></li>
      <li class="phase"><span class="ph-n">3</span><div><b>Cutoffs vary by state</b><p>Semifinalists are allocated by state, so qualifying scores differ between states and from year to year.</p></div></li>
      <li class="phase"><span class="ph-n">4</span><div><b>Become a Finalist</b><p>Semifinalists apply and confirm their PSAT result with an SAT or ACT score. About 95 percent qualify as Finalists.</p></div></li>
      <li class="phase"><span class="ph-n">5</span><div><b>Scholarships</b><p>Finalists are considered for National Merit $2,500 Scholarships and sponsor awards. For the 2026 competition, about 6,700 Merit Scholars received nearly $24 million.</p></div></li></ol></section>
    <section class="card"><h2>Your next step</h2><p>${esc(gradeMsg)}</p>
      <p>${sc.id === 'sat' ? 'You are practicing on the SAT scale. Switch to PSAT/NMSQT practice for scores and difficulty that match the real PSAT.' : `You are practicing on the ${sc.name} scale. The SAT is still your main goal, so switch back whenever you want SAT practice.`}</p>
      <div class="row">${sc.id === 'sat' ? `<button class="btn btn-primary" data-act="setExamAct" data-arg="psat">${ic('trophy', 16)} Practice for PSAT/NMSQT</button>` : `<button class="btn btn-soft" data-act="setExamAct" data-arg="sat">Back to SAT practice</button>`}<a class="btn btn-ghost" href="#/scores">Add real scores</a></div>
      <hr><p class="hint">Many colleges also give merit scholarships based on SAT scores. Check each school's published scholarship policy.</p></section></div>
    <section class="card"><h2>Sources and fine print</h2><ul class="plain-list tips"><li>Program steps, counts and scholarship figures: National Merit Scholarship Corporation, <a href="https://www.nationalmerit.org/s/1758/interior.aspx?sid=1758&amp;gid=2&amp;pgid=424" target="_blank" rel="noopener">nationalmerit.org</a> (figures are rounded and change each year).</li><li>Class of 2026 cutoffs (Commended ${NM_COMMENDED}, Semifinalist 210 to 225 depending on state) are unofficial reports compiled by <a href="https://www.compassprep.com/national-merit-semifinalist-cutoffs/" target="_blank" rel="noopener">Compass Education Group</a> in fall 2025. Your year will differ.</li><li>Always confirm dates, eligibility and rules with your school counselor and nationalmerit.org.</li></ul></section></div>`;
  return { html, title: 'Scholarship' };
};
function nmGapText(idx, tgt) {
  const gap = tgt - idx;
  if (gap <= 0) return `You are ${-gap} point${gap === -1 ? '' : 's'} above this target. Keep your sections steady.`;
  return `${gap} index point${gap === 1 ? '' : 's'} to go. That is about +${gap * 5} on Reading &amp; Writing (counts double) or +${gap * 10} on Math.`;
}
function readNm() { return { rw: +$('#nm-rw').value, math: +$('#nm-math').value, tgt: +($('#nm-target').value || 0) }; }
UI.ins.nmCalc = () => {
  const { rw, math, tgt } = readNm(), r = nmReadout(rw, math, tgt);
  $('#nm-index').textContent = r.ok ? r.idx : '-'; $('#nm-fill').style.width = (r.ok ? r.fill : 0) + '%';
  $('#nm-src').textContent = r.ok ? 'Calculated from the section scores you entered.' : 'Enter each section as a multiple of 10 from 160 to 760.';
  $('#nm-gap').innerHTML = r.ok && tgt ? nmGapText(r.idx, tgt) : 'Cutoffs differ by state and change every year. Look up your state, then enter it here.';
};
UI.ins.nmTarget = (v) => {
  const n = +v, p = prof(); p.nmTarget = Number.isInteger(n) && n >= NM_MIN && n <= NM_MAX ? n : 0; Store.save(true);
  const scale = $('#nm-scale'); let t = $('.nm-tick.me', scale);
  if (p.nmTarget) { if (!t) { t = document.createElement('b'); t.className = 'nm-tick me'; scale.appendChild(t); } t.style.left = pos(p.nmTarget) + '%'; t.title = `Your target, ${p.nmTarget}`; } else if (t) t.remove();
  UI.ins.nmCalc();
};
}());

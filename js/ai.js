/* Optional AI question generation (bring-your-own API key). Runs entirely in the browser. */
(function () {
'use strict';
const DEFAULT_MODEL = { gemini: 'gemini-2.0-flash', openai: 'gpt-4o-mini', anthropic: 'claude-haiku-5-5' };

function buildPrompt(skill, n) {
  const dom = DOMAINS[skill.dom];
  return `You write original practice questions in the style of the Digital SAT. Do NOT copy or closely paraphrase real College Board or third-party questions.
Skill: "${skill.name}" (domain: ${dom.name}, section: ${skill.sec === 'rw' ? 'Reading and Writing' : 'Math'}).
Strategy hint: ${skill.tip}
Write ${n} multiple-choice questions with exactly one defensible correct answer and three plausible wrong answers that reflect common student errors. Mix difficulties (1 easy, 2 medium, 3 hard).
${skill.sec === 'rw' ? 'Each question needs a short original passage (25-120 words) in "p", except Transitions/Boundaries/Form questions where the passage contains a blank written as ______.' : 'Use plain text math: x^2 for powers, @f(a|b) for fractions, @r(n) for square roots. Make sure the arithmetic is correct and double-check the answer.'}
Reply with ONLY JSON in this exact shape:
{"questions":[{"d":2,"p":"passage or null","q":"question stem","a":"correct answer","w":["wrong 1","wrong 2","wrong 3"],"e":"short step-by-step explanation"}]}`;
}
async function callModel(cfg, prompt) {
  const model = cfg.model || DEFAULT_MODEL[cfg.provider];
  let res, data, text;
  if (cfg.provider === 'gemini') {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, responseMimeType: 'application/json' } }) });
    data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'Gemini request failed');
    text = data.candidates[0].content.parts.map(p => p.text).join('');
  } else if (cfg.provider === 'openai') {
    res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.9 }) });
    data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'OpenAI request failed');
    text = data.choices[0].message.content;
  } else {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }) });
    data = await res.json(); if (!res.ok) throw new Error((data.error && data.error.message) || 'Anthropic request failed');
    text = data.content.map(c => c.text || '').join('');
  }
  const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(clean);
  return Array.isArray(parsed) ? parsed : parsed.questions;
}
UI.acts.aiGen = async () => {
  const cfg = Store.get().aiCfg, st = UI.$('#ai-status'), btn = UI.$('#ai-go');
  if (!cfg.key) { st.textContent = 'Paste an API key first.'; return; }
  const skill = SKILL_BY_ID[UI.$('#ai-s').value], n = +UI.$('#ai-n').value;
  btn.disabled = true; st.textContent = 'Generating… this can take 10–30 seconds.';
  try {
    const arr = await callModel(cfg, buildPrompt(skill, n)); let ok = 0;
    for (const o of arr) {
      const q = { skill: skill.id, d: o.d, p: o.p && o.p !== 'null' ? o.p : null, q: o.q, a: String(o.a), w: (o.w || []).map(String), e: o.e, ai: true };
      try { Bank.validate(q); Store.get().ai.push(q); ok++; } catch (e) { /* skip malformed */ }
    }
    Store.save(true); st.textContent = ok ? `Added ${ok} question${ok === 1 ? '' : 's'} to ${skill.name}.` : 'The model returned nothing usable. Try again.';
    if (ok) UI.toast(`Added ${ok} AI question${ok === 1 ? '' : 's'}.`, 'ok');
  } catch (e) { st.textContent = 'Failed: ' + (e.message || e); }
  btn.disabled = false;
};
}());

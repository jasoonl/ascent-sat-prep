// Structural checks on the hand-written question bank.
global.window = global;
['skills', 'bank-rw1', 'bank-rw2', 'bank-rw3', 'bank-math'].forEach(f => require('../js/' + f + '.js'));
const bad = []; const words = s => s.replace(/[.,;:!?“”"—]/g, ' ').trim().split(/\s+/);
[...window.RAW_RW, ...window.RAW_MATH].forEach((r, i) => {
  const [s, d, p, q, a, w] = r, txt = (p || '') + ' ' + (q || ''), tag = `${s} #${i}: ${(p || q || '').slice(0, 70)}`;
  if (w && (w.length !== 3 || new Set([String(a), ...w.map(String)]).size !== 4)) bad.push(tag + ' | choices not 4 unique');
  if (/NaN|\[object/.test(JSON.stringify(r))) bad.push(tag + ' | broken text');
  const b = txt.indexOf('______');
  if (b >= 0 && w) {
    const before = words(txt.slice(0, b)).pop() || '', after = words(txt.slice(b + 6))[0] || '';
    [a, ...w].map(String).forEach(c => { const cw = words(c); if (cw.length && before && cw[0].toLowerCase() === before.toLowerCase() && !/^(the|a|of|to|and|in)$/i.test(before)) bad.push(tag + ` | word repeated before blank: "${before}" + "${c}"`); if (cw.length && after && cw[cw.length - 1].toLowerCase() === after.toLowerCase() && cw.length > 1) bad.push(tag + ` | word repeated after blank: "${c}" + "${after}"`); });
    if (/^[,;:.]/.test(String(a)) && txt[b - 1] === ' ') bad.push(tag + ` | punctuation answer leaves a space before it: "${a}"`);
  }
});
console.log(bad.length ? bad.join('\n') : 'bank structure ok', `(${window.RAW_RW.length + window.RAW_MATH.length} items)`); if (bad.length) process.exitCode = 1;

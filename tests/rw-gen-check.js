// Rule checks for generated Reading & Writing questions:
//  - 4 different choices, no broken text
//  - Rhetorical Synthesis: every content word of the correct choice appears in the notes
//  - Command of Evidence: every number in the correct choice appears in the table
//  - Transitions: no wrong choice comes from the same family as the answer
global.window = global;
['skills', 'gen', 'gen-math2', 'gen-rw'].forEach(f => require('../js/' + f + '.js'));
const STOP = new Set('a an the and or but so of to in on at by for with from as is are was were be been has have had it its this that these those which who while than both each four two all only also more less higher lower every one than set out wanted conduct study took place learn found'.split(' '));
const norm = w => w.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z0-9%]/g, '');
const FAM = [['However,', 'In contrast,', 'By contrast,'], ['Similarly,', 'Likewise,'], ['As a result,', 'Therefore,', 'Consequently,'], ['For example,', 'For instance,'], ['Moreover,', 'Additionally,', 'Furthermore,'], ['Nevertheless,', 'Even so,'], ['Afterward,', 'Later,']];
const fam = t => FAM.findIndex(f => f.includes(t));
let n = 0; const bad = [];
for (const sk of ['rs', 'coe', 'trn', 'bnd', 'fss']) for (let i = 0; i < 6000; i++) {
  const q = Gen.make(sk), all = [q.a, ...q.w], txt = JSON.stringify(q); n++;
  const fail = m => bad.push(`${sk}: ${m}\n   ${(q.p || '').slice(0, 160).replace(/\n/g, ' / ')}\n   A: ${q.a}`);
  if (/undefined|NaN|null|\[object|  /.test(txt.replace(/"(table|fig)":null/g, ''))) fail('broken text');
  if (new Set(all).size !== 4) fail('choices not unique: ' + all.join(' | '));
  if (q.p && !q.p.includes('______') && sk !== 'rs' && sk !== 'coe') fail('no blank');
  if (sk === 'rs') { const words = new Set(q.p.split(/\s+/).map(norm)); const miss = q.a.split(/\s+/).map(norm).filter(w => w && !STOP.has(w) && !words.has(w)); if (miss.length) fail('unsupported words ' + miss); }
  if (sk === 'coe') { const nums = new Set(q.table.rows.flat().concat(q.table.head).join(' ').match(/\d+/g)); (q.a.match(/\d+/g) || []).forEach(d => { if (!nums.has(d)) fail('number not in table ' + d); }); }
  if (sk === 'trn') { const f = fam(q.a); if (f < 0 || q.w.some(w => fam(w) === f)) fail('transition family clash ' + all.join(' | ')); }
}
console.log('checked', n, 'generated RW questions;', bad.length, 'problems'); bad.slice(0, 15).forEach(b => console.log(b));
if (bad.length) process.exitCode = 1;

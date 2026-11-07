// Heuristic audit: lists Rhetorical Synthesis items whose correct answer uses words not found in the notes. Most hits are harmless paraphrases; review each by hand.
global.window = global;
['skills', 'bank-rw1', 'bank-rw2', 'bank-rw3'].forEach(f => require('../js/' + f + '.js'));
const STOP = new Set('a an the and or but so of to in on at by for with from as is are was were be been has have had it its this that these those which who whom whose while whereas although though because since than then also both each other one two three more most less than into over under after before during about their there they them his her he she we our you your not no only can could would will may might do does did very much many such between among same different like unlike however while'.split(' '));
const norm = w => w.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z0-9]/g, '');
const stem = w => w.replace(/(ing|ed|es|s|ly)$/, '');
let flagged = 0;
for (const r of window.RAW_RW) {
  if (r[0] !== 'rs') continue;
  const notes = r[2] || '', words = new Set(notes.split(/\s+/).map(norm).filter(Boolean).map(stem));
  const miss = r[4].split(/\s+/).map(norm).filter(w => w && !STOP.has(w) && !/^\d+$/.test(w)).filter(w => !words.has(stem(w)));
  if (miss.length) { flagged++; console.log('-', JSON.stringify(miss), '\n  ', r[4]); }
}
console.log(flagged, 'flagged of', window.RAW_RW.filter(r => r[0] === 'rs').length);

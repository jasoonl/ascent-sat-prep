// Node harness: stress-tests every procedural template for malformed output.
global.window = global;
require('../js/skills.js'); require('../js/gen.js'); require('../js/gen-math2.js'); try { require('../js/gen-rw.js'); } catch (e) { if (!/Cannot find/.test(e.message)) throw e; }
const bad = []; let total = 0;
const re = /NaN|undefined|Infinity|\[object/;
for (const sk of window.Gen.skills()) {
  const n = window.Gen.count(sk);
  for (let t = 0; t < n; t++) {
    for (let i = 0; i < 300; i++) {
      // force each template by retrying make until the template index matches
      let q; let guard = 0;
      do { q = window.Gen.make(sk); guard++; } while (Number(q.id.split(':')[2]) !== t && guard < 400);
      total++;
      const txt = JSON.stringify(q);
      if (re.test(txt)) { bad.push([sk, t, 'bad token', q.q]); break; }
      if (q.grid) { if (isNaN(parseFloat(q.a))) { bad.push([sk, t, 'grid answer', q.a]); break; } }
      else {
        const all = [q.a, ...q.w];
        if (q.w.length !== 3 || new Set(all).size !== 4) { bad.push([sk, t, 'options', JSON.stringify(all), q.q]); break; }
      }
    }
  }
}
console.log('checked', total, 'questions;', bad.length, 'problems');
bad.forEach(b => console.log(b.join(' | ')));

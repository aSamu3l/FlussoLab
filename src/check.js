'use strict';
// Verifica logic: the starting diagram with locked blocks, checking a submission with the same engine
// as the app (core/core.js, taken from the main branch when the image is built).
const FL = require('../core/core.js');

const TYPES = ['decl', 'input', 'output', 'assign', 'if', 'while', 'do', 'for', 'comment'];

// a submitted diagram: plain blocks only, limited in size and depth
function cleanMain(main) {
  let count = 0;
  const str = v => String(v ?? '').slice(0, 2000);
  function block(b, depth) {
    if (!b || typeof b !== 'object' || !TYPES.includes(b.t)) throw new Error('block');
    if (++count > 2000 || depth > 40) throw new Error('size');
    const o = { t: b.t };
    switch (b.t) {
      case 'input': o.v = str(b.v); break;
      case 'output': o.e = str(b.e); o.ln = b.ln !== false; break;
      case 'comment': o.text = str(b.text); break;
      case 'assign': o.v = str(b.v); o.e = str(b.e); if (b.inc === '++' || b.inc === '--') o.inc = b.inc; break;
      case 'decl': o.k = FL.KINDS.includes(b.k) ? b.k : 'int'; o.v = str(b.v); break;
      case 'if': o.c = str(b.c); o.y = seq(b.y, depth); o.n = seq(b.n, depth); break;
      case 'while': case 'do': o.c = str(b.c); o.body = seq(b.body, depth); break;
      case 'for': o.v = str(b.v); o.a = str(b.a); o.b = str(b.b); o.s = str(b.s); o.body = seq(b.body, depth); break;
    }
    if (b.off === true) o.off = true;
    if (b.lock === true) { o.lock = true; o.lk = Math.max(1, b.lk | 0); }
    return o;
  }
  function seq(a, depth) { if (a == null) return []; if (!Array.isArray(a)) throw new Error('seq'); return a.map(b => block(b, depth + 1)); }
  return seq(main, 0);
}

// what the student starts from: the teacher's locked blocks, in order
function startMain(variant) {
  return (variant.blocks || []).map((b, i) => b.t === 'input'
    ? { t: 'input', v: b.v, lock: true, lk: i + 1 }
    : { t: 'output', e: b.v, ln: true, lock: true, lk: i + 1 });
}

// the locked blocks of the submission must be exactly the teacher's ones, in the same order
function structureOk(main, variant) {
  const spec = variant.blocks || [];
  if (FL.lockErr(main, spec.length)) return false;
  const L = FL.lockedBlocks(main);
  if (L.length !== spec.length) return false;
  return spec.every((s, i) => {
    const b = L.find(x => x.lk === i + 1);
    return b && b.t === s.t && (s.t === 'input' ? b.v.trim() === s.v : b.e.trim() === s.v) && !b.off;
  });
}

// runs every test (visible and hidden) on the server: the result cannot be faked by the student
function grade(main, variant) {
  const nl = (variant.blocks || []).length;
  const ok = structureOk(main, variant);
  const results = (variant.tests || []).map(test => {
    if (!ok) return { ok: false, hidden: !!test.hidden, err: 'struttura' };
    let r;
    try { r = FL.checkTest(main, test, 'exact', nl); } catch (e) { return { ok: false, hidden: !!test.hidden, err: 'crash' }; }
    return { ok: !!r.ok, hidden: !!test.hidden, err: r.err ? r.err.key : null, got: (r.locked || []).join('\n').slice(0, 500) };
  });
  return { structure: ok, results, passed: results.filter(r => r.ok).length, total: results.length };
}

module.exports = { cleanMain, startMain, structureOk, grade, FL };

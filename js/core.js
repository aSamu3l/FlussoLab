/* FlussoLab core: expression language, interpreter, code generators. No DOM. */
const FL = (() => {
'use strict';
class FErr extends Error { constructor(key, ...args) { super(key); this.key = key; this.args = args; } }
let BOOLN = ['FALSO', 'VERO'];
function setBoolNames(f, t) { BOOLN = [f, t]; }

/* ---------- lexer ---------- */
const QD = '"“”„', QS = "'‘’";
const TWO = { '<=': '<=', '>=': '>=', '==': '=', '!=': '!=', '<>': '!=', '&&': 'and', '||': 'or', '**': '^' };
const ONE = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/', '%': 'mod', '^': '^',
  '<': '<', '>': '>', '=': '=', '!': 'not', '(': '(', ')': ')', '[': '[', ']': ']', ',': ',',
  '≤': '<=', '≥': '>=', '≠': '!=' };
function lex(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j);
      if (txt.split('.').length > 2) throw new FErr('syntax', txt);
      out.push({ k: 'num', v: parseFloat(txt) }); i = j; continue;
    }
    if (QD.includes(c) || QS.includes(c)) {
      const fam = QD.includes(c) ? QD : QS;
      let j = i + 1; while (j < s.length && !fam.includes(s[j])) j++;
      if (j >= s.length) throw new FErr('str');
      out.push({ k: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (/[A-Za-z_À-ɏ]/.test(c)) {
      let j = i; while (j < s.length && /[A-Za-z0-9_À-ɏ]/.test(s[j])) j++;
      const w = s.slice(i, j), lw = w.toLowerCase();
      if (['and', 'or', 'not', 'mod', 'div'].includes(lw)) out.push({ k: 'op', v: lw });
      else if (lw === 'true' || lw === 'vero') out.push({ k: 'bool', v: true });
      else if (lw === 'false' || lw === 'falso') out.push({ k: 'bool', v: false });
      else out.push({ k: 'id', v: w });
      i = j; continue;
    }
    const two = s.slice(i, i + 2);
    if (TWO[two]) { out.push({ k: 'op', v: TWO[two] }); i += 2; continue; }
    if (ONE[c]) { out.push({ k: 'op', v: ONE[c] }); i++; continue; }
    throw new FErr('syntax', c);
  }
  out.push({ k: 'eof' });
  return out;
}

/* ---------- parser (Pratt) ---------- */
const BP = { or: 1, and: 2, '=': 4, '!=': 4, '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, mod: 6, div: 6, '^': 8 };
const cache = new Map();
function tokText(tk) { return tk.k === 'str' ? '"' + tk.v + '"' : String(tk.v); }
function parse(src) {
  src = String(src ?? '');
  if (cache.has(src)) { const c = cache.get(src); if (c.err) throw c.err; return c.ast; }
  let res;
  try { res = { ast: parseRaw(src) }; } catch (e) { if (!(e instanceof FErr)) throw e; res = { err: e }; }
  if (cache.size > 3000) cache.clear();
  cache.set(src, res);
  if (res.err) throw res.err;
  return res.ast;
}
function parseRaw(src) {
  if (!src.trim()) throw new FErr('empty');
  const toks = lex(src); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const isOp = (tk, v) => tk.k === 'op' && tk.v === v;
  function expect(v) {
    const tk = next();
    if (!isOp(tk, v)) throw tk.k === 'eof' ? new FErr('end') : new FErr('syntax', tokText(tk));
  }
  function post(n) {
    while (isOp(peek(), '[')) { next(); const i = expr(0); expect(']'); n = { k: 'idx', o: n, i }; }
    return n;
  }
  function prefix() {
    const tk = next();
    if (tk.k === 'num') return { k: 'num', v: tk.v };
    if (tk.k === 'str') return post({ k: 'str', v: tk.v });
    if (tk.k === 'bool') return { k: 'bool', v: tk.v };
    if (tk.k === 'id') {
      if (isOp(peek(), '(')) {
        next(); const args = [];
        if (!isOp(peek(), ')')) {
          args.push(expr(0));
          while (isOp(peek(), ',')) { next(); args.push(expr(0)); }
        }
        expect(')');
        return post({ k: 'call', n: tk.v.toLowerCase(), args });
      }
      return post({ k: 'var', n: tk.v });
    }
    if (tk.k === 'op') {
      if (tk.v === '(') { const e = expr(0); expect(')'); return post(e); }
      if (tk.v === '-') return { k: 'un', op: '-', a: expr(7) };
      if (tk.v === '+') return expr(7);
      if (tk.v === 'not') return { k: 'un', op: 'not', a: expr(3) };
    }
    if (tk.k === 'eof') throw new FErr('end');
    throw new FErr('syntax', tokText(tk));
  }
  function expr(rbp) {
    let left = prefix();
    for (;;) {
      const tk = peek();
      if (tk.k !== 'op') break;
      const bp = BP[tk.v];
      if (bp === undefined || bp <= rbp) break;
      next();
      const right = expr(tk.v === '^' ? bp - 1 : bp);
      left = { k: 'bin', op: tk.v, a: left, b: right };
    }
    return left;
  }
  const e = expr(0);
  if (peek().k !== 'eof') throw new FErr('syntax', tokText(peek()));
  return e;
}
function parseLV(src) {
  const a = parse(src);
  let n = a; while (n.k === 'idx') n = n.o;
  if (n.k !== 'var') throw new FErr('lv');
  return a;
}
function splitList(s) { return String(s || '').split(',').map(x => x.trim()).filter(Boolean); }

/* ---------- values ---------- */
function fmtIn(v) { return typeof v === 'string' ? '"' + v + '"' : fmt(v); }
function fmt(v) {
  if (typeof v === 'number') {
    if (!isFinite(v)) return String(v);
    if (Number.isInteger(v)) return String(v);
    return String(parseFloat(v.toPrecision(12)));
  }
  if (typeof v === 'boolean') return v ? BOOLN[1] : BOOLN[0];
  if (Array.isArray(v)) return '[' + Array.from(v, x => x === undefined ? '·' : fmtIn(x)).join(', ') + ']';
  return String(v);
}
function typeOf(v) { return Array.isArray(v) ? 'arr' : typeof v === 'number' ? 'num' : typeof v === 'boolean' ? 'bool' : 'str'; }
function parseInput(raw) {
  const s = String(raw).trim();
  if (/^[-+]?\d+$/.test(s)) return parseInt(s, 10);
  if (/^[-+]?(\d+[.,]\d*|[.,]\d+)$/.test(s)) return parseFloat(s.replace(',', '.'));
  const l = s.toLowerCase();
  if (l === 'vero' || l === 'true') return true;
  if (l === 'falso' || l === 'false') return false;
  return s;
}
const OPN = { '+': '+', '-': '-', '*': '*', '/': '/', mod: 'mod', div: 'div', '^': '^', '<': '<', '<=': '<=', '>': '>', '>=': '>=', and: 'AND', or: 'OR', not: 'NOT' };
function num(a, op) { if (typeof a !== 'number') throw new FErr('type', OPN[op] || op); }
function bool(a, op) { if (typeof a !== 'boolean') throw new FErr('type', OPN[op] || op); }
function idxOk(i) { if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i > 1e6) throw new FErr('idx', fmt(i)); }
function eq(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return a === b;
  return a === b;
}
const FN = {
  sqrt: [1, a => { num(a, 'sqrt'); if (a < 0) throw new FErr('sqrt'); return Math.sqrt(a); }],
  abs: [1, a => { num(a, 'abs'); return Math.abs(a); }],
  int: [1, a => { num(a, 'int'); return Math.trunc(a); }],
  round: [1, a => { num(a, 'round'); return Math.round(a); }],
  floor: [1, a => { num(a, 'floor'); return Math.floor(a); }],
  ceil: [1, a => { num(a, 'ceil'); return Math.ceil(a); }],
  pow: [2, (a, b) => { num(a, 'pow'); num(b, 'pow'); return Math.pow(a, b); }],
  min: [2, (a, b) => { num(a, 'min'); num(b, 'min'); return Math.min(a, b); }],
  max: [2, (a, b) => { num(a, 'max'); num(b, 'max'); return Math.max(a, b); }],
  sin: [1, a => { num(a, 'sin'); return Math.sin(a); }],
  cos: [1, a => { num(a, 'cos'); return Math.cos(a); }],
  tan: [1, a => { num(a, 'tan'); return Math.tan(a); }],
  random: [0, () => Math.random()],
  randint: [2, (a, b) => { num(a, 'randint'); num(b, 'randint'); a = Math.ceil(a); b = Math.floor(b); return a + Math.floor(Math.random() * (b - a + 1)); }],
  len: [1, a => { if (Array.isArray(a) || typeof a === 'string') return a.length; throw new FErr('type', 'len'); }],
  str: [1, a => fmt(a)],
  num: [1, a => { if (typeof a === 'number') return a; const v = parseInput(fmt(a)); if (typeof v !== 'number') throw new FErr('num', fmt(a)); return v; }],
};

/* ---------- evaluator ---------- */
function ev(n, env) {
  switch (n.k) {
    case 'num': case 'str': case 'bool': return n.v;
    case 'var':
      if (!Object.prototype.hasOwnProperty.call(env, n.n)) throw new FErr('undef', n.n);
      return env[n.n];
    case 'idx': {
      const o = ev(n.o, env), i = ev(n.i, env);
      if (!Array.isArray(o) && typeof o !== 'string') throw new FErr('notarr', exprName(n.o));
      idxOk(i);
      const v = o[i];
      if (v === undefined) throw new FErr('idx', fmt(i));
      return v;
    }
    case 'call': {
      const f = FN[n.n];
      if (!f) throw new FErr('fn', n.n);
      if (f[0] !== n.args.length) throw new FErr('args', n.n, f[0]);
      return f[1](...n.args.map(a => ev(a, env)));
    }
    case 'un': {
      const a = ev(n.a, env);
      if (n.op === '-') { num(a, '-'); return -a; }
      bool(a, 'not'); return !a;
    }
    case 'bin': {
      if (n.op === 'and' || n.op === 'or') {
        const a = ev(n.a, env); bool(a, n.op);
        if (n.op === 'and' && !a) return false;
        if (n.op === 'or' && a) return true;
        const b = ev(n.b, env); bool(b, n.op); return b;
      }
      const a = ev(n.a, env), b = ev(n.b, env);
      switch (n.op) {
        case '+':
          if (typeof a === 'string' || typeof b === 'string') return fmt(a) + fmt(b);
          num(a, '+'); num(b, '+'); return a + b;
        case '-': num(a, '-'); num(b, '-'); return a - b;
        case '*': num(a, '*'); num(b, '*'); return a * b;
        case '/': num(a, '/'); num(b, '/'); if (b === 0) throw new FErr('div0'); return a / b;
        case 'mod': num(a, 'mod'); num(b, 'mod'); if (b === 0) throw new FErr('div0'); return a % b;
        case 'div': num(a, 'div'); num(b, 'div'); if (b === 0) throw new FErr('div0'); return Math.trunc(a / b);
        case '^': num(a, '^'); num(b, '^'); return Math.pow(a, b);
        case '=': return eq(a, b);
        case '!=': return !eq(a, b);
        default: {
          const ok = (typeof a === 'number' && typeof b === 'number') || (typeof a === 'string' && typeof b === 'string');
          if (!ok && ((typeof a === 'string' && typeof b === 'number') || (typeof a === 'number' && typeof b === 'string'))) throw new FErr('cmpmix', OPN[n.op]);
          if (!ok) throw new FErr('type', OPN[n.op]);
          if (n.op === '<') return a < b; if (n.op === '<=') return a <= b;
          if (n.op === '>') return a > b; return a >= b;
        }
      }
    }
  }
  throw new FErr('syntax', '?');
}
function exprName(n) { return n.k === 'var' ? n.n : '?'; }
function container(n, env) {
  if (n.k === 'var') {
    if (!Object.prototype.hasOwnProperty.call(env, n.n)) env[n.n] = [];
    const v = env[n.n];
    if (!Array.isArray(v)) throw new FErr('notarr', n.n);
    return v;
  }
  if (n.k === 'idx') {
    const parent = container(n.o, env); const i = ev(n.i, env); idxOk(i);
    if (parent[i] === undefined) parent[i] = [];
    if (!Array.isArray(parent[i])) throw new FErr('notarr', exprName(n.o));
    return parent[i];
  }
  throw new FErr('lv');
}
function assign(lv, val, env) {
  if (lv.k === 'var') { env[lv.n] = val; return; }
  const c = container(lv.o, env); const i = ev(lv.i, env); idxOk(i);
  c[i] = val;
}
function cond(src, env) {
  const v = ev(parse(src), env);
  if (typeof v !== 'boolean') throw new FErr('bool');
  return v;
}

/* ---------- interpreter (generator: yields 'at' before each block, 'input' to ask a value) ---------- */
function* exec(seq, env, io) {
  const tr = io.trace || (() => {});
  for (const b of seq) {
    if (b.t === 'comment') continue;
    yield { t: 'at', b };
    switch (b.t) {
      case 'input': {
        const names = splitList(b.v);
        if (!names.length) throw new FErr('empty');
        const lvs = names.map(parseLV);
        for (let k = 0; k < lvs.length; k++) {
          const raw = yield { t: 'input', b, name: names[k] };
          const v = parseInput(raw);
          assign(lvs[k], v, env); tr('in', b, { name: names[k], value: v });
        }
        break;
      }
      case 'output': { const txt = fmt(ev(parse(b.e), env)); tr('out', b, { text: txt }); io.out(txt, b.ln !== false); break; }
      case 'assign': { const v = ev(parse(b.e), env); assign(parseLV(b.v), v, env); tr('as', b, { value: v }); break; }
      case 'if': { const c = cond(b.c, env); tr('cond', b, { value: c }); yield* exec(c ? b.y : b.n, env, io); break; }
      case 'while':
        for (;;) { const c = cond(b.c, env); tr('cond', b, { value: c }); if (!c) break; yield* exec(b.body, env, io); yield { t: 'at', b }; }
        break;
      case 'do':
        for (;;) { yield* exec(b.body, env, io); yield { t: 'at', b }; const c = cond(b.c, env); tr('cond', b, { value: c }); if (!c) break; }
        break;
      case 'for': {
        const lv = parseLV(b.v);
        const from = ev(parse(b.a), env), to = ev(parse(b.b), env);
        const st = String(b.s ?? '').trim() ? ev(parse(b.s), env) : 1;
        num(from, 'for'); num(to, 'for'); num(st, 'for');
        if (st === 0) throw new FErr('step0');
        assign(lv, from, env);
        for (;;) {
          const cur = ev(lv, env); num(cur, 'for');
          const go = st > 0 ? cur <= to : cur >= to;
          tr('for', b, { value: cur, go });
          if (!go) break;
          yield* exec(b.body, env, io);
          yield { t: 'at', b };
          assign(lv, ev(lv, env) + st, env);
        }
        break;
      }
    }
  }
}

/* ---------- static checks ---------- */
function rootName(src) { try { let n = parseLV(src); while (n.k === 'idx') n = n.o; return n.n; } catch (e) { return null; } }
function knownVars(main) {
  const K = new Set();
  (function walk(seq) {
    for (const b of seq) {
      if (b.t === 'input') splitList(b.v).forEach(v => { const r = rootName(v); if (r) K.add(r); });
      if (b.t === 'assign' || b.t === 'for') { const r = rootName(b.v); if (r) K.add(r); }
      if (b.t === 'comment') continue;
      if (b.t === 'if') { walk(b.y); walk(b.n); } else if (b.body) walk(b.body);
    }
  })(main);
  return K;
}
function usedVars(n, out = []) {
  switch (n.k) {
    case 'var': out.push(n.n); break;
    case 'idx': usedVars(n.o, out); usedVars(n.i, out); break;
    case 'call': n.args.forEach(a => usedVars(a, out)); break;
    case 'un': usedVars(n.a, out); break;
    case 'bin': usedVars(n.a, out); usedVars(n.b, out); break;
  }
  return out;
}
function checkExpr(src, known, isCond) {
  const a = parse(src);
  if (known) for (const v of usedVars(a)) if (!known.has(v)) throw new FErr('nodef', v);
  const chk = n => { if (n.k === 'call') { const f = FN[n.n]; if (!f) throw new FErr('fn', n.n); if (f[0] !== n.args.length) throw new FErr('args', n.n, f[0]); }
    ['a', 'b', 'o', 'i'].forEach(k => n[k] && typeof n[k] === 'object' && chk(n[k])); (n.args || []).forEach(chk); };
  chk(a);
  if (isCond) {
    const ok = (a.k === 'bin' && ['=', '!=', '<', '<=', '>', '>=', 'and', 'or'].includes(a.op)) || (a.k === 'un' && a.op === 'not') ||
      a.k === 'bool' || a.k === 'var' || a.k === 'idx' || a.k === 'call';
    if (!ok) throw new FErr('notcond');
  }
  return a;
}
function checkLV(src, known) {
  const a = parseLV(src);
  if (known && a.k === 'idx') { let n = a; while (n.k === 'idx') { usedVars(n.i).forEach(v => { if (!known.has(v)) throw new FErr('nodef', v); }); n = n.o; } }
  return a;
}
function staticErr(b, known) {
  try {
    switch (b.t) {
      case 'input': { const n = splitList(b.v); if (!n.length) throw new FErr('empty'); n.forEach(x => checkLV(x, known)); break; }
      case 'output': checkExpr(b.e, known); break;
      case 'assign': checkLV(b.v, known); checkExpr(b.e, known); break;
      case 'if': case 'while': case 'do': checkExpr(b.c, known, true); break;
      case 'for': checkLV(b.v, known); checkExpr(b.a, known); checkExpr(b.b, known); if (String(b.s ?? '').trim()) checkExpr(b.s, known); break;
      case 'comment': break;
    }
    return null;
  } catch (e) { if (e instanceof FErr) return e; throw e; }
}
function firstError(main) {
  const known = knownVars(main);
  let found = null;
  (function walk(seq) {
    for (const b of seq) {
      if (found) return;
      const e = staticErr(b, known); if (e) { found = { b, e }; return; }
      if (b.t === 'if') { walk(b.y); walk(b.n); } else if (b.body) walk(b.body);
    }
  })(main);
  return found;
}

/* ---------- pseudocode ---------- */
const PK = {
  it: { start: 'INIZIO', end: 'FINE', read: 'LEGGI', write: 'SCRIVI', if: 'SE', then: 'ALLORA', else: 'ALTRIMENTI', endif: 'FINE SE',
    while: 'MENTRE', do: 'ESEGUI', endwhile: 'FINE MENTRE', repeat: 'RIPETI', repwhile: 'MENTRE', for: 'PER', from: 'DA', to: 'A', step: 'PASSO', endfor: 'FINE PER', noln: '(senza andare a capo)' },
  en: { start: 'BEGIN', end: 'END', read: 'READ', write: 'WRITE', if: 'IF', then: 'THEN', else: 'ELSE', endif: 'END IF',
    while: 'WHILE', do: 'DO', endwhile: 'END WHILE', repeat: 'REPEAT', repwhile: 'WHILE', for: 'FOR', from: 'FROM', to: 'TO', step: 'STEP', endfor: 'END FOR', noln: '(no new line)' },
};
function toPseudoLines(main, lang) {
  const K = PK[lang] || PK.it, L = [{ s: K.start, id: null }];
  (function walk(seq, d) {
    const ind = '    '.repeat(d);
    const P = (s, b) => L.push({ s: ind + s, id: b ? b.id : null });
    for (const b of seq) {
      switch (b.t) {
        case 'comment': P(`// ${b.text || ''}`, b); break;
        case 'input': P(`${K.read} ${b.v}`, b); break;
        case 'output': P(`${K.write} ${b.e}${b.ln === false ? ' ' + K.noln : ''}`, b); break;
        case 'assign': P(`${b.v} = ${b.e}`, b); break;
        case 'if': P(`${K.if} ${b.c} ${K.then}`, b); walk(b.y, d + 1);
          if (b.n.length) { P(K.else, b); walk(b.n, d + 1); }
          P(K.endif, b); break;
        case 'while': P(`${K.while} ${b.c} ${K.do}`, b); walk(b.body, d + 1); P(K.endwhile, b); break;
        case 'do': P(K.repeat, b); walk(b.body, d + 1); P(`${K.repwhile} ${b.c}`, b); break;
        case 'for': {
          const st = String(b.s ?? '').trim();
          P(`${K.for} ${b.v} ${K.from} ${b.a} ${K.to} ${b.b}${st && st !== '1' ? ` ${K.step} ${st}` : ''} ${K.do}`, b);
          walk(b.body, d + 1); P(K.endfor, b); break;
        }
      }
    }
  })(main, 1);
  L.push({ s: K.end, id: null });
  return L;
}
function toPseudo(main, lang) { return toPseudoLines(main, lang).map(l => l.s).join('\n'); }

/* ---------- Python ---------- */
const PYOP = { or: ['or', 1], and: ['and', 2], '=': ['==', 4], '!=': ['!=', 4], '<': ['<', 4], '<=': ['<=', 4], '>': ['>', 4], '>=': ['>=', 4],
  '+': ['+', 5], '-': ['-', 5], '*': ['*', 6], '/': ['/', 6], mod: ['%', 6], div: ['//', 6], '^': ['**', 8] };
const PYFN = { sqrt: ['math.sqrt', 'math'], abs: ['abs'], int: ['int'], round: ['round'], floor: ['math.floor', 'math'], ceil: ['math.ceil', 'math'],
  pow: ['pow'], min: ['min'], max: ['max'], sin: ['math.sin', 'math'], cos: ['math.cos', 'math'], tan: ['math.tan', 'math'],
  random: ['random.random', 'random'], randint: ['random.randint', 'random'], len: ['len'], str: ['str'], num: ['float'] };
const PYKW = new Set(['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'print', 'input', 'leggi', 'math', 'random', 'None', 'True', 'False', 'len', 'str', 'int', 'float', 'range', 'list', 'dict']);
function pyName(n) { return PYKW.has(n) ? n + '_' : n; }
function pyE(n, U) {
  switch (n.k) {
    case 'num': return { s: String(n.v), p: 9 };
    case 'str': return { s: JSON.stringify(n.v), p: 9 };
    case 'bool': return { s: n.v ? 'True' : 'False', p: 9 };
    case 'var': return { s: pyName(n.n), p: 9 };
    case 'idx': { const o = pyE(n.o, U); return { s: (o.p < 9 ? `(${o.s})` : o.s) + '[' + pyE(n.i, U).s + ']', p: 9 }; }
    case 'call': {
      const m = PYFN[n.n] || [n.n];
      if (m[1]) U.add(m[1]);
      return { s: `${m[0]}(${n.args.map(a => pyE(a, U).s).join(', ')})`, p: 9 };
    }
    case 'un': {
      const a = pyE(n.a, U);
      if (n.op === '-') return { s: '-' + (a.p < 7 ? `(${a.s})` : a.s), p: 7 };
      return { s: 'not ' + (a.p < 3 ? `(${a.s})` : a.s), p: 3 };
    }
    case 'bin': {
      const [sym, p] = PYOP[n.op];
      const a = pyE(n.a, U), b = pyE(n.b, U);
      const ra = n.op === '^', na = p === 4;
      const ls = (a.p < p || ((ra || na) && a.p === p)) ? `(${a.s})` : a.s;
      const rs = (b.p < p || (!ra && b.p === p)) ? `(${b.s})` : b.s;
      return { s: `${ls} ${sym} ${rs}`, p };
    }
  }
  return { s: '?', p: 9 };
}
function pyPrint(ast, U, ln) {
  const end = ln === false ? ', end=""' : '';
  const parts = []; let n = ast;
  while (n.k === 'bin' && n.op === '+') { parts.unshift(n.b); n = n.a; }
  parts.unshift(n);
  const k = parts.findIndex(x => x.k === 'str');
  if (k < 0 || parts.length === 1) return `print(${pyE(ast, U).s}${end})`;
  let items = parts;
  if (k > 1) { let pre = parts[0]; for (let i = 1; i < k; i++) pre = { k: 'bin', op: '+', a: pre, b: parts[i] }; items = [pre, ...parts.slice(k)]; }
  return `print(${items.map(x => pyE(x, U).s).join(', ')}, sep=""${end})`;
}
function toPython(main, lang) {
  const U = new Set(), arrays = new Set(), L = [];
  let hasInput = false;
  const E = (src) => { try { return pyE(parse(src), U).s; } catch (e) { return `...  # ${src}`; } };
  const LV = (src) => { try { return pyE(parseLV(src), U).s; } catch (e) { return pyName(String(src || 'x').replace(/\W/g, '') || 'x'); } };
  const lit = (s) => { try { const a = parse(s); if (a.k === 'num') return a.v; if (a.k === 'un' && a.op === '-' && a.a.k === 'num') return -a.a.v; } catch (e) {} return null; };
  const noteArr = (src) => { try { let n = parseLV(src); if (n.k !== 'idx') return; while (n.k === 'idx') n = n.o; arrays.add(pyName(n.n)); } catch (e) {} };
  (function walk(seq, d) {
    const ind = '    '.repeat(d);
    if (!seq.filter(b => b.t !== 'comment').length) { seq.forEach(b => L.push(`${ind}# ${b.text || ''}`)); L.push(ind + 'pass'); return; }
    for (const b of seq) {
      switch (b.t) {
        case 'comment': L.push(`${ind}# ${b.text || ''}`); break;
        case 'input': hasInput = true;
          for (const nm of splitList(b.v)) { noteArr(nm); L.push(`${ind}${LV(nm)} = leggi(${JSON.stringify(nm)})`); }
          if (!splitList(b.v).length) L.push(ind + 'pass');
          break;
        case 'output': { let s; try { s = pyPrint(parse(b.e), U, b.ln); } catch (e) { s = `print()  # ${b.e}`; } L.push(ind + s); break; }
        case 'assign': noteArr(b.v); L.push(`${ind}${LV(b.v)} = ${E(b.e)}`); break;
        case 'if': L.push(`${ind}if ${E(b.c)}:`); walk(b.y, d + 1);
          if (b.n.length) { L.push(`${ind}else:`); walk(b.n, d + 1); } break;
        case 'while': L.push(`${ind}while ${E(b.c)}:`); walk(b.body, d + 1); break;
        case 'do': L.push(`${ind}while True:`); walk(b.body, d + 1);
          L.push(`${ind}    if not (${E(b.c)}):`, `${ind}        break`); break;
        case 'for': {
          const ss = String(b.s ?? '').trim(); const st = ss === '' ? 1 : lit(ss);
          if (st !== null && Number.isInteger(st) && st !== 0) {
            const bl = lit(b.b);
            const end = st > 0 ? (bl !== null ? String(bl + 1) : `${E(b.b)} + 1`) : (bl !== null ? String(bl - 1) : `${E(b.b)} - 1`);
            L.push(`${ind}for ${LV(b.v)} in range(${E(b.a)}, ${end}${st === 1 ? '' : ', ' + st}):`);
            walk(b.body, d + 1);
          } else {
            const v = LV(b.v);
            L.push(`${ind}${v} = ${E(b.a)}`, `${ind}while ${v} <= ${E(b.b)}:`);
            walk(b.body, d + 1);
            L.push(`${ind}    ${v} = ${v} + ${E(ss || '1')}`);
          }
          break;
        }
      }
    }
  })(main, 0);
  const H = [lang === 'en' ? '# Generated by FlussoLab' : '# Generato da FlussoLab'];
  if (U.has('math')) H.push('import math');
  if (U.has('random')) H.push('import random');
  if (hasInput) {
    H.push('', 'def leggi(nome):',
      '    testo = input(nome + "? ").strip()',
      '    try:', '        return int(testo)', '    except ValueError:', '        pass',
      '    try:', '        return float(testo.replace(",", "."))', '    except ValueError:', '        return testo');
  }
  if (arrays.size) { H.push(''); for (const a of arrays) H.push(`${a} = {}  # ${lang === 'en' ? 'array' : 'vettore'}`); }
  H.push('');
  return H.join('\n') + '\n' + L.join('\n') + '\n';
}

/* ---------- source printer & condition inversion ---------- */
const SRC = { or: ['OR', 1], and: ['AND', 2], '=': ['==', 4], '!=': ['!=', 4], '<': ['<', 4], '<=': ['<=', 4], '>': ['>', 4], '>=': ['>=', 4],
  '+': ['+', 5], '-': ['-', 5], '*': ['*', 6], '/': ['/', 6], mod: ['mod', 6], div: ['div', 6], '^': ['^', 8] };
function srcE(n) {
  switch (n.k) {
    case 'num': return { s: String(n.v), p: 9 };
    case 'str': return { s: '"' + n.v + '"', p: 9 };
    case 'bool': return { s: n.v ? 'vero' : 'falso', p: 9 };
    case 'var': return { s: n.n, p: 9 };
    case 'idx': { const o = srcE(n.o); return { s: (o.p < 9 ? `(${o.s})` : o.s) + '[' + srcE(n.i).s + ']', p: 9 }; }
    case 'call': return { s: `${n.n}(${n.args.map(a => srcE(a).s).join(', ')})`, p: 9 };
    case 'un': { const a = srcE(n.a);
      if (n.op === '-') return { s: '-' + (a.p < 7 ? `(${a.s})` : a.s), p: 7 };
      return { s: 'NOT ' + (a.p < 9 ? `(${a.s})` : a.s), p: 3 }; }
    case 'bin': {
      const [sym, p] = SRC[n.op]; const a = srcE(n.a), b = srcE(n.b);
      const ra = n.op === '^', na = p === 4;
      const ls = (a.p < p || ((ra || na) && a.p === p)) ? `(${a.s})` : a.s;
      const rs = (b.p < p || (!ra && b.p === p)) ? `(${b.s})` : b.s;
      return { s: `${ls} ${sym} ${rs}`, p };
    }
  }
  return { s: '?', p: 9 };
}
const FLIP = { '=': '!=', '!=': '=', '<': '>=', '>=': '<', '>': '<=', '<=': '>' };
function negate(n) {
  if (n.k === 'bin' && FLIP[n.op]) return { ...n, op: FLIP[n.op] };
  if (n.k === 'bin' && n.op === 'and') return { k: 'bin', op: 'or', a: negate(n.a), b: negate(n.b) };
  if (n.k === 'bin' && n.op === 'or') return { k: 'bin', op: 'and', a: negate(n.a), b: negate(n.b) };
  if (n.k === 'un' && n.op === 'not') return n.a;
  if (n.k === 'bool') return { k: 'bool', v: !n.v };
  return { k: 'un', op: 'not', a: n };
}
function invertCond(src) { return srcE(negate(parse(src))).s; }

return { toPseudoLines, invertCond, knownVars, firstError, FErr, parse, parseLV, splitList, exec, fmt, typeOf, parseInput, staticErr, toPseudo, toPython, setBoolNames, FN };
})();
if (typeof module !== 'undefined') module.exports = FL;

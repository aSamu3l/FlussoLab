/* FlussoLab core: expression language, interpreter, code generators. No DOM. */
const FL = (() => {
'use strict';
class FErr extends Error { constructor(key, ...args) { super(key); this.key = key; this.args = args; } }
let BOOLN = ['FALSO', 'VERO'];
// true/false (and vero/falso) always work; the names of the current language work too
const BW = { t: new Set(['true', 'vero']), f: new Set(['false', 'falso']) };
let BWL = { t: BW.t, f: BW.f };
function setBoolNames(f, t) {
  BOOLN = [f, t];
  const w = x => String(x).toLowerCase();
  BWL = { t: new Set([...BW.t, ...(/^[\p{L}_]+$/u.test(t) ? [w(t)] : [])]), f: new Set([...BW.f, ...(/^[\p{L}_]+$/u.test(f) ? [w(f)] : [])]) };
  cache.clear();
}

/* ---------- lexer ---------- */
const QD = '"“”„', QS = "'‘’";
const TWO = { '<=': '<=', '>=': '>=', '==': '=', '!=': '!=', '<>': '!=', '&&': 'and', '||': 'or', '**': '^' };
const ONE = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/', '%': 'mod', '^': '^',
  '<': '<', '>': '>', '!': 'not', '(': '(', ')': ')', '[': '[', ']': ']', ',': ',',
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
      out.push(txt.includes('.') ? { k: 'num', v: parseFloat(txt), t: txt } : { k: 'num', v: BigInt(txt), t: txt }); i = j; continue;
    }
    if (QD.includes(c) || QS.includes(c)) {
      const fam = QD.includes(c) ? QD : QS;
      let j = i + 1; while (j < s.length && !fam.includes(s[j])) j++;
      if (j >= s.length) throw new FErr('str');
      out.push({ k: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (/[A-Za-z_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/.test(c)) {
      let j = i; while (j < s.length && /[A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/.test(s[j])) j++;
      const w = s.slice(i, j), lw = w.toLowerCase();
      if (['and', 'or', 'not', 'mod', 'div'].includes(lw)) out.push({ k: 'op', v: lw });
      else if (BWL.t.has(lw)) out.push({ k: 'bool', v: true });
      else if (BWL.f.has(lw)) out.push({ k: 'bool', v: false });
      else out.push({ k: 'id', v: w });
      i = j; continue;
    }
    const two = s.slice(i, i + 2);
    if (TWO[two]) { out.push({ k: 'op', v: TWO[two] }); i += 2; continue; }
    if (c === '=') throw new FErr('assigneq');
    if (ONE[c]) { out.push({ k: 'op', v: ONE[c] }); i++; continue; }
    throw new FErr('syntax', c);
  }
  out.push({ k: 'eof' });
  return out;
}

/* ---------- parser (Pratt) ---------- */
const CASTS = { int: 'int', float: 'float', double: 'float' };
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
    if (tk.k === 'num') return { k: 'num', v: tk.v, t: tk.t };
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
      if (tk.v === '(') {
        const a = toks[p], c = toks[p + 1];
        if (a && a.k === 'id' && CASTS[a.v.toLowerCase()] && c && isOp(c, ')')) { p += 2; return { k: 'cast', to: CASTS[a.v.toLowerCase()], a: expr(7) }; }
        const e = expr(0); expect(')'); return post(e);
      }
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
  if (RESERVED.has(n.n.toLowerCase())) throw new FErr('reserved', n.n);
  return a;
}
const RESERVED = new Set(['int', 'float', 'double', 'string', 'bool']);
function splitList(s) { return String(s || '').split(',').map(x => x.trim()).filter(Boolean); }

/* ---------- values ----------
   int   -> JS BigInt  (7, -3): division between ints truncates, like in C
   float -> JS Number  (3.5, 7.0)                                            */
const isNum = v => typeof v === 'number' || typeof v === 'bigint';
function fmtIn(v) { return typeof v === 'string' ? '"' + v + '"' : fmt(v); }
function fmt(v) {
  if (typeof v === 'bigint') return String(v);
  if (typeof v === 'number') {
    if (!isFinite(v)) return String(v);
    const t = Number.isInteger(v) && Math.abs(v) < 1e16 ? v.toFixed(1) : String(parseFloat(v.toPrecision(12)));
    return /^-?\d+$/.test(t) ? t + '.0' : t;
  }
  if (typeof v === 'boolean') return v ? BOOLN[1] : BOOLN[0];
  if (Array.isArray(v)) return '[' + Array.from(v, x => x === undefined ? '·' : fmtIn(x)).join(', ') + ']';
  return String(v);
}
function typeOf(v) { return Array.isArray(v) ? 'arr' : typeof v === 'bigint' ? 'int' : typeof v === 'number' ? 'float' : typeof v === 'boolean' ? 'bool' : 'str'; }
function parseInput(raw) {
  const s = String(raw).trim();
  if (/^[-+]?\d+$/.test(s)) return BigInt(s.replace('+', ''));
  if (/^[-+]?(\d+[.,]\d*|[.,]\d+)$/.test(s)) return parseFloat(s.replace(',', '.'));
  const l = s.toLowerCase();
  if (BWL.t.has(l)) return true;
  if (BWL.f.has(l)) return false;
  return s;
}
const OPN = { '+': '+', '-': '-', '*': '*', '/': '/', mod: 'mod', div: 'div', '^': '^', '<': '<', '<=': '<=', '>': '>', '>=': '>=', and: 'AND', or: 'OR', not: 'NOT' };
function num(a, op) { if (!isNum(a)) throw new FErr('type', OPN[op] || op); }
function bool(a, op) { if (typeof a !== 'boolean') throw new FErr('type', OPN[op] || op); }
function idxOk(i) { if (typeof i !== 'bigint' || i < 0n || i > 1000000n) throw new FErr('idx', fmt(i)); return Number(i); }
function eq(a, b) { return isNum(a) && isNum(b) ? a == b : a === b; } // eslint-disable-line eqeqeq
function toInt(x, op) {
  num(x, op); if (typeof x === 'bigint') return x;
  if (!isFinite(x)) throw new FErr('num', fmt(x));
  return BigInt(Math.trunc(x));
}
const MAXBITS = 20000; // about 6000 digits: more would freeze the page
const bits = x => (x < 0n ? -x : x).toString(16).length * 4;
function arith(op, a, b) {
  num(a, op); num(b, op);
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    switch (op) {
      case '+': return a + b; case '-': return a - b;
      case '*': if (bits(a) + bits(b) > MAXBITS) throw new FErr('big'); return a * b;
      case '/': case 'div': if (b === 0n) throw new FErr('div0'); return a / b;
      case 'mod': if (b === 0n) throw new FErr('div0'); return a % b;
      case '^':
        if (b < 0n) return Number(a) ** Number(b);
        if (a === 0n || a === 1n) return b === 0n ? 1n : a;
        if (a === -1n) return b % 2n === 0n ? 1n : -1n;
        if (b > BigInt(MAXBITS) || bits(a) * Number(b) > MAXBITS) throw new FErr('big');
        return a ** b;
    }
  }
  const x = Number(a), y = Number(b);
  switch (op) {
    case '+': return x + y; case '-': return x - y; case '*': return x * y;
    case '/': if (y === 0) throw new FErr('div0'); return x / y;
    case 'div': if (y === 0) throw new FErr('div0'); return toInt(x / y, op);
    case 'mod': if (y === 0) throw new FErr('div0'); return x % y;
    case '^': return x ** y;
  }
}
const F1 = (name, f) => [1, a => { num(a, name); return f(Number(a)); }];
const FN = {
  sqrt: [1, a => { num(a, 'sqrt'); if (a < 0) throw new FErr('sqrt'); return Math.sqrt(Number(a)); }],
  abs: [1, a => { num(a, 'abs'); return typeof a === 'bigint' ? (a < 0n ? -a : a) : Math.abs(a); }],
  int: [1, a => toInt(a, 'int')],
  float: [1, a => { num(a, 'float'); return Number(a); }],
  round: [1, a => toInt(typeof a === 'bigint' ? a : (num(a, 'round'), Math.round(a)), 'round')],
  floor: [1, a => toInt(typeof a === 'bigint' ? a : (num(a, 'floor'), Math.floor(a)), 'floor')],
  ceil: [1, a => toInt(typeof a === 'bigint' ? a : (num(a, 'ceil'), Math.ceil(a)), 'ceil')],
  pow: [2, (a, b) => arith('^', a, b)],
  min: [2, (a, b) => { num(a, 'min'); num(b, 'min'); return b < a ? b : a; }],
  max: [2, (a, b) => { num(a, 'max'); num(b, 'max'); return b > a ? b : a; }],
  sin: F1('sin', Math.sin), cos: F1('cos', Math.cos), tan: F1('tan', Math.tan),
  random: [0, () => Math.random()],
  randint: [2, (a, b) => { let lo = toInt(a, 'randint'), hi = toInt(b, 'randint'); if (hi < lo) [lo, hi] = [hi, lo]; return lo + BigInt(Math.floor(Math.random() * (Number(hi - lo) + 1))); }],
  len: [1, a => { if (Array.isArray(a) || typeof a === 'string') return BigInt(a.length); throw new FErr('type', 'len'); }],
  str: [1, a => fmt(a)],
  num: [1, a => { if (isNum(a)) return a; const v = parseInput(fmt(a)); if (!isNum(v)) throw new FErr('num', fmt(a)); return v; }],
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
      const k = idxOk(i);
      const v = o[k];
      if (v === undefined) throw new FErr('idx', fmt(i));
      return v;
    }
    case 'call': {
      const f = FN[n.n];
      if (!f) throw new FErr('fn', n.n);
      if (f[0] !== n.args.length) throw new FErr('args', n.n, f[0]);
      return f[1](...n.args.map(a => ev(a, env)));
    }
    case 'cast': {
      const a = ev(n.a, env);
      return n.to === 'int' ? toInt(a, '(int)') : (num(a, '(float)'), Number(a));
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
          if (typeof a === 'string' && typeof b === 'string') return a + b;
          // like Python: text joins only text, a number needs str()
          if (typeof a === 'string' || typeof b === 'string') throw new FErr('strmix', typeOf(typeof a === 'string' ? b : a));
          return arith('+', a, b);
        case '-': case '*': case '/': case 'mod': case 'div': case '^': return arith(n.op, a, b);
        case '=': return eq(a, b);
        case '!=': return !eq(a, b);
        default: {
          const ok = (isNum(a) && isNum(b)) || (typeof a === 'string' && typeof b === 'string');
          if (!ok && ((typeof a === 'string' && isNum(b)) || (isNum(a) && typeof b === 'string'))) throw new FErr('cmpmix', OPN[n.op]);
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
    const parent = container(n.o, env); const i = idxOk(ev(n.i, env));
    if (parent[i] === undefined) parent[i] = [];
    if (!Array.isArray(parent[i])) throw new FErr('notarr', exprName(n.o));
    return parent[i];
  }
  throw new FErr('lv');
}
function assign(lv, val, env) {
  if (lv.k === 'var') { env[lv.n] = val; return; }
  const c = container(lv.o, env); const i = idxOk(ev(lv.i, env));
  c[i] = val;
}
/* ---------- declared types ---------- */
const KINDS = ['int', 'float', 'str', 'bool'];
function parseDecl(src) {
  const items = splitList(src);
  if (!items.length) throw new FErr('empty');
  return items.map(x => {
    const m = /^([A-Za-z_\u00C0-\u024F][A-Za-z0-9_\u00C0-\u024F]*)\s*(\[\s*\])?$/.exec(x);
    if (!m) throw new FErr('declname', x);
    if (RESERVED.has(m[1].toLowerCase())) throw new FErr('reserved', m[1]);
    return { n: m[1], arr: !!m[2] };
  });
}
const KALIAS = { int: 'int', float: 'float', double: 'float', string: 'str', bool: 'bool' };
// "int n", "float media", "v[i]" -> { k: 'int' | null, src: 'n', lv: <ast> }
function lvTyped(src) {
  const m = /^\s*([A-Za-z]+)\s+(\S.*)$/.exec(String(src || ''));
  if (m && KALIAS[m[1].toLowerCase()]) return { k: KALIAS[m[1].toLowerCase()], src: m[2].trim(), lv: parseLV(m[2]) };
  return { k: null, src: String(src || '').trim(), lv: parseLV(src) };
}
function declare(T, env, name, k, arr) {
  const old = T[name];
  if (old && (old.k !== k || old.arr !== arr)) throw new FErr('redecl', name);
  if (!old && Object.prototype.hasOwnProperty.call(env, name)) env[name] = checkType({ k: 'var', n: name }, env[name], { [name]: { k, arr } });
  T[name] = { k, arr };
}
function declTyped(ty, T, env) { if (ty.k) declare(T, env, lvRoot(ty.lv).n, ty.k, ty.lv.k === 'idx'); return ty.lv; }
function kindOK(k, v) {
  if (k === 'int') return typeof v === 'bigint';
  if (k === 'float') return isNum(v);
  if (k === 'str') return typeof v === 'string';
  return typeof v === 'boolean';
}
function lvRoot(lv) { let n = lv; while (n.k === 'idx') n = n.o; return n; }
// checks a value against the declared type; an int stored in a float variable becomes a float, as in C
function checkType(lv, val, T) {
  if (!T) return val;
  const r = lvRoot(lv), d = T[r.n]; if (!d) return val;
  if (lv.k === 'var' && d.arr) { if (!Array.isArray(val)) throw new FErr('tarr', r.n, d.k); return val; }
  if (Array.isArray(val) || !kindOK(d.k, val)) throw new FErr('tdecl', r.n, d.k, fmt(val));
  return d.k === 'float' ? Number(val) : val;
}
function setVar(lv, val, env, T) { assign(lv, checkType(lv, val, T), env); }
function parseTyped(raw, k, name) {
  const s = String(raw).trim();
  if (k === 'str') return String(raw);
  const v = parseInput(s);
  if (k === 'bool' ? typeof v !== 'boolean' : (k === 'int' ? typeof v !== 'bigint' : !isNum(v))) throw new FErr('tin', s, k, name);
  return k === 'float' ? Number(v) : v;
}
function cond(src, env) {
  const v = ev(parse(src), env);
  if (typeof v !== 'boolean') throw new FErr('bool');
  return v;
}

/* ---------- interpreter (generator: yields 'at' before each block, 'input' to ask a value) ---------- */
function* exec(seq, env, io) {
  const tr = io.trace || (() => {});
  const T = io.types || (io.types = Object.create(null));
  for (const b of seq) {
    if (b.t === 'comment') continue;
    yield { t: 'at', b };
    switch (b.t) {
      case 'input': {
        const names = splitList(b.v);
        if (!names.length) throw new FErr('empty');
        const tys = names.map(lvTyped);
        for (let k = 0; k < tys.length; k++) {
          const lv = declTyped(tys[k], T, env), nm = tys[k].src;
          const raw = yield { t: 'input', b, name: nm };
          const d = T[lvRoot(lv).n];
          const v = d ? parseTyped(raw, d.k, nm) : parseInput(raw);
          setVar(lv, v, env, T); tr('in', b, { name: nm, value: v });
        }
        break;
      }
      case 'output': { const txt = fmt(ev(parse(b.e), env)); tr('out', b, { text: txt }); io.out(txt, b.ln !== false); break; }
      case 'assign': {
        const lv = b.inc ? parseLV(b.v) : declTyped(lvTyped(b.v), T, env);
        if (b.inc) {
          const cur = ev(lv, env), r = lvRoot(lv), d = T[r.n];
          if (typeof cur !== 'bigint' || (d && d.k !== 'int')) throw new FErr('incint', b.inc, r.n);
          const v = cur + (b.inc === '++' ? 1n : -1n); setVar(lv, v, env, T); tr('as', b, { value: v }); break;
        }
        const v = ev(parse(b.e), env); setVar(lv, v, env, T); tr('as', b, { value: v }); break;
      }
      case 'decl': {
        if (!KINDS.includes(b.k)) throw new FErr('kind');
        for (const it of parseDecl(b.v)) declare(T, env, it.n, b.k, it.arr);
        tr('decl', b, {});
        break;
      }
      case 'if': { const c = cond(b.c, env); tr('cond', b, { value: c }); yield* exec(c ? b.y : b.n, env, io); break; }
      case 'while':
        for (;;) { const c = cond(b.c, env); tr('cond', b, { value: c }); if (!c) break; yield* exec(b.body, env, io); yield { t: 'at', b }; }
        break;
      case 'do':
        for (;;) { yield* exec(b.body, env, io); yield { t: 'at', b }; const c = cond(b.c, env); tr('cond', b, { value: c }); if (!c) break; }
        break;
      case 'for': {
        const lv = declTyped(lvTyped(b.v), T, env);
        const from = ev(parse(b.a), env), to = ev(parse(b.b), env);
        const st = String(b.s ?? '').trim() ? ev(parse(b.s), env) : 1n;
        num(from, 'for'); num(to, 'for'); num(st, 'for');
        if (st == 0) throw new FErr('step0'); // eslint-disable-line eqeqeq
        setVar(lv, from, env, T);
        for (;;) {
          const cur = ev(lv, env); num(cur, 'for');
          const go = st > 0 ? cur <= to : cur >= to;
          tr('for', b, { value: cur, go });
          if (!go) break;
          yield* exec(b.body, env, io);
          yield { t: 'at', b };
          setVar(lv, arith('+', ev(lv, env), st), env, T);
        }
        break;
      }
    }
  }
}

/* ---------- static checks ---------- */
function rootName(src) { try { let n = lvTyped(src).lv; while (n.k === 'idx') n = n.o; return n.n; } catch (e) { return null; } }
function knownVars(main) {
  const K = new Set();
  (function walk(seq) {
    for (const b of seq) {
      if (b.t === 'input') splitList(b.v).forEach(v => { const r = rootName(v); if (r) K.add(r); });
      if (b.t === 'assign' || b.t === 'for') { const r = rootName(b.v); if (r) K.add(r); }
      if (b.t === 'comment' || b.t === 'decl') continue;
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
    case 'un': case 'cast': usedVars(n.a, out); break;
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
  const a = lvTyped(src).lv;
  if (known && a.k === 'idx') { let n = a; while (n.k === 'idx') { usedVars(n.i).forEach(v => { if (!known.has(v)) throw new FErr('nodef', v); }); n = n.o; } }
  return a;
}
function staticErr(b, known) {
  try {
    switch (b.t) {
      case 'input': { const n = splitList(b.v); if (!n.length) throw new FErr('empty'); n.forEach(x => checkLV(x, known)); break; }
      case 'output': checkExpr(b.e, known); break;
      case 'assign': checkLV(b.v, known); if (!b.inc) checkExpr(b.e, known); break;
      case 'decl': if (!KINDS.includes(b.k)) throw new FErr('kind'); parseDecl(b.v); break;
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

// K: the "pseudo" section of a language file (lang/xx.json)
function toPseudoLines(main, K) {
  const L = [{ s: K.start, id: null }];
  (function walk(seq, d) {
    const ind = '    '.repeat(d);
    const P = (s, b) => L.push({ s: ind + s, id: b ? b.id : null });
    for (const b of seq) {
      switch (b.t) {
        case 'comment': P(`// ${b.text || ''}`, b); break;
        case 'input': {
          const its = splitList(b.v).map(x => { try { return lvTyped(x); } catch (e) { return { k: null, src: x }; } });
          its.filter(x => x.k).forEach(x => P(`${K.vars} ${x.src.replace(/\[.*$/, '')} : ${x.lv && x.lv.k === 'idx' ? K.arrOf + ' ' : ''}${K.kinds[x.k]}`, b));
          P(`${K.read} ${its.map(x => x.src).join(', ')}`, b); break;
        }
        case 'output': P(`${K.write} ${b.e}${b.ln === false ? ' ' + K.noln : ''}`, b); break;
        case 'assign': {
          if (b.inc) { P(`${b.v} = ${b.v} ${b.inc === '++' ? '+' : '-'} 1`, b); break; }
          let ty; try { ty = lvTyped(b.v); } catch (e) { ty = { k: null, src: b.v }; }
          if (ty.k) P(`${K.vars} ${ty.src.replace(/\[.*$/, '')} : ${ty.lv.k === 'idx' ? K.arrOf + ' ' : ''}${K.kinds[ty.k]}`, b);
          P(`${ty.src} = ${b.e}`, b); break;
        }
        case 'decl': {
          let its; try { its = parseDecl(b.v); } catch (e) { its = []; }
          const kn = K.kinds[b.k] || b.k, plain = its.filter(x => !x.arr).map(x => x.n), arrs = its.filter(x => x.arr).map(x => x.n);
          if (plain.length) P(`${K.vars} ${plain.join(', ')} : ${kn}`, b);
          if (arrs.length) P(`${K.vars} ${arrs.join(', ')} : ${K.arrOf} ${kn}`, b);
          if (!its.length) P(`${K.vars} ${b.v || ''}`, b);
          break;
        }
        case 'if': P(`${K.if} ${b.c} ${K.then}`, b); walk(b.y, d + 1);
          if (b.n.length) { P(K.else, b); walk(b.n, d + 1); }
          P(K.endif, b); break;
        case 'while': P(`${K.while} ${b.c} ${K.do}`, b); walk(b.body, d + 1); P(K.endwhile, b); break;
        case 'do': P(K.repeat, b); walk(b.body, d + 1); P(`${K.repwhile} ${b.c}`, b); break;
        case 'for': {
          const st = String(b.s ?? '').trim();
          let fv = b.v; try { const ty = lvTyped(b.v); if (ty.k) { P(`${K.vars} ${ty.src} : ${K.kinds[ty.k]}`, b); fv = ty.src; } } catch (e) {}
          P(`${K.for} ${fv} ${K.from} ${b.a} ${K.to} ${b.b}${st && st !== '1' ? ` ${K.step} ${st}` : ''} ${K.do}`, b);
          walk(b.body, d + 1); P(K.endfor, b); break;
        }
      }
    }
  })(main, 1);
  L.push({ s: K.end, id: null });
  return L;
}
function toPseudo(main, K) { return toPseudoLines(main, K).map(l => l.s).join('\n'); }

/* ---------- Python ---------- */
const PYOP = { or: ['or', 1], and: ['and', 2], '=': ['==', 4], '!=': ['!=', 4], '<': ['<', 4], '<=': ['<=', 4], '>': ['>', 4], '>=': ['>=', 4],
  '+': ['+', 5], '-': ['-', 5], '*': ['*', 6], '/': ['/', 6], mod: ['%', 6], div: ['//', 6], '^': ['**', 8] };
const PYFN = { sqrt: ['math.sqrt', 'math'], abs: ['abs'], int: ['int'], round: ['round'], floor: ['math.floor', 'math'], ceil: ['math.ceil', 'math'],
  pow: ['pow'], min: ['min'], max: ['max'], sin: ['math.sin', 'math'], cos: ['math.cos', 'math'], tan: ['math.tan', 'math'],
  random: ['random.random', 'random'], randint: ['random.randint', 'random'], len: ['len'], str: ['str'], num: ['float'] };
const PYKW = new Set(['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'async', 'await', 'print', 'input', 'math', 'random', 'None', 'True', 'False', 'len', 'str', 'int', 'float', 'range', 'list', 'dict',
  'abs', 'round', 'min', 'max', 'pow', 'sum', 'type']);
function pyName(n) { return PYKW.has(n) ? n + '_' : n; }
// true when an expression is surely an int (int literal, variable declared int, (int) cast, int-valued function)
function pyInt(n, ints) {
  ints = ints || new Set();
  switch (n.k) {
    case 'num': return typeof n.v === 'bigint';
    case 'var': return ints.has(n.n);
    case 'idx': { let r = n; while (r.k === 'idx') r = r.o; return r.k === 'var' && ints.has(r.n); }
    case 'cast': return n.to === 'int';
    case 'call': return ['int', 'round', 'floor', 'ceil', 'len', 'randint'].includes(n.n) || (['abs', 'min', 'max'].includes(n.n) && n.args.every(a => pyInt(a, ints)));
    case 'un': return n.op === '-' && pyInt(n.a, ints);
    case 'bin': return ['+', '-', '*', '/', 'mod', 'div', '^'].includes(n.op) && pyInt(n.a, ints) && pyInt(n.b, ints);
  }
  return false;
}
function pyE(n, U) {
  switch (n.k) {
    case 'num': return { s: n.t || String(n.v), p: 9 };
    case 'str': return { s: JSON.stringify(n.v), p: 9 };
    case 'bool': return { s: n.v ? 'True' : 'False', p: 9 };
    case 'cast': { const a = pyE(n.a, U); return { s: `${n.to}(${a.s})`, p: 9 }; }
    case 'var': return { s: pyName(n.n), p: 9 };
    case 'idx': { const o = pyE(n.o, U); return { s: (o.p < 9 ? `(${o.s})` : o.s) + '[' + pyE(n.i, U).s + ']', p: 9 }; }
    case 'call': {
      if (n.n === 'round' && n.args.length === 1) { U.add('math'); const a = pyE(n.args[0], U); return { s: `math.floor(${a.s} + 0.5)`, p: 9 }; }
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
      // between two values known to be int, / is an integer division as in the diagram: int(a / b) truncates like C
      if (n.op === 'div' || (n.op === '/' && pyInt(n.a, U.ints) && pyInt(n.b, U.ints))) {
        const fa = pyE(n.a, U), fb = pyE(n.b, U);
        return { s: `int(${fa.p < 6 ? `(${fa.s})` : fa.s} / ${fb.p <= 6 ? `(${fb.s})` : fb.s})`, p: 9 };
      }
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
function pyPrint(ast, U, ln) { return `print(${pyE(ast, U).s}${ln === false ? ', end=""' : ''})`; }
// T: the "python" section of a language file (lang/xx.json), for the comments
function toPython(main, T) {
  T = T || {};
  const U = new Set(), arrays = new Set(), L = [];
  U.ints = new Set();
  const DK = Object.create(null), declK = n => DK[n] || null;
  (function scan(seq) {
    for (const b of seq) {
      if (b.t === 'decl') { try { parseDecl(b.v).forEach(x => { DK[x.n] = b.k; if (b.k === 'int') U.ints.add(x.n); }); } catch (e) {} }
      const typed = b.t === 'input' ? splitList(b.v) : (b.t === 'assign' || b.t === 'for') && !b.inc ? [b.v] : [];
      for (const x of typed) { try { const ty = lvTyped(x), n = lvRoot(ty.lv).n; if (ty.k) DK[n] = ty.k; if (ty.k === 'int') U.ints.add(n); } catch (e) {} }
      if (b.t === 'if') { scan(b.y); scan(b.n); } else if (b.body) scan(b.body);
    }
  })(main);
  let hasInput = false;
  const E = (src) => { try { return pyE(parse(src), U).s; } catch (e) { return `...  # ${src}`; } };
  const PYT = { int: 'int', float: 'float', str: 'str', bool: 'bool' };
  const nest = (lv) => lv.k === 'idx' ? `${nest(lv.o)}.setdefault(${pyE(lv.i, U).s}, {})` : pyE(lv, U).s;
  const pyLV = (lv) => lv.k === 'idx' && lv.o.k === 'idx' ? `${nest(lv.o)}[${pyE(lv.i, U).s}]` : pyE(lv, U).s;
  const kindOf = (src) => { try { const ty = lvTyped(src); return ty.k || (ty.lv.k === 'var' ? declK(ty.lv.n) : null); } catch (e) { return null; } };
  const LVT = (src) => { try { const ty = lvTyped(src); const n = pyLV(ty.lv); return ty.k && ty.lv.k === 'var' ? `${n}: ${PYT[ty.k]}` : n; } catch (e) { return LV(src); } };
  const LV = (src) => { try { return pyLV(lvTyped(src).lv); } catch (e) { return pyName(String(src || 'x').replace(/\W/g, '') || 'x'); } };
  const lit = (s) => { try { const a = parse(s); if (a.k === 'num') return Number(a.v); if (a.k === 'un' && a.op === '-' && a.a.k === 'num') return -Number(a.a.v); } catch (e) {} return null; };
  const noteArr = (src) => { try { let n = lvTyped(src).lv; if (n.k !== 'idx') return; while (n.k === 'idx') n = n.o; arrays.add(pyName(n.n)); } catch (e) {} };
  (function walk(seq, d) {
    const ind = '    '.repeat(d);
    if (!seq.filter(b => b.t !== 'comment').length) { seq.forEach(b => L.push(`${ind}# ${b.text || ''}`)); L.push(ind + 'pass'); return; }
    for (const b of seq) {
      switch (b.t) {
        case 'comment': L.push(`${ind}# ${b.text || ''}`); break;
        case 'input': hasInput = true;
          for (const nm of splitList(b.v)) {
            noteArr(nm); let lab = nm, k = null;
            try { const ty = lvTyped(nm); lab = ty.src; k = ty.k || declK(lvRoot(ty.lv).n); } catch (e) {}
            const ask = `input(${JSON.stringify(lab + '? ')})`;
            const rhs = k === 'str' || !k ? ask : k === 'float' ? `float(${ask}.replace(",", "."))` : k === 'bool' ? `${ask}.strip().lower() in ("true", "vero")` : `int(${ask})`;
            L.push(`${ind}${LVT(nm)} = ${rhs}`);
          }
          if (!splitList(b.v).length) L.push(ind + 'pass');
          break;
        case 'output': { let s; try { s = pyPrint(parse(b.e), U, b.ln); } catch (e) { s = `print()  # ${b.e}`; } L.push(ind + s); break; }
        case 'assign': {
          noteArr(b.v);
          if (b.inc) { L.push(`${ind}${LV(b.v)} ${b.inc === '++' ? '+' : '-'}= 1`); break; }
          let rhs = E(b.e);
          // a float variable turns an int into a float, as in the diagram (7 -> 7.0)
          if (kindOf(b.v) === 'float') { try { if (pyInt(parse(b.e), U.ints)) rhs = `float(${rhs})`; } catch (e) {} }
          L.push(`${ind}${LVT(b.v)} = ${rhs}`); break;
        }
        case 'decl': {
          let its; try { its = parseDecl(b.v); } catch (e) { its = []; }
          const pt = { int: 'int', float: 'float', str: 'str', bool: 'bool' }[b.k] || 'object';
          for (const it of its) { if (it.arr) { arrays.add(pyName(it.n)); L.push(`${ind}# ${pyName(it.n)}: ${T.arrayOf || 'array of'} ${pt}`); } else L.push(`${ind}${pyName(it.n)}: ${pt}`); }
          if (!its.length) L.push(ind + 'pass');
          break;
        }
        case 'if': L.push(`${ind}if ${E(b.c)}:`); walk(b.y, d + 1);
          if (b.n.length) { L.push(`${ind}else:`); walk(b.n, d + 1); } break;
        case 'while': L.push(`${ind}while ${E(b.c)}:`); walk(b.body, d + 1); break;
        case 'do': L.push(`${ind}while True:`); walk(b.body, d + 1);
          L.push(`${ind}    if not (${E(b.c)}):`, `${ind}        break`); break;
        case 'for': {
          const ss = String(b.s ?? '').trim(); const st = ss === '' ? 1 : lit(ss);
          const isI = (src) => { try { return pyInt(parse(src), U.ints); } catch (e) { return false; } };
          let lvn = null; try { lvn = lvRoot(lvTyped(b.v).lv).n; } catch (e) {}
          const touches = (seq) => seq.some(x => (['assign', 'for'].includes(x.t) && (() => { try { return lvRoot(lvTyped(x.v).lv).n === lvn; } catch (e) { return false; } })())
            || (x.t === 'input' && splitList(x.v).some(v => { try { return lvRoot(lvTyped(v).lv).n === lvn; } catch (e) { return false; } }))
            || (x.t === 'if' ? touches(x.y) || touches(x.n) : x.body ? touches(x.body) : false));
          if (st !== null && Number.isInteger(st) && st !== 0 && ss.indexOf('.') < 0 && isI(b.a) && isI(b.b) && !touches(b.body)) {
            const bl = lit(b.b);
            const end = st > 0 ? (bl !== null ? String(bl + 1) : `${E(b.b)} + 1`) : (bl !== null ? String(bl - 1) : `${E(b.b)} - 1`);
            L.push(`${ind}for ${LV(b.v)} in range(${E(b.a)}, ${end}${st === 1 ? '' : ', ' + st}):`);
            walk(b.body, d + 1);
          } else {
            const v = LV(b.v), to = E(b.b), sv = E(ss || '1');
            const cond = st === null ? `(${sv} > 0 and ${v} <= ${to}) or (${sv} < 0 and ${v} >= ${to})` : st < 0 ? `${v} >= ${to}` : `${v} <= ${to}`;
            L.push(`${ind}${LVT(b.v)} = ${E(b.a)}`, `${ind}while ${cond}:`);
            walk(b.body, d + 1);
            L.push(`${ind}    ${v} = ${v} + ${E(ss || '1')}`);
          }
          break;
        }
      }
    }
  })(main, 0);
  const H = ['# ' + (T.generated || 'FlussoLab')];
  if (U.has('math')) H.push('import math');
  if (U.has('random')) H.push('import random');
  if (arrays.size) { H.push(''); for (const a of arrays) H.push(`${a} = {}  # ${T.array || 'array'}`); }
  H.push('');
  return H.join('\n') + '\n' + L.join('\n') + '\n';
}

/* ---------- source printer & condition inversion ---------- */
const SRC = { or: ['OR', 1], and: ['AND', 2], '=': ['==', 4], '!=': ['!=', 4], '<': ['<', 4], '<=': ['<=', 4], '>': ['>', 4], '>=': ['>=', 4],
  '+': ['+', 5], '-': ['-', 5], '*': ['*', 6], '/': ['/', 6], mod: ['mod', 6], div: ['div', 6], '^': ['^', 8] };
function srcE(n) {
  switch (n.k) {
    case 'num': return { s: n.t || String(n.v), p: 9 };
    case 'str': { const q = n.v.includes('"') ? "'" : '"'; return { s: q + n.v + q, p: 9 }; }
    case 'bool': return { s: n.v ? 'true' : 'false', p: 9 };
    case 'cast': { const a = srcE(n.a); return { s: `(${n.to}) ` + (a.p < 7 ? `(${a.s})` : a.s), p: 7 }; }
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

/* ---------- share links ----------
   A diagram fits in the link itself (after #), so nothing is stored on a server.
   1. compact text: one letter per block, fields split by |, nested blocks in { }
   2. compression made for diagrams: a small model (PPM, order 2) that has already read PRIME,
      a text with typical blocks, plus arithmetic coding
   3. the bits are written with the 64 characters A-Z a-z 0-9 - _ that no app cuts or changes
   The first character is the format version. PRIME must NEVER change for version "a",
   or the links already shared would stop opening: a new PRIME means a new version letter. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SHARE_V = 'a';
const PRIME = 'Media dei voti\no"Quanti numeri? "\nIn\nAs|0\nFi|1|n|1{o"Numero "\noi\nIx\nAs|s + x}\nAfloat media|(float) s / n\no"Media: "\nOmedia\n' +
  '?media >= 6{O"Promosso"}{O"Bocciato"}\nPari o dispari\nIint n\n?n mod 2 == 0{On + " è pari"}{O"dispari"}\nConta\nAi|0\nWi < 10{Oi\n+i}\n' +
  'Fattoriale\nIn\nAf|1\nFi|1|n|{Af|f * i}\no"Fattoriale: "\nOf\nSomma\nAs|0\nDx != 0{Ix\nAs|s + x}\nO"Totale: " + str(s)\nVint|n, i\n' +
  'Vfloat|media\n#commento\nIa, b, c\n?a > b and a > c{Oa}{?b > c{Ob}{Oc}}\nInome\nO"Ciao " + nome\nAcont|cont + 1\n-n\nWtrue{Ix}\n' +
  'Fi|0|n - 1|1{Iv[i]}\nAmax|v[0]\n?v[i] > max{Amax|v[i]}{}\nOlen(s)\nOsqrt(x)\nAr|round(x)\nAd|randint(1, 6)\nAprimo|vero\nWd * d <= n AND primo{Ad|d + 1}\n' +
  'Area\nIbase, altezza\nAarea|base * altezza / 2\no"Area: "\nOarea\nAverage\nAsum|0\nAcount|0\nIgrade\nAsum|sum + grade\nO"Average: "\nOsum / count\n' +
  '?x mod 2 == 0{O"even"}{O"odd"}\nAtotal|total + x\nO"Total: " + str(total)\nIstring s\nAok|false\nVbool|ok\n?ok OR NOT trovato{O"si"}{O"no"}\n';
function packDoc(doc) {
  const q = x => String(x ?? '').replace(/[\\|{}\n]/g, c => '\\' + (c === '\n' ? 'n' : c));
  const seq = arr => (arr || []).map(b => {
    switch (b.t) {
      case 'input': return 'I' + q(b.v);
      case 'output': return (b.ln === false ? 'o' : 'O') + q(b.e);
      case 'assign': return b.inc ? (b.inc === '++' ? '+' : '-') + q(b.v) : 'A' + q(b.v) + '|' + q(b.e);
      case 'if': return '?' + q(b.c) + '{' + seq(b.y) + '}{' + seq(b.n) + '}';
      case 'while': return 'W' + q(b.c) + '{' + seq(b.body) + '}';
      case 'do': return 'D' + q(b.c) + '{' + seq(b.body) + '}';
      case 'for': return 'F' + [b.v, b.a, b.b, b.s].map(q).join('|') + '{' + seq(b.body) + '}';
      case 'comment': return '#' + q(b.text);
      case 'decl': return 'V' + q(b.k) + '|' + q(b.v);
    }
    return '';
  }).filter(Boolean).join('\n');
  return q(doc.name) + '\n' + seq(doc.main);
}
function unpackDoc(txt) {
  let i = 0;
  const field = () => { let o = ''; while (i < txt.length && !'|{}\n'.includes(txt[i])) { if (txt[i] === '\\') { i++; o += txt[i] === 'n' ? '\n' : (txt[i] ?? ''); i++; } else o += txt[i++]; } return o; };
  const bar = () => { if (txt[i] !== '|') throw new Error('share'); i++; };
  const open = () => { if (txt[i] !== '{') throw new Error('share'); i++; const s = seq(); if (txt[i] !== '}') throw new Error('share'); i++; return s; };
  function block() {
    const c = txt[i++];
    switch (c) {
      case 'I': return { t: 'input', v: field() };
      case 'O': case 'o': return { t: 'output', e: field(), ln: c === 'O' };
      case 'A': { const v = field(); bar(); return { t: 'assign', v, e: field() }; }
      case '+': case '-': return { t: 'assign', v: field(), e: '', inc: c + c };
      case '?': { const c2 = field(); return { t: 'if', c: c2, y: open(), n: open() }; }
      case 'W': case 'D': { const c2 = field(); return { t: c === 'W' ? 'while' : 'do', c: c2, body: open() }; }
      case 'F': { const v = field(); bar(); const a = field(); bar(); const b = field(); bar(); const s2 = field(); return { t: 'for', v, a, b, s: s2, body: open() }; }
      case '#': return { t: 'comment', text: field() };
      case 'V': { const k = field(); bar(); return { t: 'decl', k, v: field() }; }
    }
    throw new Error('share');
  }
  function seq() { const out = []; while (i < txt.length && txt[i] !== '}') { out.push(block()); if (txt[i] === '\n') i++; } return out; }
  const name = field(); if (txt[i] === '\n') i++;
  const main = seq(); if (i !== txt.length) throw new Error('share');
  return { name, main };
}
// PPM model: counts of the next byte after the last 2 bytes, the last byte, and none (order 2, 1, 0)
function ppmModel() {
  const m = [new Map(), new Map(), new Map()];
  const keys = (a, b) => [a * 512 + b, b, 0];
  const add = (a, b, s) => { const k = keys(a, b); for (let j = 0; j < 3; j++) { let t = m[j].get(k[j]); if (!t) m[j].set(k[j], t = new Map()); t.set(s, (t.get(s) || 0) + 1); } };
  let a = 256, b = 256; for (const s of new TextEncoder().encode(PRIME)) { add(a, b, s); a = b; b = s; }
  return { m, keys, add };
}
const AC_TOP = 2 ** 32, AC_HALF = 2 ** 31, AC_Q1 = 2 ** 30, AC_Q3 = 3 * 2 ** 30, AC_N = 257; // 256 = end of text
function shareEncode(doc) {
  const M = ppmModel(), bits = [];
  let low = 0, high = AC_TOP - 1, pend = 0;
  const out = x => { bits.push(x); for (; pend; pend--) bits.push(1 - x); };
  const code = (lo, hi, tot) => {
    const r = high - low + 1; high = low + Math.floor(r * hi / tot) - 1; low = low + Math.floor(r * lo / tot);
    for (;;) {
      if (high < AC_HALF) out(0); else if (low >= AC_HALF) { out(1); low -= AC_HALF; high -= AC_HALF; }
      else if (low >= AC_Q1 && high < AC_Q3) { pend++; low -= AC_Q1; high -= AC_Q1; } else break;
      low *= 2; high = high * 2 + 1;
    }
  };
  let a = 256, b = 256;
  for (const s of [...new TextEncoder().encode(packDoc(doc)), 256]) {
    const k = M.keys(a, b); let done = false;
    for (let j = 0; j < 3 && !done; j++) {
      const t = M.m[j].get(k[j]); if (!t) continue;
      const syms = [...t.keys()].sort((x, y) => x - y); let tot = 0, lo = -1;
      for (const x of syms) { if (x === s) lo = tot; tot += t.get(x); }
      if (lo >= 0) { code(lo, lo + t.get(s), tot + syms.length); done = true; } else code(tot, tot + syms.length, tot + syms.length);
    }
    if (!done) code(s, s + 1, AC_N);
    if (s < 256) M.add(a, b, s); a = b; b = s;
  }
  pend++; out(low < AC_Q1 ? 0 : 1);
  let str = '';
  for (let i = 0; i < bits.length; i += 6) { let v = 0; for (let j = 0; j < 6; j++) v = v * 2 + (bits[i + j] || 0); str += B64[v]; }
  return SHARE_V + str.replace(/A+$/, '');
}
function shareDecode(code) {
  code = String(code || '').trim().replace(/^#/, '');
  if (code[0] !== SHARE_V || !/^[A-Za-z0-9_-]+$/.test(code)) throw new FErr('badlink');
  const body = code.slice(1);
  const bit = i => { const c = i / 6 | 0; return c < body.length ? (B64.indexOf(body[c]) >> (5 - i % 6)) & 1 : 0; };
  const M = ppmModel();
  let low = 0, high = AC_TOP - 1, val = 0, pos = 0;
  for (let i = 0; i < 32; i++) val = val * 2 + bit(pos++);
  const narrow = (lo, hi, tot) => {
    const r = high - low + 1; high = low + Math.floor(r * hi / tot) - 1; low = low + Math.floor(r * lo / tot);
    for (;;) {
      if (high < AC_HALF) { /* nothing */ } else if (low >= AC_HALF) { low -= AC_HALF; high -= AC_HALF; val -= AC_HALF; }
      else if (low >= AC_Q1 && high < AC_Q3) { low -= AC_Q1; high -= AC_Q1; val -= AC_Q1; } else break;
      low *= 2; high = high * 2 + 1; val = val * 2 + bit(pos++);
    }
  };
  const target = tot => Math.floor(((val - low + 1) * tot - 1) / (high - low + 1));
  const bytes = []; let a = 256, b = 256;
  for (;;) {
    const k = M.keys(a, b); let s = -1;
    for (let j = 0; j < 3 && s < 0; j++) {
      const t = M.m[j].get(k[j]); if (!t) continue;
      const syms = [...t.keys()].sort((x, y) => x - y); let tot = 0; for (const x of syms) tot += t.get(x);
      const v = target(tot + syms.length);
      if (v >= tot) { narrow(tot, tot + syms.length, tot + syms.length); continue; }
      let c = 0; for (const x of syms) { const f = t.get(x); if (v < c + f) { narrow(c, c + f, tot + syms.length); s = x; break; } c += f; }
    }
    if (s < 0) { s = target(AC_N); if (s < 0 || s >= AC_N) throw new FErr('badlink'); narrow(s, s + 1, AC_N); }
    if (s === 256) break;
    bytes.push(s); if (bytes.length > 200000 || pos > body.length * 6 + 64) throw new FErr('badlink');
    M.add(a, b, s); a = b; b = s;
  }
  try { return unpackDoc(new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))); } catch (e) { throw new FErr('badlink'); }
}

return { shareEncode, shareDecode, packDoc, KINDS, parseDecl, lvTyped, toPseudoLines, invertCond, knownVars, firstError, FErr, parse, parseLV, splitList, exec, fmt, typeOf, parseInput, staticErr, toPseudo, toPython, setBoolNames, FN };
})();
if (typeof module !== 'undefined') module.exports = FL;

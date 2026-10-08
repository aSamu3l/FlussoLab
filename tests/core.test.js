// Test automatici del motore di FlussoLab (js/core.js).
// Si eseguono con:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const FL = require('../js/core.js');

// Esegue un programma e restituisce le righe scritte a schermo.
function run(main, inputs = []) {
  const env = Object.create(null), out = [];
  let line = '';
  const g = FL.exec(main, env, { out: (s, ln) => { line += s; if (ln) { out.push(line); line = ''; } } });
  let v, k = 0, steps = 0;
  for (;;) {
    const r = g.next(v); v = undefined;
    if (r.done) break;
    if (r.value.t === 'input') v = String(inputs[k++]);
    if (++steps > 1e6) throw new Error('troppi passi');
  }
  if (line) out.push(line);
  return { out, env };
}
const ev = (expr, vars = {}) => {
  const main = Object.entries(vars).map(([v, e]) => ({ t: 'assign', v, e: String(e) }));
  main.push({ t: 'assign', v: '__r', e: expr });
  return run(main).env.__r;
};
const errKey = fn => { try { fn(); } catch (e) { return e.key; } return null; };

test('aritmetica e precedenze', () => {
  assert.equal(ev('2 + 3 * 4'), 14);
  assert.equal(ev('(2 + 3) * 4'), 20);
  assert.equal(ev('2 ^ 3 ^ 2'), 512);
  assert.equal(ev('-2 ^ 2'), -4);
  assert.equal(ev('7 mod 3'), 1);
  assert.equal(ev('7 div 2'), 3);
  assert.equal(ev('7 / 2'), 3.5);
});

test('confronti e logica', () => {
  assert.equal(ev('3 = 3'), true);
  assert.equal(ev('3 == 4'), false);
  assert.equal(ev('3 != 4'), true);
  assert.equal(ev('x > 5 AND x < 10', { x: 7 }), true);
  assert.equal(ev('NOT vero OR falso'), false);
  assert.equal(ev('true'), true);
});

test('testi', () => {
  assert.equal(ev('"Ciao " + "mondo"'), 'Ciao mondo');
  assert.equal(ev('"x = " + 5'), 'x = 5');
  assert.equal(ev('len("ciao")'), 4);
});

test('funzioni', () => {
  assert.equal(ev('sqrt(16)'), 4);
  assert.equal(ev('max(3, 9)'), 9);
  assert.equal(ev('round(2.6)'), 3);
  assert.equal(ev('int(-2.7)'), -2);
});

test('errori del motore', () => {
  assert.equal(errKey(() => ev('1 / 0')), 'div0');
  assert.equal(errKey(() => ev('y + 1')), 'undef');
  assert.equal(errKey(() => ev('"a" > 5')), 'cmpmix');
  assert.equal(errKey(() => FL.parse('3 +')), 'end');
  assert.equal(errKey(() => FL.parse('"ciao')), 'str');
  assert.equal(errKey(() => ev('sqrt(-1)')), 'sqrt');
});

test('OUT resta sulla riga, OUTLN va a capo', () => {
  const { out } = run([
    { t: 'output', e: '"a"', ln: false }, { t: 'output', e: '"b"', ln: true }, { t: 'output', e: '"c"' },
  ]);
  assert.deepEqual(out, ['ab', 'c']);
});

test('input: numeri, decimali con virgola, testi e logici', () => {
  const { env } = run([{ t: 'input', v: 'a, b, c, d' }], ['12', '3,5', 'ciao', 'vero']);
  assert.equal(env.a, 12); assert.equal(env.b, 3.5); assert.equal(env.c, 'ciao'); assert.equal(env.d, true);
});

test('cicli FOR, WHILE, DO WHILE', () => {
  assert.deepEqual(run([{ t: 'for', v: 'i', a: '1', b: '3', s: '', body: [{ t: 'output', e: 'i' }] }]).out, ['1', '2', '3']);
  assert.deepEqual(run([{ t: 'for', v: 'i', a: '3', b: '1', s: '-1', body: [{ t: 'output', e: 'i' }] }]).out, ['3', '2', '1']);
  assert.deepEqual(run([{ t: 'assign', v: 'i', e: '0' },
    { t: 'while', c: 'i < 3', body: [{ t: 'assign', v: 'i', e: 'i + 1' }] }, { t: 'output', e: 'i' }]).out, ['3']);
  assert.deepEqual(run([{ t: 'assign', v: 'i', e: '10' },
    { t: 'do', c: 'i < 3', body: [{ t: 'output', e: 'i' }] }]).out, ['10']);
});

test('vettori', () => {
  const { out } = run([
    { t: 'for', v: 'i', a: '0', b: '3', s: '1', body: [{ t: 'assign', v: 'v[i]', e: 'i * i' }] },
    { t: 'output', e: 'v[3]' }, { t: 'output', e: 'len(v)' },
  ]);
  assert.deepEqual(out, ['9', '4']);
});

test('programma completo: numero primo', () => {
  const primo = [
    { t: 'input', v: 'n' }, { t: 'assign', v: 'd', e: '2' }, { t: 'assign', v: 'p', e: 'vero' },
    { t: 'while', c: 'd * d <= n AND p', body: [
      { t: 'if', c: 'n mod d = 0', y: [{ t: 'assign', v: 'p', e: 'falso' }], n: [] }, { t: 'assign', v: 'd', e: 'd + 1' }] },
    { t: 'if', c: 'p AND n > 1', y: [{ t: 'output', e: '"primo"' }], n: [{ t: 'output', e: '"non primo"' }] },
  ];
  assert.deepEqual(run(primo, ['97']).out, ['primo']);
  assert.deepEqual(run(primo, ['91']).out, ['non primo']);
  assert.deepEqual(run(primo, ['1']).out, ['non primo']);
});

test('controllo prima dell\'esecuzione', () => {
  const e = FL.firstError([{ t: 'input', v: 'voto' }, { t: 'output', e: 'Sufficiente' }]);
  assert.equal(e.e.key, 'nodef');
  assert.equal(FL.firstError([{ t: 'input', v: 'x' }, { t: 'while', c: 'x + 1', body: [] }]).e.key, 'notcond');
  assert.equal(FL.firstError([{ t: 'input', v: 'x' }, { t: 'output', e: 'x' }]), null);
  assert.equal(FL.firstError([{ t: 'comment', text: 'qualsiasi cosa' }]), null);
});

test('inverti condizione', () => {
  assert.equal(FL.invertCond('x > 0'), 'x <= 0');
  assert.equal(FL.invertCond('a AND b'), 'NOT a OR NOT b');
  assert.equal(FL.invertCond('NOT (a = b)'), 'a == b');
});

test('pseudocodice', () => {
  const p = FL.toPseudo([{ t: 'input', v: 'n' }, { t: 'if', c: 'n > 0', y: [{ t: 'output', e: '"positivo"' }], n: [] }], 'it');
  assert.equal(p, 'INIZIO\n    LEGGI n\n    SE n > 0 ALLORA\n        SCRIVI "positivo"\n    FINE SE\nFINE');
});

test('tipi dichiarati', () => {
  const D = (k, v) => ({ t: 'decl', k, v });
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'assign', v: 'n', e: '7 / 2' }])), 'tdecl');
  assert.equal(run([D('real', 'x'), { t: 'assign', v: 'x', e: '3' }, { t: 'output', e: 'x' }]).out[0], '3');
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'input', v: 'n' }], ['3,5'])), 'tin');
  assert.equal(run([D('str', 's'), { t: 'input', v: 's' }, { t: 'output', e: 's + 1' }], ['12']).out[0], '121');
  assert.equal(run([D('bool', 'b'), { t: 'input', v: 'b' }], ['vero']).env.b, true);
  assert.equal(errKey(() => run([D('int', 'v[]'), { t: 'assign', v: 'v[0]', e: '"a"' }])), 'tdecl');
  assert.equal(errKey(() => run([D('int', 'n'), D('real', 'n')])), 'redecl');
  assert.equal(errKey(() => run([D('int', 'i'), { t: 'for', v: 'i', a: '0', b: '1', s: '0.5', body: [] }])), 'tdecl');
  assert.equal(FL.staticErr(D('int', '1x')).key, 'declname');
  // senza dichiarazione resta tutto automatico
  assert.equal(run([{ t: 'assign', v: 'x', e: '7 / 2' }]).env.x, 3.5);
});

test('incremento e decremento', () => {
  assert.deepEqual(run([{ t: 'assign', v: 'i', e: '1' }, { t: 'assign', v: 'i', inc: '++' }, { t: 'assign', v: 'i', inc: '++' },
    { t: 'assign', v: 'i', inc: '--' }, { t: 'output', e: 'i' }]).out, ['2']);
  assert.equal(errKey(() => run([{ t: 'assign', v: 'z', e: '1.5' }, { t: 'assign', v: 'z', inc: '++' }])), 'incint');
  assert.equal(errKey(() => run([{ t: 'decl', k: 'real', v: 'r' }, { t: 'assign', v: 'r', e: '1' }, { t: 'assign', v: 'r', inc: '++' }])), 'incint');
  assert.equal(FL.toPseudo([{ t: 'assign', v: 'i', inc: '++' }], 'it'), 'INIZIO\n    i = i + 1\nFINE');
});

test('tipo scritto direttamente nel blocco', () => {
  assert.deepEqual(run([{ t: 'input', v: 'int n' }, { t: 'output', e: 'n' }], ['5']).out, ['5']);
  assert.equal(errKey(() => run([{ t: 'input', v: 'intero n' }], ['3,5'])), 'tin');
  assert.equal(run([{ t: 'input', v: 'stringa s' }, { t: 'output', e: 's + 1' }], ['12']).out[0], '121');
  assert.equal(run([{ t: 'assign', v: 'reale m', e: '7 / 2' }]).env.m, 3.5);
  assert.equal(errKey(() => run([{ t: 'assign', v: 'int x', e: '7 / 2' }])), 'tdecl');
  assert.deepEqual(run([{ t: 'for', v: 'int i', a: '1', b: '2', s: '', body: [{ t: 'output', e: 'i' }] }]).out, ['1', '2']);
  assert.equal(FL.firstError([{ t: 'input', v: 'int n' }, { t: 'output', e: 'n' }]), null);
});

// Test automatici del motore di FlussoLab (js/core.js).
// Si eseguono con:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const FL = require('../js/core.js');

// Esegue un programma e restituisce le righe scritte a schermo e le variabili.
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
// Valuta un'espressione e restituisce il testo che stamperebbe OUT.
const show = (expr, vars = {}) => {
  const main = Object.entries(vars).map(([v, e]) => ({ t: 'assign', v, e: String(e) }));
  main.push({ t: 'output', e: expr });
  return run(main).out[0];
};
const errKey = fn => { try { fn(); } catch (e) { return e.key; } return null; };

test('aritmetica e precedenze', () => {
  assert.equal(show('2 + 3 * 4'), '14');
  assert.equal(show('(2 + 3) * 4'), '20');
  assert.equal(show('2 ^ 3 ^ 2'), '512');
  assert.equal(show('-2 ^ 2'), '-4');
  assert.equal(show('7 mod 3'), '1');
  assert.equal(show('7 % 3'), '1');
  assert.equal(show('-7 % 3'), '-1');
});

test('divisione come in C', () => {
  assert.equal(show('7 / 2'), '3');
  assert.equal(show('-7 / 2'), '-3');
  assert.equal(show('7.0 / 2'), '3.5');
  assert.equal(show('7 / 2.0'), '3.5');
  assert.equal(show('10 / 4 * 2'), '4');
  assert.equal(errKey(() => show('7 / 0')), 'div0');
});

test('conversioni di tipo (cast)', () => {
  assert.equal(show('(float) 7 / 2'), '3.5');
  assert.equal(show('(float) (7 / 2)'), '3.0');
  assert.equal(show('(int) 3.9'), '3');
  assert.equal(show('(int) -3.9'), '-3');
  assert.equal(show('(float) s / n', { s: 7, n: 2 }), '3.5');
  assert.equal(show('float(7)'), '7.0');
  assert.equal(show('int(3.9)'), '3');
});

test('int e float si distinguono', () => {
  const { env } = run([{ t: 'assign', v: 'a', e: '3' }, { t: 'assign', v: 'b', e: '3.0' }]);
  assert.equal(FL.typeOf(env.a), 'int');
  assert.equal(FL.typeOf(env.b), 'float');
  assert.equal(show('3.0'), '3.0');
  assert.equal(show('sqrt(16)'), '4.0');
  assert.equal(show('round(2.6)'), '3');
});

test('confronti e logica', () => {
  assert.equal(show('3 == 3'), 'VERO');
  assert.equal(show('3 == 4'), 'FALSO');
  assert.equal(show('7 == 7.0'), 'VERO');
  assert.equal(show('3 != 4'), 'VERO');
  assert.equal(show('3 < 3.5'), 'VERO');
  assert.equal(show('x > 5 AND x < 10', { x: 7 }), 'VERO');
  assert.equal(show('NOT true OR false'), 'FALSO');
});

test('il singolo = non è un confronto', () => {
  assert.equal(errKey(() => FL.parse('x = 3')), 'assigneq');
  assert.equal(FL.firstError([{ t: 'input', v: 'x' }, { t: 'if', c: 'x = 3', y: [], n: [] }]).e.key, 'assigneq');
});

test('testi', () => {
  assert.equal(show('"Ciao " + "mondo"'), 'Ciao mondo');
  assert.equal(show('"x = " + 7 / 2'), 'x = 3');
  assert.equal(show('len("ciao")'), '4');
});

test('errori del motore', () => {
  assert.equal(errKey(() => show('y + 1')), 'undef');
  assert.equal(errKey(() => show('"a" > 5')), 'cmpmix');
  assert.equal(errKey(() => FL.parse('3 +')), 'end');
  assert.equal(errKey(() => FL.parse('"ciao')), 'str');
  assert.equal(errKey(() => show('sqrt(-1)')), 'sqrt');
});

test('OUT resta sulla riga, OUTLN va a capo', () => {
  const { out } = run([{ t: 'output', e: '"a"', ln: false }, { t: 'output', e: '"b"', ln: true }, { t: 'output', e: '"c"' }]);
  assert.deepEqual(out, ['ab', 'c']);
});

test('input: interi, decimali con virgola, testi e logici', () => {
  const { env } = run([{ t: 'input', v: 'a, b, c, d' }], ['12', '3,5', 'ciao', 'vero']);
  assert.equal(FL.fmt(env.a), '12'); assert.equal(FL.typeOf(env.a), 'int');
  assert.equal(env.b, 3.5); assert.equal(env.c, 'ciao'); assert.equal(env.d, true);
});

test('cicli FOR, WHILE, DO WHILE', () => {
  assert.deepEqual(run([{ t: 'for', v: 'i', a: '1', b: '3', s: '', body: [{ t: 'output', e: 'i' }] }]).out, ['1', '2', '3']);
  assert.deepEqual(run([{ t: 'for', v: 'i', a: '3', b: '1', s: '-1', body: [{ t: 'output', e: 'i' }] }]).out, ['3', '2', '1']);
  assert.deepEqual(run([{ t: 'for', v: 'x', a: '0', b: '1', s: '0.5', body: [{ t: 'output', e: 'x' }] }]).out, ['0', '0.5', '1.0']);
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
  assert.equal(errKey(() => run([{ t: 'assign', v: 'v[1.5]', e: '1' }])), 'idx');
});

test('programma completo: numero primo', () => {
  const primo = [
    { t: 'input', v: 'n' }, { t: 'assign', v: 'd', e: '2' }, { t: 'assign', v: 'p', e: 'true' },
    { t: 'while', c: 'd * d <= n AND p', body: [
      { t: 'if', c: 'n mod d == 0', y: [{ t: 'assign', v: 'p', e: 'false' }], n: [] }, { t: 'assign', v: 'd', e: 'd + 1' }] },
    { t: 'if', c: 'p AND n > 1', y: [{ t: 'output', e: '"primo"' }], n: [{ t: 'output', e: '"non primo"' }] },
  ];
  assert.deepEqual(run(primo, ['97']).out, ['primo']);
  assert.deepEqual(run(primo, ['91']).out, ['non primo']);
  assert.deepEqual(run(primo, ['1']).out, ['non primo']);
});

test('controllo prima dell\'esecuzione', () => {
  assert.equal(FL.firstError([{ t: 'input', v: 'voto' }, { t: 'output', e: 'Sufficiente' }]).e.key, 'nodef');
  assert.equal(FL.firstError([{ t: 'input', v: 'x' }, { t: 'while', c: 'x + 1', body: [] }]).e.key, 'notcond');
  assert.equal(FL.firstError([{ t: 'input', v: 'x' }, { t: 'output', e: 'x' }]), null);
  assert.equal(FL.firstError([{ t: 'comment', text: 'qualsiasi cosa' }]), null);
});

test('inverti condizione', () => {
  assert.equal(FL.invertCond('x > 0'), 'x <= 0');
  assert.equal(FL.invertCond('a AND b'), 'NOT a OR NOT b');
  assert.equal(FL.invertCond('NOT (a == b)'), 'a == b');
  assert.equal(FL.invertCond('x == 0'), 'x != 0');
});

test('pseudocodice', () => {
  const p = FL.toPseudo([{ t: 'input', v: 'n' }, { t: 'if', c: 'n > 0', y: [{ t: 'output', e: '"positivo"' }], n: [] }], 'it');
  assert.equal(p, 'INIZIO\n    LEGGI n\n    SE n > 0 ALLORA\n        SCRIVI "positivo"\n    FINE SE\nFINE');
});

test('tipi dichiarati (blocco VAR)', () => {
  const D = (k, v) => ({ t: 'decl', k, v });
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'assign', v: 'n', e: '3.5' }])), 'tdecl');
  assert.equal(run([D('int', 'n'), { t: 'assign', v: 'n', e: '7 / 2' }]).out.length, 0);
  assert.equal(run([D('float', 'x'), { t: 'assign', v: 'x', e: '3' }, { t: 'output', e: 'x' }]).out[0], '3.0');
  assert.equal(run([D('float', 'x'), { t: 'assign', v: 'x', e: '7' }, { t: 'output', e: 'x / 2' }]).out[0], '3.5');
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'input', v: 'n' }], ['3,5'])), 'tin');
  assert.equal(run([D('string', 's'), { t: 'input', v: 's' }, { t: 'output', e: 's + 1' }].map(b => b.k === 'string' ? { ...b, k: 'str' } : b), ['12']).out[0], '121');
  assert.equal(run([D('bool', 'b'), { t: 'input', v: 'b' }], ['true']).env.b, true);
  assert.equal(errKey(() => run([D('int', 'v[]'), { t: 'assign', v: 'v[0]', e: '"a"' }])), 'tdecl');
  assert.equal(errKey(() => run([D('int', 'n'), D('float', 'n')])), 'redecl');
  assert.equal(errKey(() => run([D('int', 'i'), { t: 'for', v: 'i', a: '0', b: '1', s: '0.5', body: [] }])), 'tdecl');
  assert.equal(FL.staticErr(D('int', '1x')).key, 'declname');
});

test('tipo scritto direttamente nel blocco', () => {
  assert.deepEqual(run([{ t: 'input', v: 'int n' }, { t: 'output', e: 'n' }], ['5']).out, ['5']);
  assert.equal(errKey(() => run([{ t: 'input', v: 'int n' }], ['3,5'])), 'tin');
  assert.equal(run([{ t: 'input', v: 'string s' }, { t: 'output', e: 's + 1' }], ['12']).out[0], '121');
  assert.equal(run([{ t: 'assign', v: 'float m', e: '(float) 7 / 2' }]).env.m, 3.5);
  assert.equal(run([{ t: 'assign', v: 'double m', e: '1' }]).env.m, 1);
  assert.equal(errKey(() => run([{ t: 'assign', v: 'int x', e: '7.0 / 2' }])), 'tdecl');
  assert.deepEqual(run([{ t: 'for', v: 'int i', a: '1', b: '2', s: '', body: [{ t: 'output', e: 'i' }] }]).out, ['1', '2']);
});

test('nomi dei tipi: solo in inglese e riservati', () => {
  assert.equal(FL.staticErr({ t: 'input', v: 'int int' }).key, 'reserved');
  assert.equal(FL.staticErr({ t: 'input', v: 'float' }).key, 'reserved');
  assert.equal(FL.staticErr({ t: 'assign', v: 'string', e: '1' }).key, 'reserved');
  assert.equal(FL.staticErr({ t: 'decl', k: 'int', v: 'bool' }).key, 'reserved');
  assert.notEqual(FL.staticErr({ t: 'input', v: 'intero n' }), null);
  assert.notEqual(FL.staticErr({ t: 'input', v: 'real n' }), null);
});

test('incremento e decremento', () => {
  assert.deepEqual(run([{ t: 'assign', v: 'i', e: '1' }, { t: 'assign', v: 'i', inc: '++' }, { t: 'assign', v: 'i', inc: '++' },
    { t: 'assign', v: 'i', inc: '--' }, { t: 'output', e: 'i' }]).out, ['2']);
  assert.equal(errKey(() => run([{ t: 'assign', v: 'z', e: '1.5' }, { t: 'assign', v: 'z', inc: '++' }])), 'incint');
  assert.equal(errKey(() => run([{ t: 'decl', k: 'float', v: 'r' }, { t: 'assign', v: 'r', e: '1' }, { t: 'assign', v: 'r', inc: '++' }])), 'incint');
  assert.equal(FL.toPseudo([{ t: 'assign', v: 'i', inc: '++' }], 'it'), 'INIZIO\n    i = i + 1\nFINE');
});

test('Python generato: solo funzioni standard', () => {
  const py = FL.toPython([{ t: 'input', v: 'int a, int b' }, { t: 'output', e: 'a / b' }, { t: 'output', e: 'x / y' },
    { t: 'output', e: 'a % b' }, { t: 'output', e: 'round(z)' }, { t: 'output', e: '7 / 2' }], 'it');
  assert.doesNotMatch(py, /def /);
  assert.match(py, /a: int = int\(input\("a\? "\)\)/);
  assert.match(py, /print\(int\(a \/ b\)\)/);
  assert.match(py, /print\(x \/ y\)/);
  assert.match(py, /print\(a % b\)/);
  assert.match(py, /print\(math\.floor\(z \+ 0\.5\)\)/);
  assert.match(py, /print\(int\(7 \/ 2\)\)/);
  const py2 = FL.toPython([{ t: 'input', v: 'n, float m, string s' }], 'it');
  assert.match(py2, /^n = input\("n\? "\)  # senza tipo/m);
  assert.match(py2, /m: float = float\(input\("m\? "\)\)/);
  assert.match(py2, /s: str = input\("s\? "\)$/m);
});

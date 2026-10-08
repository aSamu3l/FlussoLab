// Test automatici del motore di FlussoLab (js/core.js).
// Si eseguono con:  node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const FL = require('../js/core.js');
const IT = require('../lang/it.json');

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
  assert.equal(show('"x = " + str(7 / 2)'), 'x = 3');
  assert.equal(errKey(() => show('"x = " + 7')), 'strmix');
  assert.equal(errKey(() => show('1 + a + " e "', { a: '2' })), 'strmix');
  assert.equal(show('"1" + str(a) + " e "', { a: '2' }), '12 e ');
  assert.equal(errKey(() => show('"ok: " + vero')), 'strmix');
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
  const p = FL.toPseudo([{ t: 'input', v: 'n' }, { t: 'if', c: 'n > 0', y: [{ t: 'output', e: '"positivo"' }], n: [] }], IT.pseudo);
  assert.equal(p, 'INIZIO\n    LEGGI n\n    SE n > 0 ALLORA\n        SCRIVI "positivo"\n    FINE SE\nFINE');
});

test('tipi dichiarati (blocco VAR)', () => {
  const D = (k, v) => ({ t: 'decl', k, v });
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'assign', v: 'n', e: '3.5' }])), 'tdecl');
  assert.equal(run([D('int', 'n'), { t: 'assign', v: 'n', e: '7 / 2' }]).out.length, 0);
  assert.equal(run([D('float', 'x'), { t: 'assign', v: 'x', e: '3' }, { t: 'output', e: 'x' }]).out[0], '3.0');
  assert.equal(run([D('float', 'x'), { t: 'assign', v: 'x', e: '7' }, { t: 'output', e: 'x / 2' }]).out[0], '3.5');
  assert.equal(errKey(() => run([D('int', 'n'), { t: 'input', v: 'n' }], ['3,5'])), 'tin');
  assert.equal(run([D('string', 's'), { t: 'input', v: 's' }, { t: 'output', e: 's + "1"' }].map(b => b.k === 'string' ? { ...b, k: 'str' } : b), ['12']).out[0], '121');
  assert.equal(run([D('bool', 'b'), { t: 'input', v: 'b' }], ['true']).env.b, true);
  assert.equal(errKey(() => run([D('int', 'v[]'), { t: 'assign', v: 'v[0]', e: '"a"' }])), 'tdecl');
  assert.equal(errKey(() => run([D('int', 'n'), D('float', 'n')])), 'redecl');
  assert.equal(errKey(() => run([D('int', 'i'), { t: 'for', v: 'i', a: '0', b: '1', s: '0.5', body: [] }])), 'tdecl');
  assert.equal(FL.staticErr(D('int', '1x')).key, 'declname');
});

test('tipo scritto direttamente nel blocco', () => {
  assert.deepEqual(run([{ t: 'input', v: 'int n' }, { t: 'output', e: 'n' }], ['5']).out, ['5']);
  assert.equal(errKey(() => run([{ t: 'input', v: 'int n' }], ['3,5'])), 'tin');
  assert.equal(run([{ t: 'input', v: 'string s' }, { t: 'output', e: 's + "1"' }], ['12']).out[0], '121');
  assert.equal(errKey(() => run([{ t: 'input', v: 'string s' }, { t: 'output', e: 's + 1' }], ['12'])), 'strmix');
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
  assert.equal(FL.toPseudo([{ t: 'assign', v: 'i', inc: '++' }], IT.pseudo), 'INIZIO\n    i = i + 1\nFINE');
});

test('Python generato: solo funzioni standard', () => {
  const py = FL.toPython([{ t: 'input', v: 'int a, int b' }, { t: 'output', e: 'a / b' }, { t: 'output', e: 'x / y' },
    { t: 'output', e: 'a % b' }, { t: 'output', e: 'round(z)' }, { t: 'output', e: '7 / 2' }], IT.python);
  assert.doesNotMatch(py, /def /);
  assert.match(py, /a: int = int\(input\("a\? "\)\)/);
  assert.match(py, /print\(int\(a \/ b\)\)/);
  assert.match(py, /print\(x \/ y\)/);
  assert.match(py, /print\(a % b\)/);
  assert.match(py, /print\(math\.floor\(z \+ 0\.5\)\)/);
  assert.match(py, /print\(int\(7 \/ 2\)\)/);
  const py2 = FL.toPython([{ t: 'input', v: 'n, float m, string s' }], IT.python);
  assert.match(py2, /^n = input\("n\? "\)$/m);
  assert.match(py2, /m: float = float\(input\("m\? "\)\.replace\(",", "\."\)\)/);
  assert.match(py2, /s: str = input\("s\? "\)$/m);
});

test('numeri con la virgola sempre riconoscibili, × e ÷, numeri enormi', () => {
  assert.equal(show('0.1 * 3 * 10'), '3.0');
  assert.equal(show('99999999999.99'), '100000000000.0');
  assert.equal(show('3×4'), '12');
  assert.equal(show('12÷4'), '3');
  assert.equal(show('1^5000'), '1');
  assert.equal(errKey(() => show('2^40000')), 'big');
  assert.equal(errKey(() => run([{ t: 'assign', v: 'x', e: '3' }, { t: 'while', c: 'true', body: [{ t: 'assign', v: 'x', e: 'x * x' }] }])), 'big');
  assert.equal(show('randint(5, 1) >= 1 and randint(5, 1) <= 5'), 'VERO');
  assert.equal(FL.invertCond('s == \'di "x"\''), 's != \'di "x"\'');
});

test('Python generato: testi, cicli e vettori', () => {
  const py = FL.toPython([{ t: 'assign', v: 'n', e: '5' }, { t: 'assign', v: 's', e: '"n = " + str(n)' }, { t: 'output', e: 's + "1"' },
    { t: 'assign', v: 'k', e: '-1' }, { t: 'for', v: 'i', a: '3', b: '1', s: 'k', body: [] },
    { t: 'assign', v: 'm[0][1]', e: '5' }, { t: 'assign', v: 'float f', e: '3' }], IT.python);
  assert.match(py, /s = "n = " \+ str\(n\)/);
  assert.match(py, /print\(s \+ "1"\)/);
  assert.match(py, /while \(k > 0 and i <= 1\) or \(k < 0 and i >= 1\):/);
  assert.match(py, /m\.setdefault\(0, \{\}\)\[1\] = 5/);
  assert.match(py, /f: float = float\(3\)/);
});

// Ogni file di lingua deve avere le stesse voci di lang/it.json, così chi aggiunge una lingua sa cosa manca.
test('file di lingua completi e coerenti', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..', 'lang');
  const list = JSON.parse(fs.readFileSync(path.join(dir, 'languages.json'), 'utf8'));
  assert.ok(list.some(l => l.code === 'it') && list.some(l => l.code === 'en'));
  const keys = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? keys(v, pre + k + '.') : [pre + k]);
  const ph = v => typeof v === 'string' ? (v.match(/\{\d(:\w+)?\}/g) || []).sort().join() : '';
  const flat = (o, pre = '') => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? Object.entries(flat(v, pre + k + '.')) : [[pre + k, v]]));
  const base = flat({ ui: IT.ui, pseudo: IT.pseudo, python: IT.python });
  for (const { code, name } of list) {
    assert.match(code, /^[a-z]{2,3}(-[A-Z]{2})?$/, `codice lingua non valido: ${code}`);
    const L = JSON.parse(fs.readFileSync(path.join(dir, code + '.json'), 'utf8'));
    assert.equal(L.code, code, `${code}.json: "code" deve essere "${code}"`);
    assert.ok(name && L.name, `${code}: manca il nome della lingua`);
    const f = flat({ ui: L.ui, pseudo: L.pseudo, python: L.python });
    const missing = Object.keys(base).filter(k => !(k in f));
    assert.deepEqual(missing, [], `${code}.json: mancano queste voci`);
    for (const k of Object.keys(base)) assert.equal(ph(f[k]), ph(base[k]), `${code}.json: segnaposto diversi in ${k}`);
    assert.ok(typeof L.guide === 'string' && L.guide.length > 100, `${code}.json: manca la guida`);
    assert.ok(Array.isArray(L.examples) && L.examples.length, `${code}.json: mancano gli esempi`);
    for (const x of L.examples) {
      assert.ok(x.name && Array.isArray(x.main), `${code}.json: esempio senza nome o blocchi`);
      FL.setBoolNames(L.ui.FALSE, L.ui.TRUE);
      assert.equal(FL.firstError(x.main), null, `${code}.json: l'esempio «${x.name}» ha un errore`);
    }
  }
  FL.setBoolNames(IT.ui.FALSE, IT.ui.TRUE);
});

test('valori logici nella lingua scelta', () => {
  FL.setBoolNames('FAUX', 'VRAI');
  assert.equal(show('vrai and not faux'), 'VRAI');
  assert.equal(show('true and vero'), 'VRAI');
  FL.setBoolNames('FALSO', 'VERO');
  assert.equal(show('vrai == vrai', { vrai: '1' }), 'VERO');
});

// I link condivisibili contengono tutto il diagramma: devono tornare identici e restare corti.
test('link condivisibili: andata e ritorno senza perdite', () => {
  const EN = require('../lang/en.json');
  const norm = seq => seq.map(b => {
    const s = x => String(x ?? '');
    switch (b.t) {
      case 'input': return { t: b.t, v: s(b.v) };
      case 'output': return { t: b.t, e: s(b.e), ln: b.ln !== false };
      case 'assign': return b.inc ? { t: b.t, v: s(b.v), e: '', inc: b.inc } : { t: b.t, v: s(b.v), e: s(b.e) };
      case 'if': return { t: b.t, c: s(b.c), y: norm(b.y || []), n: norm(b.n || []) };
      case 'while': case 'do': return { t: b.t, c: s(b.c), body: norm(b.body || []) };
      case 'for': return { t: b.t, v: s(b.v), a: s(b.a), b: s(b.b), s: s(b.s), body: norm(b.body || []) };
      case 'comment': return { t: b.t, text: s(b.text) };
      case 'decl': return { t: b.t, k: s(b.k), v: s(b.v) };
    }
  });
  const docs = [...IT.examples, ...EN.examples].map(x => ({ name: x.name, main: x.main }));
  docs.push({ name: 'Strano | {x} \\ "a"\nb', main: [{ t: 'comment', text: 'a|b{c}d\\e\nf 😀 è «»' }, { t: 'decl', k: 'str', v: 's, v[]' },
    { t: 'assign', v: 'i', e: '', inc: '--' }, { t: 'for', v: 'int i', a: '10', b: '1', s: '-1', body: [] },
    { t: 'if', c: 'x == "}"', y: [], n: [{ t: 'while', c: 'a', body: [{ t: 'do', c: 'b', body: [{ t: 'output', e: '"|"', ln: false }] }] }] }] });
  docs.push({ name: '', main: [] });
  for (const d of docs) {
    const code = FL.shareEncode(d);
    assert.match(code, /^a[A-Za-z0-9_-]*$/);
    const back = FL.shareDecode(code);
    assert.equal(back.name, d.name);
    assert.deepEqual(back.main, norm(d.main));
  }
  assert.ok(FL.shareEncode({ name: IT.examples[1].name, main: IT.examples[1].main }).length < 50, 'la tabellina deve stare sotto i 50 caratteri');
  for (const bad of ['', 'b123', 'a!!', 'aZZZZZZZZZZZZZZZZZZZZ']) assert.equal(errKey(() => FL.shareDecode(bad)), 'badlink');
});

// Esercizi: il programma viene eseguito con gli input della prova e si confronta quello che scrive.
test('esercizi: prove, confronto dell\'output e link', () => {
  const max = IT.examples[4].main; // Massimo di un vettore
  const ok = FL.checkTest(max, { in: ['3', '4', '9', '2'], out: 'Massimo: 9' }, 'exact');
  assert.equal(ok.ok, true);
  assert.equal(FL.checkTest(max, { in: ['3', '4', '9', '2'], out: '9' }, 'exact').ok, false);
  assert.equal(FL.checkTest(max, { in: ['2', '1', '7'], out: 'Il massimo è\nMassimo: 7' }, 'last').ok, true);
  assert.equal(FL.checkTest(max, { in: ['3', '1'], out: '' }, 'exact').err.key, 'moreinput');
  assert.equal(FL.runTest([{ t: 'while', c: 'true', body: [] }], [], 1000).err.key, 'loop');
  assert.equal(FL.checkTest([{ t: 'output', e: 'x' }], { in: [], out: '' }, 'exact').err.key, 'nodef');
  assert.equal(FL.sameOut('a  \nb\n\n', 'a\nb', 'exact'), true);
  const ex = { text: 'Stampa il massimo\ndi n numeri', mode: 'last', tests: [{ in: ['2', '5', '1'], out: 'Massimo: 5', hidden: false }, { in: ['1', '-3'], out: 'Massimo: -3', hidden: true }] };
  const back = FL.shareDecode(FL.shareEncode({ name: 'Massimo', main: [], ex }));
  assert.deepEqual(back, { name: 'Massimo', main: [], ex });
  assert.ok(FL.shareEncode({ name: 'Massimo', main: [], ex }).length < 90);
});

// Un blocco disattivato viene saltato: serve per gli OUT di controllo prima di verificare un esercizio.
test('blocchi disattivati', () => {
  const main = [{ t: 'input', v: 'n' }, { t: 'output', e: '"debug " + str(n)', off: true }, { t: 'output', e: 'n * 2' },
    { t: 'output', e: 'nonesiste', off: true }, { t: 'if', c: 'n > 0', y: [{ t: 'output', e: '"positivo"' }], n: [], off: true }];
  assert.deepEqual(run(main, ['4']).out, ['8']);
  assert.equal(FL.firstError(main), null);
  assert.equal(FL.checkTest(main, { in: ['4'], out: '8' }, 'exact').ok, true);
  assert.doesNotMatch(FL.toPseudo(main, IT.pseudo), /debug|positivo/);
  assert.doesNotMatch(FL.toPython(main, IT.python), /debug|positivo/);
  const back = FL.shareDecode(FL.shareEncode({ name: 'x', main }));
  assert.deepEqual(back.main.map(b => !!b.off), [false, true, false, true, true]);
  // una variabile letta solo in un blocco disattivato non esiste
  assert.equal(FL.firstError([{ t: 'input', v: 'k', off: true }, { t: 'output', e: 'k' }]).e.key, 'nodef');
});

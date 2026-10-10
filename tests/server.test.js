// Automatic tests of the server: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'flsrv-'));
process.env.ALLOWED_ORIGINS = 'https://flussolab.s3l.it';
const { route } = require('../src/server.js');

let base, cookie = '';
const srv = http.createServer((q, s) => route(q, s));
test.before(() => new Promise(r => srv.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${srv.address().port}`; r(); })));
test.after(() => srv.close());

async function call(p, { method = 'GET', body, admin = false, headers = {} } = {}) {
  const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(admin ? { 'X-FL': '1', Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && /fl_s=[a-f0-9]{64}/.test(sc)) cookie = sc.split(';')[0];
  const type = r.headers.get('content-type') || '';
  return { status: r.status, headers: r.headers, body: type.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()) };
}
const variant = {
  name: 'A', text: 'Leggi persone e prezzo, stampa il guadagno',
  blocks: [{ t: 'input', v: 'persone' }, { t: 'input', v: 'prezzo' }, { t: 'output', v: 'guadagno' }],
  tests: [{ in: ['10', '7'], out: '70' }, { in: ['4', '2.5'], out: '10', hidden: true }],
};
const solution = [
  { t: 'input', v: 'persone', lock: true, lk: 1 }, { t: 'input', v: 'prezzo', lock: true, lk: 2 },
  { t: 'assign', v: 'guadagno', e: 'persone * prezzo' }, { t: 'output', e: '"Guadagno: "', ln: false }, { t: 'output', e: 'guadagno', ln: true, lock: true, lk: 3 }];
let vid, codes;

test('account del docente: primo avvio, accesso, protezioni', async () => {
  assert.equal((await call('/api/info')).body.protocol, 1);
  const me = await call('/api/admin/me');
  assert.equal(me.status, 401); assert.equal(me.body.setup, true);
  assert.equal((await call('/api/admin/setup', { method: 'POST', body: { email: 'prof@scuola.it', password: 'corta' }, admin: true })).status, 400);
  assert.equal((await call('/api/admin/setup', { method: 'POST', body: { email: 'prof@scuola.it', password: 'password123' } })).status, 403, 'senza X-FL è rifiutato');
  assert.equal((await call('/api/admin/setup', { method: 'POST', body: { email: 'prof@scuola.it', password: 'password123' }, admin: true })).status, 200);
  assert.equal((await call('/api/admin/setup', { method: 'POST', body: { email: 'x@y.it', password: 'password123' }, admin: true })).status, 403, 'un solo account');
  assert.equal((await call('/api/admin/me', { admin: true })).body.email, 'prof@scuola.it');
  const saved = cookie; cookie = '';
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { email: 'prof@scuola.it', password: 'sbagliata' }, admin: true })).status, 401);
  assert.equal((await call('/api/admin/verifiche', { admin: true })).status, 401);
  cookie = saved;
});

test('verifica: creazione, codici, lettura con il codice', async () => {
  const r = await call('/api/admin/verifiche', { method: 'POST', admin: true, body: { title: 'Cinema', variants: [variant, { ...variant, name: 'B' }], ncodes: 4 } });
  vid = r.body.id; assert.match(vid, /^[A-Z0-9]{8}$/);
  const v = await call('/api/admin/verifiche/' + vid, { admin: true });
  codes = v.body.codes; assert.equal(codes.length, 4);
  assert.deepEqual(codes.map(c => c.variant), [0, 1, 0, 1], 'le varianti si alternano');
  const head = await call('/api/v/' + vid, { headers: { Origin: 'https://flussolab.s3l.it' } });
  assert.equal(head.body.status, 'open'); assert.equal(head.body.main, undefined, 'senza codice niente esercizio');
  assert.equal(head.headers.get('access-control-allow-origin'), 'https://flussolab.s3l.it');
  const other = await call('/api/v/' + vid, { headers: { Origin: 'https://altro.it' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
  assert.equal((await call(`/api/v/${vid}?code=ZZZZZZ`)).status, 403);
  const withCode = await call(`/api/v/${vid}?code=${codes[0].code.toLowerCase()}`);
  assert.equal(withCode.body.tests.length, 1, 'solo le prove visibili'); assert.equal(withCode.body.hidden, 1);
  assert.equal(withCode.body.nlocks, 3); assert.equal(withCode.body.main.filter(b => b.lock).length, 3);
  assert.ok(!JSON.stringify(withCode.body).includes('2.5'), 'le prove nascoste non escono dal server');
});

test('consegna: correzione sul server, segnalazioni, ZIP', async () => {
  const ok = await call(`/api/v/${vid}/submit`, { method: 'POST', body: { code: codes[0].code, device: 'AAAAAA', doc: { name: 'x', main: solution, dev: [{ d: 'AAAAAA', t: '2026-10-10T10:00' }] } } });
  assert.equal(ok.status, 200); assert.equal(ok.body.n, 1);
  // a student who removes the locked OUT and prints the right number by hand
  const cheat = [solution[0], solution[1], { t: 'output', e: '70' }];
  await call(`/api/v/${vid}/submit`, { method: 'POST', body: { code: codes[2].code, device: 'AAAAAA', doc: { main: cheat, dev: [{ d: 'BBBBBB', t: '' }], altered: true } } });
  assert.equal((await call(`/api/v/${vid}/submit`, { method: 'POST', body: { code: 'NOPE00', doc: { main: solution } } })).status, 403);
  const subs = (await call(`/api/admin/verifiche/${vid}/submissions`, { admin: true })).body;
  const a = subs.find(s => s.code === codes[0].code), c = subs.find(s => s.code === codes[2].code);
  assert.equal(a.passed, 2); assert.equal(a.total, 2);
  assert.equal(c.passed, 0);
  assert.ok(c.flags.includes('struttura') && c.flags.includes('alterato') && c.flags.includes('altriDispositivi'));
  assert.ok(a.flags.includes('stessoDispositivo') && c.flags.includes('stessoDispositivo'));
  const zip = await call(`/api/admin/verifiche/${vid}/zip`, { admin: true });
  assert.equal(zip.status, 200); assert.equal(zip.body.readUInt32LE(0), 0x04034b50);
  assert.ok(zip.body.includes(Buffer.from('risultati.csv')));
});

test('orari: prima dell\'apertura e dopo la chiusura non si consegna', async () => {
  const future = new Date(Date.now() + 3600e3).toISOString();
  const r = await call('/api/admin/verifiche', { method: 'POST', admin: true, body: { title: 'Domani', opens: future, variants: [variant], ncodes: 1 } });
  const v = (await call('/api/admin/verifiche/' + r.body.id, { admin: true })).body;
  assert.equal((await call(`/api/v/${r.body.id}?code=${v.codes[0].code}`)).body.status, 'soon');
  assert.equal((await call(`/api/v/${r.body.id}/submit`, { method: 'POST', body: { code: v.codes[0].code, doc: { main: solution } } })).status, 403);
  await call(`/api/admin/verifiche/${vid}/close`, { method: 'POST', admin: true });
  const closed = await call(`/api/v/${vid}/submit`, { method: 'POST', body: { code: codes[0].code, doc: { main: solution } } });
  assert.equal(closed.status, 403); assert.equal(closed.body.error, 'closed');
});

// A data folder made by server 0.1 (schema 1, verifiche with "variants") keeps working after the update.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flsrv-old-'));
const old = new DatabaseSync(path.join(dir, 'flussolab.db'));
old.exec(`CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT); INSERT INTO meta VALUES ('schema', '1');
  CREATE TABLE admin (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, created TEXT NOT NULL);
  CREATE TABLE sessions (token TEXT PRIMARY KEY, admin_id INTEGER NOT NULL, expires INTEGER NOT NULL);
  CREATE TABLE verifiche (id TEXT PRIMARY KEY, data TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL);
  CREATE TABLE codes (vid TEXT NOT NULL REFERENCES verifiche(id) ON DELETE CASCADE, code TEXT NOT NULL, variant INTEGER NOT NULL, PRIMARY KEY (vid, code));
  CREATE TABLE submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, vid TEXT NOT NULL REFERENCES verifiche(id) ON DELETE CASCADE,
    code TEXT NOT NULL, variant INTEGER NOT NULL, at TEXT NOT NULL, ip TEXT, device TEXT, doc TEXT NOT NULL, results TEXT NOT NULL, flags TEXT NOT NULL);`);
const vr = n => ({ name: n, text: 'Doppio', blocks: [{ t: 'input', v: 'n' }, { t: 'output', v: 'd' }], tests: [{ in: ['3'], out: '6', hidden: false }] });
old.prepare('INSERT INTO verifiche VALUES (?, ?, ?, ?)').run('OLDVER01', JSON.stringify({ title: 'Vecchia', opens: '', closes: '', variants: [vr('A'), vr('B')] }), '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z');
old.prepare('INSERT INTO codes VALUES (?, ?, ?)').run('OLDVER01', 'AAA222', 0);
old.prepare('INSERT INTO codes VALUES (?, ?, ?)').run('OLDVER01', 'BBB333', 1);
old.prepare('INSERT INTO submissions (vid, code, variant, at, ip, device, doc, results, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  .run('OLDVER01', 'BBB333', 1, '2026-10-01T11:00:00.000Z', '1.2.3.4', 'DEV111', JSON.stringify({ name: 'x', main: [], dev: [] }), JSON.stringify({ structure: true, results: [{ ok: true, hidden: false }], passed: 1, total: 1 }), '[]');
old.close();
process.env.DATA_DIR = dir;
const { route, setAdmin } = require('../src/server.js');

test('i dati della versione 0.1 restano leggibili', async () => {
  setAdmin('prof@scuola.it', 'password123');
  const srv = http.createServer((q, s) => route(q, s)); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-FL': '1' }, body: JSON.stringify({ email: 'prof@scuola.it', password: 'password123' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0], H = { Cookie: cookie, 'X-FL': '1' };
  const v = await (await fetch(base + '/api/admin/verifiche/OLDVER01', { headers: H })).json();
  assert.equal(v.exercises.length, 1); assert.equal(v.exercises[0].variants.length, 2);
  assert.deepEqual(v.codes.map(c => c.vars), [[0], [1]], 'ogni codice tiene la sua variante');
  const open = await (await fetch(base + '/api/v/OLDVER01?code=BBB333')).json();
  assert.equal(open.exercises[0].text, 'Doppio'); assert.equal(open.exercises[0].variant, undefined);
  const subs = await (await fetch(base + '/api/admin/verifiche/OLDVER01/submissions', { headers: H })).json();
  assert.equal(subs.length, 1); assert.equal(subs[0].ex[0].done, true); assert.equal(subs[0].passed, 1);
  srv.close();
});

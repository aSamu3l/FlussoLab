'use strict';
// FlussoLab server: keeps the verifiche of one teacher and receives the students' submissions.
// The students keep using the public app (flussolab.s3l.it): it talks to this server only to read a
// verifica (with the student's code) and to hand it in. Everything else needs the teacher's login.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { open } = require('./db.js');
const { cleanMain, startMain, grade } = require('./check.js');
const { makeZip } = require('./zip.js');

const VERSION = '0.3.0';
const PROTOCOL = 2; // bump when the app and the server stop understanding each other
const CFG = {
  port: Number(process.env.PORT || 8080),
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  appUrl: (process.env.APP_URL || 'https://flussolab.s3l.it/').replace(/\/?$/, '/'),
  origins: (process.env.ALLOWED_ORIGINS || 'https://flussolab.s3l.it').split(',').map(s => s.trim()).filter(Boolean),
  trustProxy: /^(1|true|yes)$/i.test(process.env.TRUST_PROXY || ''),
};
const db = open(CFG.dataDir);
const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const CORE_FILE = path.join(__dirname, '..', 'core', 'core.js');

/* ---------- helpers ---------- */
const now = () => new Date().toISOString();
const A32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I: codes are read from paper
const rnd = n => Array.from(crypto.randomBytes(n), x => A32[x % 32]).join('');
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const fmtCode = c => c.slice(0, 3) + '-' + c.slice(3);

function send(res, code, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body), data = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': isBuf ? 'application/octet-stream' : typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers });
  res.end(data);
}
function readJson(req, limit = 300000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(new Error('json')); } });
    req.on('error', reject);
  });
}
function clientIp(req) {
  let ip = CFG.trustProxy && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}
// simple limits against floods (per key, in memory)
const hits = new Map();
function limited(key, max, ms) {
  const t = Date.now(), h = hits.get(key);
  if (!h || h.reset < t) { hits.set(key, { n: 1, reset: t + ms }); return false; }
  return ++h.n > max;
}
setInterval(() => { const t = Date.now(); for (const [k, h] of hits) if (h.reset < t) hits.delete(k); }, 60000).unref();

/* ---------- teacher account ---------- */
function hashPw(pw, salt) { return crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function setAdmin(email, pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('DELETE FROM admin').run(); db.prepare('DELETE FROM sessions').run();
  db.prepare('INSERT INTO admin (id, email, hash, salt, created) VALUES (1, ?, ?, ?, ?)').run(String(email).trim().toLowerCase(), hashPw(pw, salt), salt, now());
}
const hasAdmin = () => !!db.prepare('SELECT id FROM admin').get();
// Without an account anyone who reaches /admin could create it. The first start prints a code in the
// container's log: creating the account needs it. ADMIN_EMAIL/ADMIN_PASSWORD skip this step.
const SETUP_CODE = rnd(6);
if (!hasAdmin() && !(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)) {
  console.log(`\nFlussoLab: nessun account del docente. Apri /admin e usa questo codice di configurazione: ${SETUP_CODE}\n` +
    `FlussoLab: no teacher account yet. Open /admin and use this setup code: ${SETUP_CODE}\n`);
}
function checkPw(email, pw) {
  const a = db.prepare('SELECT * FROM admin WHERE email = ?').get(String(email || '').trim().toLowerCase());
  const h = Buffer.from(hashPw(pw || '', a ? a.salt : 'x'.repeat(32)), 'hex');
  return a && crypto.timingSafeEqual(h, Buffer.from(a.hash, 'hex')) ? a : null;
}
function session(req) {
  const m = /(?:^|;\s*)fl_s=([a-f0-9]{64})/.exec(req.headers.cookie || ''); if (!m) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(m[1]);
  if (!s || s.expires < Date.now()) return null;
  return s;
}
const secure = req => !!req.socket.encrypted || (CFG.trustProxy && req.headers['x-forwarded-proto'] === 'https');
const cookie = (req, token, maxAge) => `fl_s=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;

/* ---------- verifiche ----------
   A verifica has one or more exercises, each with one or more variants (task, locked blocks, tests).
   Every student code gets one variant for each exercise. Verifiche saved by server 0.1 had only
   "variants": they are read as one exercise. */
function cleanVariant(v, i) {
  const str = (x, n) => String(x ?? '').slice(0, n);
  return {
    name: str(v && v.name, 60) || String.fromCharCode(65 + i),
    text: str(v && v.text, 5000),
    blocks: (v && Array.isArray(v.blocks) ? v.blocks : []).slice(0, 30)
      .filter(b => b && (b.t === 'input' || b.t === 'output') && /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(b.v || '').trim()))
      .map(b => ({ t: b.t, v: String(b.v).trim() })),
    tests: (v && Array.isArray(v.tests) ? v.tests : []).slice(0, 50).map(t => ({
      in: (Array.isArray(t.in) ? t.in : String(t.in ?? '').split('\n')).map(x => String(x).trim()).filter(Boolean).slice(0, 200),
      out: str(t.out, 5000), hidden: !!t.hidden })),
  };
}
function cleanVer(o) {
  const str = (v, n) => String(v ?? '').slice(0, n);
  const date = v => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toISOString() : ''; };
  const raw = Array.isArray(o.exercises) ? o.exercises : [{ title: '', variants: o.variants }];
  const exercises = raw.slice(0, 10).map(e => {
    const variants = (e && Array.isArray(e.variants) ? e.variants : []).slice(0, 20).map(cleanVariant);
    if (!variants.length) variants.push(cleanVariant({}, 0));
    return { title: str(e && e.title, 120), variants };
  });
  if (!exercises.length) exercises.push({ title: '', variants: [cleanVariant({}, 0)] });
  // grace: minutes after the closing time in which students can still hand in (but no longer edit)
  const grace = o.grace === undefined || o.grace === null || o.grace === '' ? 5 : Math.min(60, Math.max(0, o.grace | 0));
  return { title: str(o.title, 120) || 'Verifica', opens: date(o.opens), closes: date(o.closes), grace, exercises };
}
const getVer = id => {
  const r = db.prepare('SELECT * FROM verifiche WHERE id = ?').get(String(id)); if (!r) return null;
  const d = JSON.parse(r.data);
  if (!Array.isArray(d.exercises)) { d.exercises = [{ title: '', variants: d.variants || [] }]; delete d.variants; }
  if (typeof d.grace !== 'number') d.grace = 5;
  return { id: r.id, ...d, created: r.created };
};
// soon → open → grace (closing time passed, hand-in still accepted) → closed
const deadline = v => v.closes ? new Date(Date.parse(v.closes) + (v.grace || 0) * 60000).toISOString() : '';
function status(v) {
  const t = Date.now();
  if (v.opens && t < Date.parse(v.opens)) return 'soon';
  if (v.closes && t > Date.parse(deadline(v))) return 'closed';
  if (v.closes && t > Date.parse(v.closes)) return 'grace';
  return 'open';
}
const canSubmit = v => ['open', 'grace'].includes(status(v));
// the variant of every exercise for the code number ord (0, 1, 2... in creation order): neighbours get different
// variants and, with several exercises, different combinations. A saved choice stays as long as that variant exists.
function varsFor(v, ord, stored) {
  let s = []; try { s = JSON.parse(stored || '[]'); } catch (e) {}
  return v.exercises.map((x, e) => Number.isInteger(s[e]) && s[e] >= 0 && s[e] < x.variants.length ? s[e] : (ord + e) % x.variants.length);
}
const codeRows = vid => db.prepare('SELECT code, variant, vars FROM codes WHERE vid = ? ORDER BY rowid').all(vid);
function codeInfo(v, code) {
  const rows = codeRows(v.id), ord = rows.findIndex(r => r.code === code);
  return ord < 0 ? null : { code, vars: varsFor(v, ord, rows[ord].vars) };
}
function addCodes(v, n) {
  const rows = codeRows(v.id), have = new Set(rows.map(r => r.code));
  let ord = rows.length;
  const ins = db.prepare('INSERT INTO codes (vid, code, variant, vars) VALUES (?, ?, ?, ?)');
  while (have.size < n && have.size < 500) {
    const c = rnd(6); if (have.has(c)) continue;
    have.add(c); const vars = varsFor(v, ord, null); ins.run(v.id, c, vars[0], JSON.stringify(vars)); ord++;
  }
}
// after an edit: every code keeps its variants, and gets one for the exercises it did not have yet
function fixCodes(v) {
  const up = db.prepare('UPDATE codes SET variant = ?, vars = ? WHERE vid = ? AND code = ?');
  codeRows(v.id).forEach((r, ord) => { const vars = varsFor(v, ord, r.vars); up.run(vars[0], JSON.stringify(vars), v.id, r.code); });
}
// now: the server's clock, so the app can show the time left even when the student's clock is wrong
const publicHead = v => ({ protocol: PROTOCOL, title: v.title, status: status(v), opens: v.opens, closes: v.closes, grace: v.grace, deadline: deadline(v), now: now(), exercises: v.exercises.length });
const testsOf = vr => vr.tests.length;

/* ---------- submissions ---------- */
// one line per code: the last submission of every exercise, with the warnings
function listSubs(v) {
  const rows = db.prepare('SELECT id, code, ex, variant, at, ip, device, results, flags FROM submissions WHERE vid = ? ORDER BY id').all(v.id);
  const byCode = new Map(), devCodes = new Map(), ipCodes = new Map();
  for (const r of rows) {
    const e = byCode.get(r.code) || { code: r.code, times: new Set(), last: null, ex: new Map() };
    e.times.add(r.at); e.last = r; e.ex.set(r.ex, r); byCode.set(r.code, e);
    if (r.device) (devCodes.get(r.device) || devCodes.set(r.device, new Set()).get(r.device)).add(r.code);
    if (r.ip) (ipCodes.get(r.ip) || ipCodes.set(r.ip, new Set()).get(r.ip)).add(r.code);
  }
  const info = new Map(codeRows(v.id).map((r, ord) => [r.code, varsFor(v, ord, r.vars)]));
  return [...byCode.values()].map(e => {
    const r = e.last, flags = new Set(), vars = info.get(e.code) || v.exercises.map(() => 0);
    const ex = v.exercises.map((x, k) => {
      const s = e.ex.get(k);
      if (!s) return { variant: vars[k], done: false, passed: 0, total: testsOf(x.variants[vars[k]] || x.variants[0]), visible: [], hidden: [] };
      const res = JSON.parse(s.results); JSON.parse(s.flags).forEach(f => flags.add(f));
      return { variant: s.variant, done: true, id: s.id, at: s.at, passed: res.passed, total: res.total,
        visible: res.results.filter(x => !x.hidden).map(x => x.ok), hidden: res.results.filter(x => x.hidden).map(x => x.ok) };
    });
    if (r.device && devCodes.get(r.device).size > 1) flags.add('stessoDispositivo');
    if (r.ip && ipCodes.get(r.ip).size > 1) flags.add('stessoIp');
    return { code: fmtCode(e.code), at: r.at, count: e.times.size, history: [...e.times].map(at => ({ at })), ip: r.ip, device: r.device, ex,
      passed: ex.reduce((a, x) => a + x.passed, 0), total: ex.reduce((a, x) => a + x.total, 0), flags: [...flags] };
  });
}

/* ---------- static admin pages ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer' });
    res.end(data);
  });
}

/* ---------- routes ---------- */
async function route(req, res) {
  const url = new URL(req.url, 'http://x'), p = url.pathname, M = req.method;
  const ip = clientIp(req);
  if (limited('all:' + ip, 600, 60000)) return send(res, 429, { error: 'slow' });

  // public part, read by the app from another site (flussolab.s3l.it)
  if (p === '/api/info' || p.startsWith('/api/v/')) {
    const origin = req.headers.origin;
    if (origin && (CFG.origins.includes('*') || CFG.origins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (M === 'OPTIONS') return send(res, 204, '');
    if (p === '/api/info') return send(res, 200, { app: 'flussolab-server', version: VERSION, protocol: PROTOCOL, appUrl: CFG.appUrl });
    const m = /^\/api\/v\/([A-Za-z0-9]{4,16})(\/submit)?$/.exec(p);
    const v = m && getVer(m[1]);
    if (!v) return send(res, 404, { error: 'notfound' });
    const head = publicHead(v);
    if (!m[2] && M === 'GET') {
      const code = normCode(url.searchParams.get('code'));
      if (!code || !canSubmit(v)) return send(res, 200, head);
      if (limited('code:' + ip, 120, 60000)) return send(res, 429, { error: 'slow' });
      const c = codeInfo(v, code);
      if (!c) return send(res, 403, { error: 'code' });
      return send(res, 200, { ...head, code: fmtCode(code), exercises: v.exercises.map((x, e) => {
        const vr = x.variants[c.vars[e]] || x.variants[0];
        // the variant's name is never sent: students must not know which variant they have
        return { title: x.title, text: vr.text,
          tests: vr.tests.filter(t => !t.hidden).map(t => ({ in: t.in, out: t.out })), hidden: vr.tests.filter(t => t.hidden).length,
          nlocks: vr.blocks.length, main: startMain(vr) };
      }) });
    }
    if (m[2] && M === 'POST') {
      if (!canSubmit(v)) return send(res, 403, { error: head.status });
      let body; try { body = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
      const code = normCode(body.code);
      const c = codeInfo(v, code);
      if (!c) return send(res, 403, { error: 'code' });
      if (limited('sub:' + v.id + code, 10, 60000)) return send(res, 429, { error: 'slow' });
      // one or more exercises in one submission; the app of protocol 1 sent a single "doc" (exercise 1)
      const items = Array.isArray(body.docs) ? body.docs : [{ ex: 0, doc: body.doc }];
      const seen = new Set(), work = [];
      for (const it of items.slice(0, v.exercises.length)) {
        const ex = it && Number.isInteger(it.ex) ? it.ex : -1;
        if (ex < 0 || ex >= v.exercises.length || seen.has(ex)) return send(res, 400, { error: 'doc' });
        seen.add(ex);
        const doc = (it && it.doc) || {};
        let main; try { main = cleanMain(doc.main); } catch (e) { return send(res, 400, { error: 'doc' }); }
        work.push({ ex, doc, main });
      }
      if (!work.length) return send(res, 400, { error: 'doc' });
      const device = /^[A-Z0-9]{4,8}$/.test(body.device || '') ? body.device : '';
      const at = now();
      const ins = db.prepare('INSERT INTO submissions (vid, code, ex, variant, at, ip, device, doc, results, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const { ex, doc, main } of work) {
        const variant = c.vars[ex], vr = v.exercises[ex].variants[variant];
        const g = grade(main, vr);
        const devs = (Array.isArray(doc.dev) ? doc.dev : []).filter(x => x && /^[A-Z0-9]{4,8}$/.test(x.d)).slice(-30).map(x => ({ d: x.d, t: String(x.t || '').slice(0, 16) }));
        const flags = [];
        if (!g.structure) flags.push('struttura');
        if (doc.altered === true) flags.push('alterato');
        if (device && devs.some(x => x.d !== device)) flags.push('altriDispositivi');
        const stored = { name: String(doc.name || '').slice(0, 120), main, dev: devs };
        ins.run(v.id, code, ex, variant, at, ip, device, JSON.stringify(stored), JSON.stringify(g), JSON.stringify(flags));
      }
      const n = db.prepare('SELECT COUNT(DISTINCT at) AS n FROM submissions WHERE vid = ? AND code = ?').get(v.id, code).n;
      return send(res, 200, { ok: true, at, n, exercises: work.map(w => w.ex), status: status(v) });
    }
    return send(res, 405, { error: 'method' });
  }

  // teacher's pages and API (same site only)
  if (p === '/' ) return send(res, 302, '', { Location: '/admin/' });
  if (p === '/admin') return send(res, 302, '', { Location: '/admin/' });
  if (p === '/admin/') return serveFile(res, path.join(ADMIN_DIR, 'index.html'));
  if (p === '/admin/core.js') return serveFile(res, CORE_FILE);
  if (/^\/admin\/[a-z]+\.(js|css|svg)$/.test(p)) return serveFile(res, path.join(ADMIN_DIR, path.basename(p)));

  if (p.startsWith('/api/admin/')) {
    const r = p.slice(11);
    if (M !== 'GET' && req.headers['x-fl'] !== '1') return send(res, 403, { error: 'csrf' });
    if (r === 'me' && M === 'GET') {
      const s = session(req);
      if (!s) return send(res, 401, { setup: !hasAdmin(), version: VERSION, appUrl: CFG.appUrl });
      const a = db.prepare('SELECT email FROM admin WHERE id = ?').get(s.admin_id);
      return send(res, 200, { email: a ? a.email : '', version: VERSION, appUrl: CFG.appUrl });
    }
    if ((r === 'setup' || r === 'login') && M === 'POST') {
      if (limited('login:' + ip, 10, 600000)) return send(res, 429, { error: 'slow' });
      let b; try { b = await readJson(req, 10000); } catch (e) { return send(res, 400, { error: 'body' }); }
      if (r === 'setup') {
        if (hasAdmin()) return send(res, 403, { error: 'exists' });
        if (normCode(b.setupCode) !== SETUP_CODE) return send(res, 403, { error: 'setupcode' });
        if (!/^[^@\s]+@[^@\s]+$/.test(b.email || '') || String(b.password || '').length < 8) return send(res, 400, { error: 'weak' });
        setAdmin(b.email, b.password);
      }
      const a = checkPw(b.email, b.password);
      if (!a) return send(res, 401, { error: 'login' });
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions (token, admin_id, expires) VALUES (?, ?, ?)').run(token, a.id, Date.now() + 12 * 3600e3);
      db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
      return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, token, 12 * 3600) });
    }
    const s = session(req);
    if (!s) return send(res, 401, { error: 'login' });
    if (r === 'logout' && M === 'POST') { db.prepare('DELETE FROM sessions WHERE token = ?').run(/fl_s=([a-f0-9]{64})/.exec(req.headers.cookie)[1]); return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, '', 0) }); }
    if (r === 'password' && M === 'POST') {
      let b; try { b = await readJson(req, 10000); } catch (e) { return send(res, 400, { error: 'body' }); }
      const a = db.prepare('SELECT email FROM admin WHERE id = ?').get(s.admin_id);
      if (!checkPw(a.email, b.old)) return send(res, 401, { error: 'login' });
      if (String(b.password || '').length < 8) return send(res, 400, { error: 'weak' });
      setAdmin(a.email, b.password); return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, '', 0) });
    }
    if (r === 'verifiche' && M === 'GET') {
      const list = db.prepare('SELECT * FROM verifiche ORDER BY created DESC').all().map(row => {
        const v = { id: row.id, ...JSON.parse(row.data) };
        const n = db.prepare('SELECT COUNT(DISTINCT code) AS n FROM submissions WHERE vid = ?').get(v.id).n;
        const k = db.prepare('SELECT COUNT(*) AS n FROM codes WHERE vid = ?').get(v.id).n;
        const ex = Array.isArray(v.exercises) ? v.exercises : [{ variants: v.variants || [] }];
        return { id: v.id, title: v.title, opens: v.opens, closes: v.closes, grace: typeof v.grace === 'number' ? v.grace : 5, status: status(v), exercises: ex.length, variants: Math.max(...ex.map(x => x.variants.length)), submitted: n, codes: k };
      });
      return send(res, 200, list);
    }
    if (r === 'verifiche' && M === 'POST') {
      let b; try { b = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
      const v = cleanVer(b), id = rnd(8), t = now();
      db.prepare('INSERT INTO verifiche (id, data, created, updated) VALUES (?, ?, ?, ?)').run(id, JSON.stringify(v), t, t);
      addCodes({ ...v, id }, Math.min(500, Math.max(1, b.ncodes | 0 || 30)));
      return send(res, 200, { id });
    }
    const vm = /^verifiche\/([A-Z0-9]{8})(\/(close|extend|submissions|zip|codes))?$/.exec(r);
    const sm = /^submissions\/(\d+)$/.exec(r);
    if (vm) {
      const v = getVer(vm[1]); if (!v) return send(res, 404, { error: 'notfound' });
      const codes = () => codeRows(v.id).map((c, ord) => ({ code: fmtCode(c.code), vars: varsFor(v, ord, c.vars) }));
      if (!vm[2] && M === 'GET') return send(res, 200, { ...v, status: status(v), deadline: deadline(v), codes: codes() });
      if (!vm[2] && M === 'PUT') {
        let b; try { b = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
        const nv = cleanVer(b);
        db.prepare('UPDATE verifiche SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(nv), now(), v.id);
        fixCodes({ ...nv, id: v.id });
        if (b.ncodes) addCodes({ ...nv, id: v.id }, Math.min(500, b.ncodes | 0));
        return send(res, 200, { ok: true });
      }
      if (!vm[2] && M === 'DELETE') { db.prepare('DELETE FROM verifiche WHERE id = ?').run(v.id); return send(res, 200, { ok: true }); }
      // close now: the closing time becomes now; with hard=true the hand-in stops at once (no extra minutes)
      if (vm[3] === 'close' && M === 'POST') {
        let b = {}; try { b = await readJson(req, 1000); } catch (e) {}
        const nv = { ...v }; delete nv.id; delete nv.created; nv.closes = now(); if (b.hard) nv.grace = 0;
        db.prepare('UPDATE verifiche SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(nv), now(), v.id);
        return send(res, 200, { ok: true, closes: nv.closes, grace: nv.grace });
      }
      // extend: more minutes from the closing time (or from now, if it has already passed)
      if (vm[3] === 'extend' && M === 'POST') {
        let b; try { b = await readJson(req, 1000); } catch (e) { return send(res, 400, { error: 'body' }); }
        const min = Math.min(24 * 60, Math.max(1, b.minutes | 0));
        const from = Math.max(Date.now(), v.closes ? Date.parse(v.closes) : 0);
        const nv = { ...v }; delete nv.id; delete nv.created; nv.closes = new Date(from + min * 60000).toISOString();
        db.prepare('UPDATE verifiche SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(nv), now(), v.id);
        return send(res, 200, { ok: true, closes: nv.closes });
      }
      if (vm[3] === 'submissions' && M === 'GET') return send(res, 200, listSubs(v));
      if (vm[3] === 'zip' && M === 'GET') {
        const nex = v.exercises.length, exName = e => v.exercises[e].title || `Esercizio ${e + 1}`;
        const head = ['codice'];
        v.exercises.forEach((x, e) => head.push(...(nex > 1 ? [`${exName(e)} variante`, `${exName(e)} prove`] : ['variante', 'prove superate', 'prove totali'])));
        if (nex > 1) head.push('totale');
        head.push('ultima consegna', 'consegne', 'dispositivo', 'ip', 'segnalazioni');
        const files = [], rows = [head];
        for (const sb of listSubs(v)) {
          const row = [sb.code];
          sb.ex.forEach((x, e) => {
            const vname = v.exercises[e].variants[x.variant] ? v.exercises[e].variants[x.variant].name : '';
            if (nex > 1) row.push(vname, x.done ? `${x.passed}/${x.total}` : '—'); else row.push(vname, x.passed, x.total);
            if (!x.done) return;
            const doc = JSON.parse(db.prepare('SELECT doc FROM submissions WHERE id = ?').get(x.id).doc);
            const label = nex > 1 ? ` · ${exName(e)}` : '';
            files.push({ name: `${sb.code}${nex > 1 ? `_es${e + 1}` : ''}.flusso`, data: Buffer.from(JSON.stringify({ format: 'flussolab', version: 1, name: `${v.title}${label} · ${sb.code}`, main: doc.main, dev: doc.dev }, null, 2)) });
          });
          if (nex > 1) row.push(`${sb.passed}/${sb.total}`);
          row.push(sb.at, sb.count, sb.device, sb.ip, sb.flags.join(' '));
          rows.push(row);
        }
        const cell = x => { let v = String(x ?? ''); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; }; // no formulas in spreadsheets
        const csv = '\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n');
        files.push({ name: 'risultati.csv', data: Buffer.from(csv, 'utf8') });
        const safe = v.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'verifica';
        return send(res, 200, makeZip(files), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${safe}.zip"` });
      }
      if (vm[3] === 'codes' && M === 'POST') {
        let b; try { b = await readJson(req, 1000); } catch (e) { return send(res, 400, { error: 'body' }); }
        addCodes(v, Math.min(500, codeRows(v.id).length + Math.max(1, b.add | 0)));
        return send(res, 200, { codes: codes() });
      }
    }
    if (sm && M === 'GET') {
      const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(Number(sm[1]));
      if (!row) return send(res, 404, { error: 'notfound' });
      return send(res, 200, { ...row, code: fmtCode(row.code), doc: JSON.parse(row.doc), results: JSON.parse(row.results), flags: JSON.parse(row.flags) });
    }
    return send(res, 404, { error: 'notfound' });
  }
  return send(res, 404, 'Not found');
}

/* ---------- start, or command line ---------- */
if (require.main === module) {
  const [cmd, email, pw] = process.argv.slice(2);
  if (cmd === 'reset-admin') {
    if (!email || !pw || pw.length < 8) { console.error('uso: node src/server.js reset-admin <email> <password di almeno 8 caratteri>'); process.exit(1); }
    setAdmin(email, pw); console.log('Account del docente impostato:', email); process.exit(0);
  }
  if (!hasAdmin() && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) setAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  http.createServer((req, res) => route(req, res).catch(e => { console.error(e); if (!res.headersSent) send(res, 500, { error: 'server' }); }))
    .listen(CFG.port, () => console.log(`FlussoLab server ${VERSION} su http://0.0.0.0:${CFG.port} · dati in ${CFG.dataDir}${hasAdmin() ? '' : ' · apri /admin per creare l\'account del docente'}`));
}
module.exports = { route, setAdmin, db, CFG, VERSION, PROTOCOL, SETUP_CODE };

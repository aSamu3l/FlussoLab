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

const VERSION = '0.1.0';
const PROTOCOL = 1; // bump when the app and the server stop understanding each other
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
const secure = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;
const cookie = (req, token, maxAge) => `fl_s=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`;

/* ---------- verifiche ---------- */
function cleanVer(o) {
  const str = (v, n) => String(v ?? '').slice(0, n);
  const date = v => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toISOString() : ''; };
  const variants = (Array.isArray(o.variants) ? o.variants : []).slice(0, 20).map((v, i) => ({
    name: str(v.name, 60) || String.fromCharCode(65 + i),
    text: str(v.text, 5000),
    blocks: (Array.isArray(v.blocks) ? v.blocks : []).slice(0, 30)
      .filter(b => b && (b.t === 'input' || b.t === 'output') && /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(b.v || '').trim()))
      .map(b => ({ t: b.t, v: String(b.v).trim() })),
    tests: (Array.isArray(v.tests) ? v.tests : []).slice(0, 50).map(t => ({
      in: (Array.isArray(t.in) ? t.in : String(t.in ?? '').split('\n')).map(x => String(x).trim()).filter(Boolean).slice(0, 200),
      out: str(t.out, 5000), hidden: !!t.hidden })),
  }));
  if (!variants.length) variants.push({ name: 'A', text: '', blocks: [], tests: [] });
  return { title: str(o.title, 120) || 'Verifica', opens: date(o.opens), closes: date(o.closes), variants };
}
const getVer = id => { const r = db.prepare('SELECT * FROM verifiche WHERE id = ?').get(String(id)); return r ? { id: r.id, ...JSON.parse(r.data), created: r.created } : null; };
function status(v) {
  const t = Date.now();
  if (v.opens && t < Date.parse(v.opens)) return 'soon';
  if (v.closes && t > Date.parse(v.closes)) return 'closed';
  return 'open';
}
function addCodes(vid, n, nvar) {
  const have = new Set(db.prepare('SELECT code FROM codes WHERE vid = ?').all(vid).map(r => r.code));
  let k = have.size;
  const ins = db.prepare('INSERT INTO codes (vid, code, variant) VALUES (?, ?, ?)');
  while (have.size < n && have.size < 500) {
    const c = rnd(6); if (have.has(c)) continue;
    have.add(c); ins.run(vid, c, k % nvar); k++; // variants alternate: neighbours get different ones
  }
}
const publicHead = v => ({ protocol: PROTOCOL, title: v.title, status: status(v), opens: v.opens, closes: v.closes });

/* ---------- submissions ---------- */
function listSubs(vid) {
  const rows = db.prepare('SELECT id, code, variant, at, ip, device, results, flags FROM submissions WHERE vid = ? ORDER BY id').all(vid);
  const byCode = new Map(), devCodes = new Map(), ipCodes = new Map();
  for (const r of rows) {
    const e = byCode.get(r.code) || { code: r.code, count: 0, history: [] };
    e.count++; e.history.push({ id: r.id, at: r.at }); e.last = r; byCode.set(r.code, e);
    if (r.device) (devCodes.get(r.device) || devCodes.set(r.device, new Set()).get(r.device)).add(r.code);
    if (r.ip) (ipCodes.get(r.ip) || ipCodes.set(r.ip, new Set()).get(r.ip)).add(r.code);
  }
  return [...byCode.values()].map(e => {
    const r = e.last, res = JSON.parse(r.results), flags = JSON.parse(r.flags);
    if (r.device && devCodes.get(r.device).size > 1) flags.push('stessoDispositivo');
    if (r.ip && ipCodes.get(r.ip).size > 1) flags.push('stessoIp');
    return { code: fmtCode(e.code), variant: r.variant, at: r.at, id: r.id, count: e.count, history: e.history, ip: r.ip, device: r.device,
      passed: res.passed, total: res.total, visible: res.results.filter(x => !x.hidden).map(x => x.ok), hidden: res.results.filter(x => x.hidden).map(x => x.ok), flags };
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
      if (!code || head.status !== 'open') return send(res, 200, head);
      if (limited('code:' + ip, 120, 60000)) return send(res, 429, { error: 'slow' });
      const c = db.prepare('SELECT * FROM codes WHERE vid = ? AND code = ?').get(v.id, code);
      if (!c) return send(res, 403, { error: 'code' });
      const vr = v.variants[c.variant] || v.variants[0];
      return send(res, 200, { ...head, code: fmtCode(code), variant: v.variants.length > 1 ? vr.name : '', text: vr.text,
        tests: vr.tests.filter(t => !t.hidden).map(t => ({ in: t.in, out: t.out })), hidden: vr.tests.filter(t => t.hidden).length,
        nlocks: vr.blocks.length, main: startMain(vr) });
    }
    if (m[2] && M === 'POST') {
      if (head.status !== 'open') return send(res, 403, { error: head.status });
      let body; try { body = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
      const code = normCode(body.code);
      const c = db.prepare('SELECT * FROM codes WHERE vid = ? AND code = ?').get(v.id, code);
      if (!c) return send(res, 403, { error: 'code' });
      if (limited('sub:' + v.id + code, 10, 60000)) return send(res, 429, { error: 'slow' });
      const doc = body.doc || {};
      let main; try { main = cleanMain(doc.main); } catch (e) { return send(res, 400, { error: 'doc' }); }
      const vr = v.variants[c.variant] || v.variants[0];
      const g = grade(main, vr);
      const device = /^[A-Z0-9]{4,8}$/.test(body.device || '') ? body.device : '';
      const devs = (Array.isArray(doc.dev) ? doc.dev : []).filter(x => x && /^[A-Z0-9]{4,8}$/.test(x.d)).slice(-30).map(x => ({ d: x.d, t: String(x.t || '').slice(0, 16) }));
      const flags = [];
      if (!g.structure) flags.push('struttura');
      if (doc.altered === true) flags.push('alterato');
      if (device && devs.some(x => x.d !== device)) flags.push('altriDispositivi');
      const stored = { name: String(doc.name || '').slice(0, 120), main, dev: devs };
      db.prepare('INSERT INTO submissions (vid, code, variant, at, ip, device, doc, results, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(v.id, code, c.variant, now(), ip, device, JSON.stringify(stored), JSON.stringify(g), JSON.stringify(flags));
      const n = db.prepare('SELECT COUNT(*) AS n FROM submissions WHERE vid = ? AND code = ?').get(v.id, code).n;
      return send(res, 200, { ok: true, at: now(), n });
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
        return { id: v.id, title: v.title, opens: v.opens, closes: v.closes, status: status(v), variants: v.variants.length, submitted: n, codes: k };
      });
      return send(res, 200, list);
    }
    if (r === 'verifiche' && M === 'POST') {
      let b; try { b = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
      const v = cleanVer(b), id = rnd(8), t = now();
      db.prepare('INSERT INTO verifiche (id, data, created, updated) VALUES (?, ?, ?, ?)').run(id, JSON.stringify(v), t, t);
      addCodes(id, Math.min(500, Math.max(1, b.ncodes | 0 || 30)), v.variants.length);
      return send(res, 200, { id });
    }
    const vm = /^verifiche\/([A-Z0-9]{8})(\/(close|submissions|zip|codes))?$/.exec(r);
    const sm = /^submissions\/(\d+)$/.exec(r);
    if (vm) {
      const v = getVer(vm[1]); if (!v) return send(res, 404, { error: 'notfound' });
      const codes = () => db.prepare('SELECT code, variant FROM codes WHERE vid = ? ORDER BY rowid').all(v.id).map(c => ({ code: fmtCode(c.code), variant: c.variant }));
      if (!vm[2] && M === 'GET') return send(res, 200, { ...v, status: status(v), codes: codes() });
      if (!vm[2] && M === 'PUT') {
        let b; try { b = await readJson(req); } catch (e) { return send(res, 400, { error: 'body' }); }
        const nv = cleanVer(b);
        db.prepare('UPDATE verifiche SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(nv), now(), v.id);
        if (b.ncodes) addCodes(v.id, Math.min(500, b.ncodes | 0), nv.variants.length);
        return send(res, 200, { ok: true });
      }
      if (!vm[2] && M === 'DELETE') { db.prepare('DELETE FROM verifiche WHERE id = ?').run(v.id); return send(res, 200, { ok: true }); }
      if (vm[3] === 'close' && M === 'POST') {
        const nv = { ...v }; delete nv.id; delete nv.created; nv.closes = now();
        db.prepare('UPDATE verifiche SET data = ?, updated = ? WHERE id = ?').run(JSON.stringify(nv), now(), v.id);
        return send(res, 200, { ok: true });
      }
      if (vm[3] === 'submissions' && M === 'GET') return send(res, 200, listSubs(v.id));
      if (vm[3] === 'zip' && M === 'GET') {
        const subs = listSubs(v.id), files = [], rows = [['codice', 'variante', 'consegnato', 'prove superate', 'prove totali', 'consegne', 'dispositivo', 'ip', 'segnalazioni']];
        for (const sb of subs) {
          const row = db.prepare('SELECT doc FROM submissions WHERE id = ?').get(sb.id), doc = JSON.parse(row.doc);
          files.push({ name: `${sb.code}.flusso`, data: Buffer.from(JSON.stringify({ format: 'flussolab', version: 1, name: `${v.title} · ${sb.code}`, main: doc.main, dev: doc.dev }, null, 2)) });
          rows.push([sb.code, v.variants[sb.variant] ? v.variants[sb.variant].name : '', sb.at, sb.passed, sb.total, sb.count, sb.device, sb.ip, sb.flags.join(' ')]);
        }
        const csv = '﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
        files.push({ name: 'risultati.csv', data: Buffer.from(csv, 'utf8') });
        const safe = v.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'verifica';
        return send(res, 200, makeZip(files), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${safe}.zip"` });
      }
      if (vm[3] === 'codes' && M === 'POST') {
        let b; try { b = await readJson(req, 1000); } catch (e) { return send(res, 400, { error: 'body' }); }
        addCodes(v.id, Math.min(500, (db.prepare('SELECT COUNT(*) AS n FROM codes WHERE vid = ?').get(v.id).n) + Math.max(1, b.add | 0)), v.variants.length);
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
module.exports = { route, setAdmin, db, CFG, VERSION, PROTOCOL };

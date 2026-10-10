'use strict';
// Storage: one SQLite file in DATA_DIR. Only what a verifica needs: the teacher's account,
// the verifiche, the student codes and the submissions. No names of students.
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = 1;

function open(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch (e) {
    const who = typeof process.getuid === 'function' ? `${process.getuid()}:${process.getgid()}` : '?';
    console.error(`FlussoLab: la cartella dei dati ${dir} non è scrivibile dall'utente ${who}.\n` +
      `Dai la cartella a quell'utente (es. sudo chown -R ${who} <cartella>) oppure avvia il container senza "user:" e usa PUID/PGID.\n` +
      `The data folder ${dir} is not writable by user ${who}.`);
    process.exit(1);
  }
  const db = new DatabaseSync(path.join(dir, 'flussolab.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, admin_id INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS verifiche (id TEXT PRIMARY KEY, data TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS codes (vid TEXT NOT NULL REFERENCES verifiche(id) ON DELETE CASCADE, code TEXT NOT NULL, variant INTEGER NOT NULL, PRIMARY KEY (vid, code));
    CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, vid TEXT NOT NULL REFERENCES verifiche(id) ON DELETE CASCADE,
      code TEXT NOT NULL, variant INTEGER NOT NULL, at TEXT NOT NULL, ip TEXT, device TEXT, doc TEXT NOT NULL, results TEXT NOT NULL, flags TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS sub_vid ON submissions(vid, code);
  `);
  const cur = db.prepare('SELECT v FROM meta WHERE k = ?').get('schema');
  if (!cur) db.prepare('INSERT INTO meta (k, v) VALUES (?, ?)').run('schema', String(SCHEMA));
  // future schema changes go here, one step per version: if (Number(cur.v) < 2) { ... }
  return db;
}
module.exports = { open, SCHEMA };

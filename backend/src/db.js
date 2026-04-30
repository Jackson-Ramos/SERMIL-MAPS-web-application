const fs       = require('fs');
const path     = require('path');
const Database = require('better-sqlite3');

const DB_DIR  = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'sermil.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const isFreshDatabase = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

if (isFreshDatabase) {
  console.log('[db] Banco novo detectado — aplicando schema e seed...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const seed   = fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf-8');
  db.exec(schema);
  db.exec(seed);
  console.log('[db] Banco inicializado em', DB_PATH);
}

const BOOLEAN_FIELDS = new Set([
  'ativo',
  'uso_unico',
  'mapa_interno_ativo',
  'google_maps_ativo',
  'waze_ativo',
  'ramal_flutuante_ativo',
  'expiracao_automatica_ativa',
]);

function transformRow(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = BOOLEAN_FIELDS.has(k) ? v === 1 : v;
  }
  return out;
}

function transform(data) {
  if (Array.isArray(data)) return data.map(transformRow);
  if (data && typeof data === 'object') return transformRow(data);
  return data;
}

module.exports = { db, transform };

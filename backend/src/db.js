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
} else {
  migrateVisitasTable();
}

// Migração: adiciona status 'pendente' e torna horario_entrada nullable
// para suportar pré-registro pelo porteiro confirmado pelo scan do visitante.
function migrateVisitasTable() {
  const tbl = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='visitas'"
  ).get();
  if (!tbl || tbl.sql.includes("'pendente'")) return;

  console.log('[db] Migrando tabela visitas (status pendente + horario_entrada nullable)...');
  db.pragma('foreign_keys = OFF');
  const run = db.transaction(() => {
    db.exec(`
      CREATE TABLE visitas_new (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          cond_id         INTEGER NOT NULL,
          lote_id         INTEGER NOT NULL,
          cpf             TEXT    NOT NULL,
          nome_visitante  TEXT,
          quadra          TEXT    NOT NULL,
          lote            TEXT    NOT NULL,
          horario_entrada TEXT,
          horario_saida   TEXT,
          duracao_minutos INTEGER,
          app_navegacao   TEXT    NOT NULL DEFAULT 'interno' CHECK (app_navegacao IN ('interno', 'gmaps', 'waze', 'manual')),
          status          TEXT    NOT NULL DEFAULT 'ativa'   CHECK (status IN ('pendente', 'ativa', 'encerrada', 'expirada')),
          rota            TEXT,
          observacoes     TEXT,
          porteiro_id     INTEGER,
          criado_em       TEXT    NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (cond_id)     REFERENCES condominios(id),
          FOREIGN KEY (lote_id)     REFERENCES lotes(id),
          FOREIGN KEY (porteiro_id) REFERENCES usuarios(id) ON DELETE SET NULL
      );
      INSERT INTO visitas_new SELECT * FROM visitas;
      DROP TABLE visitas;
      ALTER TABLE visitas_new RENAME TO visitas;
      CREATE INDEX idx_visitas_status ON visitas (cond_id, status);
      CREATE INDEX idx_visitas_cpf    ON visitas (cpf, cond_id);
      CREATE INDEX idx_visitas_lote   ON visitas (lote_id, horario_entrada DESC);
      CREATE INDEX idx_visitas_data   ON visitas (horario_entrada DESC);
    `);
  });
  run();
  db.pragma('foreign_keys = ON');
  console.log('[db] Migração concluída.');
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

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
  migrateMoradorTables();
  seedMoradorUser();
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

// Cria o usuário de teste morador@sermilmaps.com em bancos já existentes,
// vinculando-o ao primeiro morador sem user_id. Idempotente.
function seedMoradorUser() {
  const existing = db.prepare(
    "SELECT id FROM usuarios WHERE email = 'morador@sermilmaps.com'"
  ).get();
  if (existing) return;

  const cond = db.prepare('SELECT id FROM condominios ORDER BY id LIMIT 1').get();
  if (!cond) return;

  console.log('[db] Migrando: criando usuário morador@sermilmaps.com (senha Sermil@2026)...');
  const senhaHash = '$2a$10$S8QHFCr4ipWsua3s166aMOMGX9RYFcHf1z3W0u1LxJHcTYc1Cisba';
  const info = db.prepare(`
    INSERT INTO usuarios (cond_id, nome, email, senha_hash, role, ativo)
    VALUES (?, 'Morador (teste)', 'morador@sermilmaps.com', ?, 'morador', 1)
  `).run(cond.id, senhaHash);

  // Vincula ao primeiro morador sem user_id (se houver).
  const morador = db.prepare(
    'SELECT id FROM moradores WHERE user_id IS NULL ORDER BY id LIMIT 1'
  ).get();
  if (morador) {
    db.prepare('UPDATE moradores SET user_id = ? WHERE id = ?')
      .run(info.lastInsertRowid, morador.id);
    console.log(`[db] Usuário morador vinculado ao morador id=${morador.id}.`);
  } else {
    console.log('[db] Nenhum morador sem user_id encontrado — vincule manualmente.');
  }
}

// Cria tabelas do módulo do morador (convidados, agendamentos) em bancos
// já existentes que ainda não possuem essas tabelas.
function migrateMoradorTables() {
  const exists = (name) =>
    !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);

  if (!exists('eventos')) {
    console.log('[db] Migrando: criando tabela eventos...');
    db.exec(`
      CREATE TABLE eventos (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          morador_id        INTEGER NOT NULL,
          cond_id           INTEGER NOT NULL,
          titulo            TEXT    NOT NULL,
          local_tipo        TEXT    NOT NULL CHECK (local_tipo IN ('residencia', 'area_comum')),
          local_nome        TEXT,
          data_inicio       TEXT    NOT NULL,
          data_fim          TEXT,
          observacoes       TEXT,
          status            TEXT    NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
          aprovacao_status  TEXT    NOT NULL DEFAULT 'pendente' CHECK (aprovacao_status IN ('pendente', 'aprovado', 'rejeitado')),
          motivo_rejeicao   TEXT,
          revisado_por      INTEGER,
          revisado_em       TEXT,
          morador_ciente    INTEGER NOT NULL DEFAULT 1 CHECK (morador_ciente IN (0, 1)),
          criado_em         TEXT    NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (morador_id)   REFERENCES moradores(id)   ON DELETE CASCADE,
          FOREIGN KEY (cond_id)      REFERENCES condominios(id) ON DELETE CASCADE,
          FOREIGN KEY (revisado_por) REFERENCES usuarios(id)    ON DELETE SET NULL
      );
      CREATE INDEX idx_eventos_morador ON eventos (morador_id, data_inicio DESC);
    `);
  } else {
    // Garante colunas de aprovação em DBs com a tabela eventos antiga.
    const cols = db.prepare("PRAGMA table_info(eventos)").all().map((c) => c.name);
    if (!cols.includes('aprovacao_status')) {
      console.log('[db] Migrando: adicionando colunas de aprovação em eventos...');
      db.exec(`
        ALTER TABLE eventos ADD COLUMN aprovacao_status TEXT NOT NULL DEFAULT 'pendente';
        ALTER TABLE eventos ADD COLUMN motivo_rejeicao  TEXT;
        ALTER TABLE eventos ADD COLUMN revisado_por     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
        ALTER TABLE eventos ADD COLUMN revisado_em      TEXT;
      `);
    }
    if (!cols.includes('morador_ciente')) {
      console.log('[db] Migrando: adicionando coluna morador_ciente em eventos...');
      db.exec(`ALTER TABLE eventos ADD COLUMN morador_ciente INTEGER NOT NULL DEFAULT 1;`);
    }
  }

  if (!exists('convidados')) {
    console.log('[db] Migrando: criando tabela convidados...');
    db.exec(`
      CREATE TABLE convidados (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          morador_id     INTEGER NOT NULL,
          cond_id        INTEGER NOT NULL,
          evento_id      INTEGER,
          nome           TEXT,
          cpf            TEXT,
          telefone       TEXT,
          observacoes    TEXT,
          origem         TEXT    NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'link')),
          link_token     TEXT    UNIQUE,
          link_status    TEXT    CHECK (link_status IN ('pendente', 'preenchido', 'desabilitado')),
          preenchido_em  TEXT,
          criado_em      TEXT    NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (morador_id) REFERENCES moradores(id)   ON DELETE CASCADE,
          FOREIGN KEY (cond_id)    REFERENCES condominios(id) ON DELETE CASCADE,
          FOREIGN KEY (evento_id)  REFERENCES eventos(id)     ON DELETE CASCADE
      );
      CREATE INDEX idx_convidados_morador ON convidados (morador_id, criado_em DESC);
      CREATE INDEX idx_convidados_evento  ON convidados (evento_id, criado_em DESC);
      CREATE INDEX idx_convidados_token   ON convidados (link_token);
    `);
  } else {
    // Tabela convidados já existe — garante a coluna evento_id e índice.
    const cols = db.prepare("PRAGMA table_info(convidados)").all();
    const hasEvento = cols.some((c) => c.name === 'evento_id');
    if (!hasEvento) {
      console.log('[db] Migrando: adicionando convidados.evento_id...');
      db.exec(`
        ALTER TABLE convidados ADD COLUMN evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_convidados_evento ON convidados (evento_id, criado_em DESC);
      `);
    }
  }

  if (!exists('agendamentos')) {
    console.log('[db] Migrando: criando tabela agendamentos...');
    db.exec(`
      CREATE TABLE agendamentos (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          morador_id      INTEGER NOT NULL,
          cond_id         INTEGER NOT NULL,
          lote_id         INTEGER NOT NULL,
          convidado_id    INTEGER,
          nome_visitante  TEXT    NOT NULL,
          cpf             TEXT,
          data_prevista   TEXT    NOT NULL,
          observacoes     TEXT,
          status          TEXT    NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizada', 'cancelada', 'expirada')),
          visita_id       INTEGER,
          criado_em       TEXT    NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (morador_id)   REFERENCES moradores(id)   ON DELETE CASCADE,
          FOREIGN KEY (cond_id)      REFERENCES condominios(id) ON DELETE CASCADE,
          FOREIGN KEY (lote_id)      REFERENCES lotes(id),
          FOREIGN KEY (convidado_id) REFERENCES convidados(id)  ON DELETE SET NULL,
          FOREIGN KEY (visita_id)    REFERENCES visitas(id)     ON DELETE SET NULL
      );
      CREATE INDEX idx_agendamentos_morador ON agendamentos (morador_id, data_prevista DESC);
      CREATE INDEX idx_agendamentos_data    ON agendamentos (cond_id, data_prevista DESC);
    `);
  }
}

const BOOLEAN_FIELDS = new Set([
  'ativo',
  'uso_unico',
  'mapa_interno_ativo',
  'google_maps_ativo',
  'waze_ativo',
  'ramal_flutuante_ativo',
  'expiracao_automatica_ativa',
  'morador_ciente',
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

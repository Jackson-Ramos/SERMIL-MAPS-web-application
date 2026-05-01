-- =============================================================================
-- SERMIL MAPS — Schema SQLite
-- Aplicado automaticamente por backend/src/db.js na primeira execução.
-- =============================================================================

CREATE TABLE condominios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nome            TEXT    NOT NULL,
    cidade          TEXT    NOT NULL,
    estado          TEXT    NOT NULL,
    ramal_portaria  TEXT    NOT NULL,
    criado_em       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE configuracoes (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    cond_id                     INTEGER NOT NULL UNIQUE,
    tempo_maximo_visita         INTEGER NOT NULL DEFAULT 60,
    mapa_interno_ativo          INTEGER NOT NULL DEFAULT 1 CHECK (mapa_interno_ativo IN (0, 1)),
    google_maps_ativo           INTEGER NOT NULL DEFAULT 1 CHECK (google_maps_ativo IN (0, 1)),
    waze_ativo                  INTEGER NOT NULL DEFAULT 1 CHECK (waze_ativo IN (0, 1)),
    ramal_flutuante_ativo       INTEGER NOT NULL DEFAULT 1 CHECK (ramal_flutuante_ativo IN (0, 1)),
    expiracao_automatica_ativa  INTEGER NOT NULL DEFAULT 1 CHECK (expiracao_automatica_ativa IN (0, 1)),
    FOREIGN KEY (cond_id) REFERENCES condominios(id) ON DELETE CASCADE
);

CREATE TABLE quadras (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    cond_id  INTEGER NOT NULL,
    nome     TEXT    NOT NULL,
    UNIQUE (cond_id, nome),
    FOREIGN KEY (cond_id) REFERENCES condominios(id) ON DELETE CASCADE
);

CREATE TABLE lotes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    quadra_id  INTEGER NOT NULL,
    numero     TEXT    NOT NULL,
    latitude   REAL,
    longitude  REAL,
    UNIQUE (quadra_id, numero),
    FOREIGN KEY (quadra_id) REFERENCES quadras(id) ON DELETE CASCADE
);

CREATE TABLE usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cond_id     INTEGER NOT NULL,
    nome        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    senha_hash  TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK (role IN ('admin', 'porteiro', 'morador')),
    ativo       INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (email, cond_id),
    FOREIGN KEY (cond_id) REFERENCES condominios(id) ON DELETE CASCADE
);

CREATE TABLE moradores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id       INTEGER NOT NULL,
    nome          TEXT    NOT NULL,
    cpf           TEXT    UNIQUE,
    ramal         TEXT,
    user_id       INTEGER,
    total_visitas INTEGER NOT NULL DEFAULT 0,
    criado_em     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lote_id) REFERENCES lotes(id)    ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE visitas (
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

CREATE INDEX idx_visitas_status ON visitas (cond_id, status);
CREATE INDEX idx_visitas_cpf    ON visitas (cpf, cond_id);
CREATE INDEX idx_visitas_lote   ON visitas (lote_id, horario_entrada DESC);
CREATE INDEX idx_visitas_data   ON visitas (horario_entrada DESC);

CREATE TABLE qr_codes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cond_id      INTEGER NOT NULL,
    criado_por   INTEGER,
    nome_portao  TEXT    NOT NULL,
    token        TEXT    NOT NULL UNIQUE,
    url          TEXT    NOT NULL,
    ativo        INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    uso_unico    INTEGER NOT NULL DEFAULT 0 CHECK (uso_unico IN (0, 1)),
    usos         INTEGER NOT NULL DEFAULT 0,
    expira_em    TEXT,
    criado_em    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cond_id)    REFERENCES condominios(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)    ON DELETE SET NULL
);

CREATE INDEX idx_qr_token ON qr_codes (token);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Calcula duracao_minutos ao encerrar uma visita.
CREATE TRIGGER trg_calcular_duracao
AFTER UPDATE OF horario_saida ON visitas
FOR EACH ROW
WHEN NEW.horario_saida IS NOT NULL AND OLD.horario_saida IS NULL
BEGIN
    UPDATE visitas
    SET duracao_minutos = CAST(
        (julianday(NEW.horario_saida) - julianday(NEW.horario_entrada)) * 1440 + 0.5
        AS INTEGER
    )
    WHERE id = NEW.id;
END;

-- Revoga QR Codes de uso único após o primeiro scan.
CREATE TRIGGER trg_uso_unico_qr
AFTER UPDATE OF usos ON qr_codes
FOR EACH ROW
WHEN NEW.usos >= 1 AND NEW.uso_unico = 1
BEGIN
    UPDATE qr_codes SET ativo = 0 WHERE id = NEW.id;
END;

-- Incrementa total_visitas dos moradores do lote a cada nova visita.
CREATE TRIGGER trg_atualizar_total_visitas
AFTER INSERT ON visitas
FOR EACH ROW
BEGIN
    UPDATE moradores
    SET total_visitas = total_visitas + 1
    WHERE lote_id = NEW.lote_id;
END;

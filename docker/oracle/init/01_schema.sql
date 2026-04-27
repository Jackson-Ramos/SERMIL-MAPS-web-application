-- =============================================================================
-- SERMIL MAPS — Schema Oracle XE 21c
-- Executado automaticamente pelo gvenzl/oracle-xe na primeira inicialização.
-- Contexto: conectado como APP_USER no PDB XEPDB1.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONDOMINIOS
-- Entidade raiz. Todas as outras tabelas referenciam esta.
-- -----------------------------------------------------------------------------
CREATE TABLE condominios (
    id              NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR2(150)   NOT NULL,
    cidade          VARCHAR2(100)   NOT NULL,
    estado          VARCHAR2(2)     NOT NULL,
    ramal_portaria  VARCHAR2(20)    NOT NULL,
    criado_em       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

-- -----------------------------------------------------------------------------
-- CONFIGURACOES
-- Preferências por condomínio. Relação 1:1 com CONDOMINIOS.
-- -----------------------------------------------------------------------------
CREATE TABLE configuracoes (
    id                          NUMBER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cond_id                     NUMBER      NOT NULL,
    tempo_maximo_visita         NUMBER      NOT NULL DEFAULT 60,
    mapa_interno_ativo          NUMBER(1)   NOT NULL DEFAULT 1,
    google_maps_ativo           NUMBER(1)   NOT NULL DEFAULT 1,
    waze_ativo                  NUMBER(1)   NOT NULL DEFAULT 1,
    ramal_flutuante_ativo       NUMBER(1)   NOT NULL DEFAULT 1,
    expiracao_automatica_ativa  NUMBER(1)   NOT NULL DEFAULT 1,

    CONSTRAINT fk_config_cond   FOREIGN KEY (cond_id)
        REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT uq_config_cond   UNIQUE (cond_id),
    CONSTRAINT ck_mapa_interno  CHECK (mapa_interno_ativo IN (0, 1)),
    CONSTRAINT ck_google_maps   CHECK (google_maps_ativo IN (0, 1)),
    CONSTRAINT ck_waze          CHECK (waze_ativo IN (0, 1)),
    CONSTRAINT ck_ramal_flut    CHECK (ramal_flutuante_ativo IN (0, 1)),
    CONSTRAINT ck_expiracao     CHECK (expiracao_automatica_ativa IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- QUADRAS
-- Setores geográficos do condomínio.
-- -----------------------------------------------------------------------------
CREATE TABLE quadras (
    id       NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cond_id  NUMBER          NOT NULL,
    nome     VARCHAR2(20)    NOT NULL,

    CONSTRAINT fk_quadra_cond  FOREIGN KEY (cond_id)
        REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT uq_quadra_nome  UNIQUE (cond_id, nome)
);

-- -----------------------------------------------------------------------------
-- LOTES
-- Unidades físicas dentro de uma quadra.
-- nome_morador e ramal removidos: pertencem à tabela MORADORES.
-- -----------------------------------------------------------------------------
CREATE TABLE lotes (
    id         NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quadra_id  NUMBER          NOT NULL,
    numero     VARCHAR2(20)    NOT NULL,
    latitude   NUMBER(10, 7),
    longitude  NUMBER(10, 7),

    CONSTRAINT fk_lote_quadra  FOREIGN KEY (quadra_id)
        REFERENCES quadras(id) ON DELETE CASCADE,
    CONSTRAINT uq_lote_numero  UNIQUE (quadra_id, numero)
);

-- -----------------------------------------------------------------------------
-- USUARIOS
-- Contas de acesso: admin, porteiro e morador.
-- UNIQUE composto (email, cond_id) para suporte multi-tenant.
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id          NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cond_id     NUMBER          NOT NULL,
    nome        VARCHAR2(150)   NOT NULL,
    email       VARCHAR2(255)   NOT NULL,
    senha_hash  VARCHAR2(255)   NOT NULL,
    role        VARCHAR2(20)    NOT NULL,
    ativo       NUMBER(1)       NOT NULL DEFAULT 1,
    criado_em   TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,

    CONSTRAINT fk_usuario_cond  FOREIGN KEY (cond_id)
        REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT uq_usuario_email UNIQUE (email, cond_id),
    CONSTRAINT ck_usuario_role  CHECK (role IN ('admin', 'porteiro', 'morador')),
    CONSTRAINT ck_usuario_ativo CHECK (ativo IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- MORADORES
-- Moradores vinculados a um lote. Um lote pode ter múltiplos moradores.
-- user_id é opcional: somente moradores com conta no sistema têm este vínculo.
-- -----------------------------------------------------------------------------
CREATE TABLE moradores (
    id            NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id       NUMBER          NOT NULL,
    nome          VARCHAR2(150)   NOT NULL,
    cpf           VARCHAR2(14),
    ramal         VARCHAR2(20),
    user_id       NUMBER,
    total_visitas NUMBER          NOT NULL DEFAULT 0,
    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,

    CONSTRAINT fk_morador_lote  FOREIGN KEY (lote_id)
        REFERENCES lotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_morador_user  FOREIGN KEY (user_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT uq_morador_cpf   UNIQUE (cpf)
);

-- -----------------------------------------------------------------------------
-- VISITAS
-- Registro de cada acesso ao condomínio.
-- lote_id usa RESTRICT (padrão Oracle) — lotes com visitas não podem ser deletados.
-- porteiro_id é NULL em visitas self-service via QR code.
-- -----------------------------------------------------------------------------
CREATE TABLE visitas (
    id              NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cond_id         NUMBER          NOT NULL,
    lote_id         NUMBER          NOT NULL,
    cpf             VARCHAR2(14)    NOT NULL,
    nome_visitante  VARCHAR2(150),
    quadra          VARCHAR2(20)    NOT NULL,
    lote            VARCHAR2(20)    NOT NULL,
    horario_entrada TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT SYSTIMESTAMP,
    horario_saida   TIMESTAMP WITH TIME ZONE,
    duracao_minutos NUMBER,
    app_navegacao   VARCHAR2(30)    NOT NULL DEFAULT 'interno',
    status          VARCHAR2(20)    NOT NULL DEFAULT 'ativa',
    rota            CLOB,
    observacoes     CLOB,
    porteiro_id     NUMBER,
    criado_em       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,

    CONSTRAINT fk_visita_cond       FOREIGN KEY (cond_id)
        REFERENCES condominios(id),
    CONSTRAINT fk_visita_lote       FOREIGN KEY (lote_id)
        REFERENCES lotes(id),
    CONSTRAINT fk_visita_porteiro   FOREIGN KEY (porteiro_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_visita_status     CHECK (status IN ('ativa', 'encerrada', 'expirada')),
    CONSTRAINT ck_visita_nav        CHECK (app_navegacao IN ('interno', 'gmaps', 'waze', 'manual')),
    CONSTRAINT ck_rota_json         CHECK (rota IS JSON)
);

CREATE INDEX idx_visitas_status ON visitas (cond_id, status);
CREATE INDEX idx_visitas_cpf    ON visitas (cpf, cond_id);
CREATE INDEX idx_visitas_lote   ON visitas (lote_id, horario_entrada DESC);
CREATE INDEX idx_visitas_data   ON visitas (horario_entrada DESC);

-- -----------------------------------------------------------------------------
-- QR_CODES
-- QR Codes de portão gerados pelos administradores.
-- criado_por usa SET NULL — QR Code sobrevive à exclusão do admin.
-- -----------------------------------------------------------------------------
CREATE TABLE qr_codes (
    id           NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cond_id      NUMBER          NOT NULL,
    criado_por   NUMBER,
    nome_portao  VARCHAR2(100)   NOT NULL,
    token        VARCHAR2(64)    NOT NULL,
    url          CLOB            NOT NULL,
    ativo        NUMBER(1)       NOT NULL DEFAULT 1,
    uso_unico    NUMBER(1)       NOT NULL DEFAULT 0,
    usos         NUMBER          NOT NULL DEFAULT 0,
    expira_em    TIMESTAMP WITH TIME ZONE,
    criado_em    TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,

    CONSTRAINT fk_qr_cond       FOREIGN KEY (cond_id)
        REFERENCES condominios(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_criador    FOREIGN KEY (criado_por)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT uq_qr_token      UNIQUE (token),
    CONSTRAINT ck_qr_ativo      CHECK (ativo IN (0, 1)),
    CONSTRAINT ck_qr_uso_unico  CHECK (uso_unico IN (0, 1))
);

CREATE INDEX idx_qr_token ON qr_codes (token);

-- =============================================================================
-- TRIGGERS PL/SQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Calcula duracao_minutos ao encerrar uma visita.
-- Usa CAST para DATE para compatibilidade com TIMESTAMP WITH TIME ZONE.
-- Resultado em minutos, arredondado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_calcular_duracao
    BEFORE UPDATE ON visitas
    FOR EACH ROW
BEGIN
    IF :NEW.horario_saida IS NOT NULL AND :OLD.horario_saida IS NULL THEN
        :NEW.duracao_minutos := ROUND(
            (CAST(:NEW.horario_saida AS DATE) - CAST(:NEW.horario_entrada AS DATE)) * 1440
        );
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- Revoga automaticamente QR Codes de uso único após o primeiro scan.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_uso_unico_qr
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
BEGIN
    IF :NEW.usos >= 1 AND :NEW.uso_unico = 1 THEN
        :NEW.ativo := 0;
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- Incrementa o contador de visitas do morador a cada nova visita registrada.
-- Atualiza todos os moradores vinculados ao lote destino.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_atualizar_total_visitas
    AFTER INSERT ON visitas
    FOR EACH ROW
BEGIN
    UPDATE moradores
    SET total_visitas = total_visitas + 1
    WHERE lote_id = :NEW.lote_id;
END;
/

COMMIT;

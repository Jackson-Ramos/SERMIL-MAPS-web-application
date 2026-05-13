# Esquema de Banco de Dados — SERMIL MAPS

> Baseado na análise dos módulos Admin e Porteiro. Módulo Visitante ignorado conforme solicitado.

---

## Diagrama de Entidades

```mermaid
erDiagram
    CONDOMINIOS ||--o{ QUADRAS : "tem"
    CONDOMINIOS ||--|| CONFIGURACOES : "possui"
    CONDOMINIOS ||--o{ QR_CODES : "gera"
    CONDOMINIOS ||--o{ VISITAS : "registra"
    CONDOMINIOS ||--o{ USUARIOS : "tem"

    QUADRAS ||--o{ LOTES : "contém"

    LOTES ||--o{ MORADORES : "tem"
    LOTES ||--o{ VISITAS : "recebe"

    MORADORES ||--o| USUARIOS : "pode ter conta"

    USUARIOS ||--o{ VISITAS : "registra (porteiro)"
    USUARIOS ||--o{ QR_CODES : "cria"
```

---

## Tabelas

---

### 🏢 `condominios`
Entidade raiz do sistema. Tudo pertence a um condomínio.

| Coluna           | Tipo           | Restrições      | Descrição                   |
|------------------|----------------|-----------------|-----------------------------|
| `id`             | `SERIAL`       | `PRIMARY KEY`   | ID único                    |
| `nome`           | `VARCHAR(150)` | `NOT NULL`      | Nome do condomínio          |
| `cidade`         | `VARCHAR(100)` | `NOT NULL`      | Cidade                      |
| `estado`         | `VARCHAR(2)`   | `NOT NULL`      | UF (ex: `"DF"`, `"SP"`)     |
| `ramal_portaria` | `VARCHAR(20)`  | `NOT NULL`      | Ramal principal da portaria |
| `criado_em`      | `TIMESTAMPTZ`  | `DEFAULT NOW()` | Data de cadastro            |

---

### ⚙️ `configuracoes`
Preferências do sistema por condomínio. Relação 1:1.

| Coluna                       | Tipo      | Restrições                    | Descrição                                 |
|------------------------------|-----------|-------------------------------|-------------------------------------------|
| `id`                         | `SERIAL`  | `PRIMARY KEY`                 |                                           |
| `cond_id`                    | `INTEGER` | `FK → condominios.id, UNIQUE` | Condomínio ao qual pertence               |
| `tempo_maximo_visita`        | `INTEGER` | `NOT NULL, DEFAULT 60`        | Duração máxima de visita (em minutos)     |
| `mapa_interno_ativo`         | `BOOLEAN` | `DEFAULT TRUE`                | Habilitar mapa interno ao visitante       |
| `google_maps_ativo`          | `BOOLEAN` | `DEFAULT TRUE`                | Habilitar botão Google Maps               |
| `waze_ativo`                 | `BOOLEAN` | `DEFAULT TRUE`                | Habilitar botão Waze                      |
| `ramal_flutuante_ativo`      | `BOOLEAN` | `DEFAULT TRUE`                | Exibir botão de ramal flutuante           |
| `expiracao_automatica_ativa` | `BOOLEAN` | `DEFAULT TRUE`                | Expirar visitas automaticamente pelo cron |

---

### 🗺️ `quadras`
Setores geográficos do condomínio.

| Coluna    | Tipo          | Restrições            | Descrição           |
|-----------|---------------|-----------------------|---------------------|
| `id`      | `SERIAL`      | `PRIMARY KEY`         |                     |
| `cond_id` | `INTEGER`     | `FK → condominios.id` | Condomínio pai      |
| `nome`    | `VARCHAR(20)` | `NOT NULL`            | Ex: `"A"`, `"001"` |

**Índice:** `(cond_id, nome)` — UNIQUE

---

### 🏠 `lotes`
Unidades habitacionais dentro de uma quadra.

| Coluna      | Tipo            | Restrições        | Descrição                         |
|-------------|-----------------|-------------------|-----------------------------------|
| `id`        | `SERIAL`        | `PRIMARY KEY`     |                                   |
| `quadra_id` | `INTEGER`       | `FK → quadras.id` | Quadra a qual pertence            |
| `numero`    | `VARCHAR(20)`   | `NOT NULL`        | Número do lote. Ex: `"12"`, `"4A"` |
| `latitude`  | `DECIMAL(10,7)` | `NULLABLE`        | Coordenada para o mapa interno    |
| `longitude` | `DECIMAL(10,7)` | `NULLABLE`        | Coordenada para o mapa interno    |

**Índice:** `(quadra_id, numero)` — UNIQUE

> **Nota de Design:** `nome_morador` e `ramal` foram movidos para a tabela `moradores`, que é a entidade correta. O lote representa a unidade física; o morador representa quem a ocupa.

---

### 👤 `moradores`
Moradores vinculados a um lote. Um lote pode ter múltiplos moradores.

| Coluna          | Tipo           | Restrições                              | Descrição                                         |
|-----------------|----------------|-----------------------------------------|---------------------------------------------------|
| `id`            | `SERIAL`       | `PRIMARY KEY`                           |                                                   |
| `lote_id`       | `INTEGER`      | `FK → lotes.id, ON DELETE CASCADE`      | Lote vinculado                                    |
| `nome`          | `VARCHAR(150)` | `NOT NULL`                              | Nome completo do morador                          |
| `cpf`           | `VARCHAR(14)`  | `UNIQUE, NULLABLE`                      | CPF do morador (formato `000.000.000-00`)         |
| `ramal`         | `VARCHAR(20)`  | `NULLABLE`                              | Ramal de comunicação interno                      |
| `user_id`       | `INTEGER`      | `FK → usuarios.id, ON DELETE SET NULL`  | Conta de acesso do morador (opcional)             |
| `total_visitas` | `INTEGER`      | `NOT NULL, DEFAULT 0`                   | Contador atualizado por trigger a cada visita     |
| `criado_em`     | `TIMESTAMPTZ`  | `DEFAULT NOW()`                         |                                                   |

> **Nota:** `total_visitas` é mantido sincronizado pelo trigger `trg_atualizar_total_visitas` definido abaixo. Alternativamente pode ser calculado com `COUNT(*) FROM visitas WHERE lote_id = m.lote_id` se performance permitir.

---

### 🧑‍💼 `usuarios`
Contas de acesso ao sistema (admin, porteiros e moradores).

| Coluna       | Tipo           | Restrições            | Descrição                               |
|--------------|----------------|-----------------------|-----------------------------------------|
| `id`         | `SERIAL`       | `PRIMARY KEY`         |                                         |
| `cond_id`    | `INTEGER`      | `FK → condominios.id` | Condomínio ao qual pertence             |
| `nome`       | `VARCHAR(150)` | `NOT NULL`            | Nome completo                           |
| `email`      | `VARCHAR(255)` | `NOT NULL`            | Login (e-mail)                          |
| `senha_hash` | `VARCHAR(255)` | `NOT NULL`            | Senha bcrypt                            |
| `role`       | `VARCHAR(20)`  | `NOT NULL`            | `'admin'`, `'porteiro'` ou `'morador'`  |
| `ativo`      | `BOOLEAN`      | `DEFAULT TRUE`        | Conta ativa/desativada                  |
| `criado_em`  | `TIMESTAMPTZ`  | `DEFAULT NOW()`       |                                         |

**Índice:** `(email, cond_id)` — UNIQUE

> **Nota de Design:** O UNIQUE é composto `(email, cond_id)` para suportar multi-tenant — o mesmo e-mail pode existir em condominios distintos. Se a autenticação for global (um login serve vários condominios), substituir por `UNIQUE (email)` simples e documentar essa decisão.

---

### 🚶 `visitas`
Registro de cada acesso ao condomínio.

| Coluna            | Tipo          | Restrições                          | Descrição                                      |
|-------------------|---------------|-------------------------------------|------------------------------------------------|
| `id`              | `SERIAL`      | `PRIMARY KEY`                       |                                                |
| `cond_id`         | `INTEGER`     | `FK → condominios.id`               | Condomínio                                     |
| `lote_id`         | `INTEGER`     | `FK → lotes.id, ON DELETE RESTRICT` | Destino da visita                              |
| `cpf`             | `VARCHAR(14)` | `NOT NULL`                          | CPF do visitante (formato `000.000.000-00`)    |
| `nome_visitante`  | `VARCHAR(150)`| `NULLABLE`                          | Nome do visitante — preenchido no registro manual |
| `quadra`          | `VARCHAR(20)` | `NOT NULL`                          | Desnormalizado para histórico (evita JOIN)     |
| `lote`            | `VARCHAR(20)` | `NOT NULL`                          | Desnormalizado para histórico (evita JOIN)     |
| `horario_entrada` | `TIMESTAMPTZ` | `NOT NULL`                          | Momento do check-in                            |
| `horario_saida`   | `TIMESTAMPTZ` | `NULLABLE`                          | Momento do check-out                           |
| `duracao_minutos` | `INTEGER`     | `NULLABLE`                          | Calculado pelo trigger ao encerrar             |
| `app_navegacao`   | `VARCHAR(30)` | `DEFAULT 'interno'`                 | `'interno'`, `'gmaps'`, `'waze'`, `'manual'`  |
| `status`          | `VARCHAR(20)` | `NOT NULL`                          | `'ativa'`, `'encerrada'`, `'expirada'`         |
| `rota`            | `JSONB`       | `NULLABLE`                          | Metadados da rota (ex: `{ "tipo": "gmaps" }`) |
| `observacoes`     | `TEXT`        | `NULLABLE`                          | Anotação do porteiro                           |
| `porteiro_id`     | `INTEGER`     | `FK → usuarios.id, NULLABLE`        | Porteiro que registrou manualmente             |
| `criado_em`       | `TIMESTAMPTZ` | `DEFAULT NOW()`                     |                                                |

> **Nota:** `porteiro_id` é NULL em visitas iniciadas pelo próprio visitante via QR code (self-service). `lote_id` usa `ON DELETE RESTRICT` — lotes com visitas não podem ser deletados, preservando o histórico.

**Índices:**
- `(cond_id, status)` — painel de visitantes ativos
- `(cpf, cond_id)` — busca por CPF no histórico
- `(lote_id, horario_entrada DESC)` — histórico por lote
- `(horario_entrada DESC)` — filtros de data

---

### 📱 `qr_codes`
QR Codes de portão gerados pelos administradores.

| Coluna        | Tipo           | Restrições                             | Descrição                                    |
|---------------|----------------|----------------------------------------|----------------------------------------------|
| `id`          | `SERIAL`       | `PRIMARY KEY`                          |                                              |
| `cond_id`     | `INTEGER`      | `FK → condominios.id, ON DELETE CASCADE` | Condomínio                                 |
| `criado_por`  | `INTEGER`      | `FK → usuarios.id, ON DELETE SET NULL` | Admin que gerou                              |
| `nome_portao` | `VARCHAR(100)` | `NOT NULL`                             | Label descritivo. Ex: `"Portão Principal"`   |
| `token`       | `VARCHAR(64)`  | `NOT NULL, UNIQUE`                     | UUID/hash seguro codificado na URL do QR     |
| `url`         | `TEXT`         | `NOT NULL`                             | URL completa gerada                          |
| `ativo`       | `BOOLEAN`      | `DEFAULT TRUE`                         | Se pode ser usado                            |
| `uso_unico`   | `BOOLEAN`      | `DEFAULT FALSE`                        | Revogado automaticamente após 1 scan         |
| `usos`        | `INTEGER`      | `DEFAULT 0`                            | Contador de scans realizados                 |
| `expira_em`   | `TIMESTAMPTZ`  | `NULLABLE`                             | Expiração por data/hora (`NULL` = permanente)|
| `criado_em`   | `TIMESTAMPTZ`  | `DEFAULT NOW()`                        |                                              |

> **Nota:** `criado_por` usa `ON DELETE SET NULL` — se o admin for removido, o QR Code é preservado mas perde a referência ao criador.

**Índice:** `(token)` — lookup na validação do scan

---

## SQL de Criação (PostgreSQL)

```sql
-- Condominios
CREATE TABLE condominios (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(150) NOT NULL,
  cidade          VARCHAR(100) NOT NULL,
  estado          VARCHAR(2)   NOT NULL,
  ramal_portaria  VARCHAR(20)  NOT NULL,
  criado_em       TIMESTAMPTZ  DEFAULT NOW()
);

-- Configurações (1:1 com condomínio)
CREATE TABLE configuracoes (
  id                          SERIAL PRIMARY KEY,
  cond_id                     INTEGER NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tempo_maximo_visita         INTEGER NOT NULL DEFAULT 60,
  mapa_interno_ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  google_maps_ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  waze_ativo                  BOOLEAN NOT NULL DEFAULT TRUE,
  ramal_flutuante_ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  expiracao_automatica_ativa  BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (cond_id)
);

-- Quadras
CREATE TABLE quadras (
  id       SERIAL PRIMARY KEY,
  cond_id  INTEGER NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nome     VARCHAR(20) NOT NULL,
  UNIQUE   (cond_id, nome)
);

-- Lotes
CREATE TABLE lotes (
  id         SERIAL PRIMARY KEY,
  quadra_id  INTEGER          NOT NULL REFERENCES quadras(id) ON DELETE CASCADE,
  numero     VARCHAR(20)      NOT NULL,
  latitude   DECIMAL(10, 7),
  longitude  DECIMAL(10, 7),
  UNIQUE     (quadra_id, numero)
);

-- Usuários (admin, porteiro e morador)
CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  cond_id     INTEGER      NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'porteiro', 'morador')),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (email, cond_id)
);

-- Moradores
CREATE TABLE moradores (
  id            SERIAL PRIMARY KEY,
  lote_id       INTEGER      NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  nome          VARCHAR(150) NOT NULL,
  cpf           VARCHAR(14)  UNIQUE,
  ramal         VARCHAR(20),
  user_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  total_visitas INTEGER      NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ  DEFAULT NOW()
);

-- Visitas
CREATE TABLE visitas (
  id               SERIAL PRIMARY KEY,
  cond_id          INTEGER      NOT NULL REFERENCES condominios(id),
  lote_id          INTEGER      NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  cpf              VARCHAR(14)  NOT NULL,
  nome_visitante   VARCHAR(150),
  quadra           VARCHAR(20)  NOT NULL,
  lote             VARCHAR(20)  NOT NULL,
  horario_entrada  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  horario_saida    TIMESTAMPTZ,
  duracao_minutos  INTEGER,
  app_navegacao    VARCHAR(30)  NOT NULL DEFAULT 'interno',
  status           VARCHAR(20)  NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada', 'expirada')),
  rota             JSONB,
  observacoes      TEXT,
  porteiro_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_visitas_status ON visitas (cond_id, status);
CREATE INDEX idx_visitas_cpf    ON visitas (cpf, cond_id);
CREATE INDEX idx_visitas_lote   ON visitas (lote_id, horario_entrada DESC);
CREATE INDEX idx_visitas_data   ON visitas (horario_entrada DESC);

-- QR Codes
CREATE TABLE qr_codes (
  id           SERIAL PRIMARY KEY,
  cond_id      INTEGER      NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  criado_por   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome_portao  VARCHAR(100) NOT NULL,
  token        VARCHAR(64)  NOT NULL UNIQUE,
  url          TEXT         NOT NULL,
  ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
  uso_unico    BOOLEAN      NOT NULL DEFAULT FALSE,
  usos         INTEGER      NOT NULL DEFAULT 0,
  expira_em    TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_qr_token ON qr_codes (token);
```

---

## Triggers

```sql
-- Calcula duração automaticamente ao encerrar visita
CREATE OR REPLACE FUNCTION calcular_duracao_visita()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.horario_saida IS NOT NULL AND OLD.horario_saida IS NULL THEN
    NEW.duracao_minutos := EXTRACT(EPOCH FROM (NEW.horario_saida - NEW.horario_entrada)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_duracao
  BEFORE UPDATE ON visitas
  FOR EACH ROW EXECUTE FUNCTION calcular_duracao_visita();

-- Revoga QR Code de uso único após o primeiro scan
CREATE OR REPLACE FUNCTION revogar_uso_unico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.usos >= 1 AND NEW.uso_unico = TRUE THEN
    NEW.ativo := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_uso_unico_qr
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION revogar_uso_unico();

-- Atualiza contador de visitas do morador ao registrar nova visita
CREATE OR REPLACE FUNCTION atualizar_total_visitas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE moradores SET total_visitas = total_visitas + 1
    WHERE lote_id = NEW.lote_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_total_visitas
  AFTER INSERT ON visitas
  FOR EACH ROW EXECUTE FUNCTION atualizar_total_visitas();
```

---

## Notas de Arquitetura

| Decisão | Justificativa |
|---------|---------------|
| `quadra` e `lote` desnormalizados em `visitas` | Preserva histórico mesmo que o lote seja renomeado ou deletado |
| `lote_id ON DELETE RESTRICT` em `visitas` | Impede deleção de lote com visitas registradas — a aplicação deve tratar este erro |
| `token` separado de `url` em `qr_codes` | Permite trocar o domínio base sem invalidar os tokens |
| `JSONB` para `rota` em `visitas` | Flexível para armazenar metadados diferentes por tipo de rota |
| `configuracoes` como tabela separada | Facilita extensão de preferências sem alterar `condominios` |
| `porteiro_id` nullable em `visitas` | Visitas via QR code (self-service) não têm porteiro associado |
| `criado_por` com `ON DELETE SET NULL` em `qr_codes` | Preserva o QR Code mesmo se o admin que o criou for removido |
| `moradores` como tabela real (não view) | Moradores têm CPF, ramal e vínculo com `usuarios` — não derivável de `lotes` |
| `UNIQUE (email, cond_id)` em `usuarios` | Suporte multi-tenant: mesmo e-mail pode existir em condominios distintos |
| `nome_morador` e `ramal` removidos de `lotes` | Responsabilidade movida para `moradores` — lote é a unidade física, morador é quem ocupa |

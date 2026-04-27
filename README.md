# SERMIL MAPS

Sistema de navegação interna e controle de acesso para condomínios horizontais.

---

## Arquitetura

```
Browser
  └─→ Frontend React/Nginx (:3000)
          └─→ /api/* proxy
                  └─→ Backend Express (:5000)
                              └─→ Webhooks HTTP
                                      └─→ n8n (:5678)
                                                └─→ Oracle XE 21c (:1521)
```

Todos os serviços rodam em containers Docker orquestrados pelo `docker-compose.yml`.  
O banco de dados Oracle é o único ponto de persistência. O n8n executa todas as queries SQL.

---

## Stack

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 | UI |
| TypeScript | — | Tipagem estática |
| Vite | 6 | Build e dev server |
| Tailwind CSS | 4 | Estilização |
| React Router | 7 | Navegação SPA |
| Zustand | 5 | Estado global |
| Axios | — | Chamadas HTTP |
| Recharts | — | Gráficos do dashboard |
| react-leaflet | — | Mapa interno |
| qrcode.react | — | Geração de QR Codes |

### Backend
| Tecnologia | Função |
|---|---|
| Node.js 20 + Express | API REST — roteador HTTP → n8n |
| jsonwebtoken | Autenticação JWT (8h de expiração) |
| bcryptjs | Hash de senhas (salt 10) |
| multer | Upload de CSV para importação de lotes |

### Infraestrutura
| Serviço | Imagem / Build | Porta |
|---|---|---|
| Oracle XE 21c | `gvenzl/oracle-xe:21-slim` | 1521 |
| n8n | `node:20-slim` customizado | 5678 |
| Backend | `node:20-slim` | interno |
| Frontend | Nginx Alpine (build multi-stage) | **3000** |

---

## Módulos

### Admin (`/admin`) — Desktop (1024px+)
- **Dashboard** — métricas em tempo real, gráfico de densidade por quadra, uso de apps de navegação
- **Visitas** — histórico com filtros (quadra, status, período) e exportação CSV
- **Quadras & Lotes** — gestão visual com mapa, importação em massa via CSV
- **Moradores** — cadastro completo com vínculo a lote e conta de acesso
- **Usuários** — gestão de contas admin, porteiro e morador; ativar/desativar
- **QR Codes** — geração, download, impressão, controle de uso único e expiração
- **Configurações** — dados do condomínio, tempo máximo de visita, toggles de módulos

### Porteiro (`/porteiro`) — Tablet (768px)
- **Painel** — visitas ativas com atualização automática a cada 15s, encerramento com observação
- **Histórico** — busca por CPF ou número do lote
- **Registro Manual** — entrada sem QR Code, gera QR para o visitante
- **Ramais** — lista de moradores com discagem direta

### Visitante (`/visitante`) — Mobile (390px)
Fluxo linear sem login: Identificação → Quadra → Lote → Navegação → Chegada

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- 4 GB de RAM disponíveis (Oracle XE exige ~2 GB)
- Portas `3000`, `5678` e `1521` livres

Para desenvolvimento local do frontend fora do Docker:
- Node.js 20+
- pnpm (`npm install -g pnpm`)

---

## Instalação e execução com Docker

### 1. Clonar e configurar o ambiente

```bash
git clone <repo-url>
cd "SERMIL MAPS web application"

cp .env.example .env
```

Edite o `.env` com as suas senhas antes de continuar (obrigatório em produção, opcional em dev).

### 2. Gerar o hash de senha para o seed

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('Sermil@2026', 10));"
```

Abra `docker/oracle/init/02_seed.sql` e substitua o valor de `senha_hash` pelo hash gerado.

### 3. Subir o stack completo

```bash
docker compose up --build
```

> **Primeira execução:** O Oracle XE leva 2–4 minutos para inicializar.  
> Aguarde todos os containers ficarem `healthy` antes de acessar a aplicação.

```bash
# Acompanhar o status em outro terminal
docker compose ps
```

### 4. Configurar o n8n (uma única vez)

Siga o **[GUIA_N8N_SETUP.md](GUIA_N8N_SETUP.md)** para:
- Criar a credential **Oracle SERMIL** no painel do n8n (`http://localhost:5678`)
- Ativar os 8 workflows
- Verificar a integração end-to-end

### 5. Acessar a aplicação

| Serviço | URL |
|---|---|
| Aplicação | http://localhost:3000 |
| n8n Admin | http://localhost:5678 |
| Oracle (SQL Developer) | `localhost:1521` / service `XEPDB1` |

**Login padrão (seed):**
- Admin: `admin@sermilmaps.com`
- Porteiro: `porteiro@sermilmaps.com`
- Senha: a que você definiu no Passo 2

---

## Desenvolvimento local do frontend

Para iterar rapidamente no frontend sem subir todos os containers:

```bash
# Instalar dependências
pnpm install

# Rodar em modo mock (sem backend)
pnpm dev
# VITE_USE_MOCK=true já está no .env padrão
```

Para conectar ao backend rodando no Docker:

```bash
# .env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
VITE_COND_ID=1
```

---

## Comandos úteis

```bash
# Subir o stack em background
docker compose up -d

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f n8n
docker compose logs -f oracle

# Parar os containers (preserva volumes/dados)
docker compose down

# Parar e APAGAR todos os dados (reset completo)
docker compose down -v

# Rebuild de um serviço específico
docker compose up --build backend

# Acessar o Oracle via sqlplus
docker exec -it sermil_oracle sqlplus sermil/SermilApp1234@XEPDB1

# Exportar workflows do n8n após alterações
docker exec sermil_n8n n8n export:workflow --all --output=/home/node/workflows/
docker cp sermil_n8n:/home/node/workflows/. ./docker/n8n/workflows/
```

---

## Estrutura do Projeto

```
SERMIL MAPS web application/
├── src/                            # Código-fonte do frontend
│   ├── modules/
│   │   ├── admin/                  # Módulo administrativo
│   │   ├── porteiro/               # Módulo porteiro
│   │   └── visitante/              # Módulo visitante
│   └── shared/
│       ├── components/             # Componentes reutilizáveis
│       ├── services/               # Serviços Axios (→ /api/*)
│       ├── store/                  # Estado global Zustand
│       ├── types/                  # Interfaces TypeScript
│       └── utils/                  # Funções auxiliares
├── backend/                        # API Express
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js               # Entry point
│       ├── n8nClient.js            # Helper: callN8n(path, body)
│       ├── transform.js            # Converte NUMBER(1) Oracle → boolean
│       ├── middleware/
│       │   ├── auth.js             # Verificação JWT
│       │   └── errorHandler.js     # Tratamento centralizado de erros
│       └── routes/                 # Uma rota por entidade do domínio
├── docker/
│   ├── oracle/
│   │   └── init/
│   │       ├── 01_schema.sql       # Schema Oracle XE 21c + triggers PL/SQL
│   │       └── 02_seed.sql         # Dados iniciais (condomínio, usuários, quadras)
│   ├── n8n/
│   │   ├── Dockerfile              # node:20-slim + Oracle Instant Client
│   │   └── workflows/              # 8 arquivos JSON importados automaticamente
│   ├── nginx/
│   │   └── default.conf            # SPA fallback + proxy /api/* → backend
│   └── frontend/
│       └── Dockerfile              # Build multi-stage Vite → Nginx
├── docker-compose.yml              # Orquestração dos 4 containers
├── .env.example                    # Template de variáveis de ambiente
├── .dockerignore
├── database_schema.md              # Documentação do schema de banco
└── GUIA_N8N_SETUP.md               # Guia de setup manual do n8n (Fase 6)
```

---

## Variáveis de Ambiente

Todas as variáveis ficam no `.env` (gerado a partir do `.env.example`).

| Variável | Padrão | Descrição |
|---|---|---|
| `ORACLE_SYS_PASSWORD` | `SermilOracle1234` | Senha dos usuários SYS/SYSTEM do Oracle |
| `ORACLE_APP_USER` | `sermil` | Usuário da aplicação no Oracle |
| `ORACLE_APP_PASSWORD` | `SermilApp1234` | Senha do usuário da aplicação |
| `N8N_USER` | `admin` | Login do painel n8n |
| `N8N_PASSWORD` | `n8nAdmin123` | Senha do painel n8n |
| `N8N_WEBHOOK_SECRET` | — | Chave compartilhada backend ↔ n8n |
| `JWT_SECRET` | — | Segredo para assinatura dos tokens JWT |
| `COND_ID` | `1` | ID do condomínio padrão |

> Variáveis do frontend (`VITE_*`) são **build-time** — alterar exige `docker compose up --build frontend`.

---

## API REST

Todas as rotas requerem `Authorization: Bearer <token>` exceto `/api/auth/login`.

### Auth
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Login — retorna JWT e dados do usuário |
| `GET` | `/api/auth/me` | Dados do usuário logado |

### Condomínios
| Método | Rota |
|---|---|
| `GET` | `/api/condominios/:id` |
| `PUT` | `/api/condominios/:id` |
| `GET` | `/api/condominios/:id/configuracoes` |
| `PUT` | `/api/condominios/:id/configuracoes` |

### Quadras / Lotes / Moradores / Usuários
| Método | Rota |
|---|---|
| `GET` | `/api/quadras?cond_id=` |
| `POST` | `/api/quadras` |
| `PUT` | `/api/quadras/:id` |
| `GET` | `/api/lotes?quadra_id=` |
| `POST` | `/api/lotes` |
| `PUT` | `/api/lotes/:id` |
| `POST` | `/api/lotes/import` (multipart CSV) |
| `GET` | `/api/moradores?cond_id=` |
| `POST` | `/api/moradores` |
| `PUT` | `/api/moradores/:id` |
| `DELETE` | `/api/moradores/:id` |
| `GET` | `/api/usuarios?cond_id=` |
| `POST` | `/api/usuarios` |
| `PUT` | `/api/usuarios/:id` |
| `PATCH` | `/api/usuarios/:id/toggle-ativo` |
| `DELETE` | `/api/usuarios/:id` |

### Visitas
| Método | Rota |
|---|---|
| `POST` | `/api/visita/iniciar` |
| `PATCH` | `/api/visita/encerrar` |
| `GET` | `/api/visitas/ativas?cond_id=` |
| `GET` | `/api/visitas/historico?cond_id=&cpf=&quadra=&status=&data_inicio=&data_fim=` |

### QR Codes
| Método | Rota |
|---|---|
| `GET` | `/api/qrcodes?cond_id=` |
| `POST` | `/api/qrcodes` |
| `DELETE` | `/api/qrcodes/:id` |
| `POST` | `/api/qrcodes/validate` |

---

## Design

- **Primária:** `#0B4F3A` (verde-escuro)
- **Superfícies:** Branco
- **Bordas:** `0.5px` finas
- Contraste WCAG AA, botões mínimo 48px, navegação por teclado

---

## Licença

Proprietary

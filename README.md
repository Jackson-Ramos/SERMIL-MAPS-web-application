# SERMIL MAPS

Sistema de navegação interna e controle de acesso para condomínios horizontais.

---

## Arquitetura

```
Browser
  └─→ Frontend React/Vite (:3000 em dev, ou build estático)
          └─→ HTTP /api/*
                  └─→ Backend Express (:5000)
                              └─→ SQLite (backend/data/sermil.db)
```

Sem Docker, sem Oracle, sem n8n. Persistência local em arquivo SQLite criado
automaticamente na primeira execução do backend.

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
| Node.js 20 + Express | API REST |
| better-sqlite3 | Driver SQLite síncrono |
| jsonwebtoken | Autenticação JWT (8h de expiração) |
| bcryptjs | Hash de senhas (salt 10) |
| multer | Upload de CSV para importação de lotes |

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

- **Node.js 20+** — [download](https://nodejs.org/)
- **pnpm** para o frontend: `npm install -g pnpm`

> `better-sqlite3` é um módulo nativo. Em geral o npm baixa um binário pré-compilado
> automaticamente. Se em algum sistema isso falhar, instale:
> - **Windows:** [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (workload "Desktop development with C++")
> - **macOS:** `xcode-select --install`
> - **Linux:** `build-essential` + `python3`

---

## Instalação

### 1. Clonar e configurar o ambiente

```bash
git clone <repo-url>
cd "SERMIL MAPS web application"

cp .env.example .env
```

Edite `.env` se quiser trocar `JWT_SECRET` ou portas (opcional em dev).

### 2. Instalar dependências

```bash
# Frontend (na raiz do projeto)
pnpm install

# Backend
cd backend
npm install
cd ..
```

### 3. Subir backend e frontend (dois terminais)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

Na primeira execução, o backend cria automaticamente o arquivo
`backend/data/sermil.db`, aplica o schema (`backend/src/schema.sql`) e
popula os dados iniciais (`backend/src/seed.sql`). Saída esperada:

```
[db] Banco novo detectado — aplicando schema e seed...
[db] Banco inicializado em backend/data/sermil.db
Backend SERMIL rodando na porta 5000
```

**Terminal 2 — Frontend:**
```bash
pnpm dev
```

Acesse http://localhost:3000.

---

## Login padrão (seed)

| Perfil | Email | Senha |
|---|---|---|
| Admin | `admin@sermilmaps.com` | `Sermil@2026` |
| Porteiro | `porteiro@sermilmaps.com` | `Sermil@2026` |

Para gerar um novo hash de senha:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('SuaSenha', 10));"
```

E substitua o valor de `senha_hash` em [backend/src/seed.sql](backend/src/seed.sql).

---

## Reset do banco

O banco SQLite fica em `backend/data/sermil.db`. Para zerar e repopular tudo,
basta apagar o arquivo — o backend recria na próxima execução.

```bash
rm backend/data/sermil.db
cd backend && npm start
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `5000` | Porta do backend |
| `JWT_SECRET` | — | Segredo para assinatura dos tokens JWT |
| `COND_ID` | `1` | ID do condomínio padrão (login utiliza este) |
| `FRONTEND_URL` | `http://localhost:3000` | Origem permitida no CORS e base do link de QR Codes |
| `VITE_USE_MOCK` | `false` | Frontend usa dados mockados quando true |
| `VITE_API_URL` | `http://localhost:5000/api` | URL base para chamadas Axios |
| `VITE_COND_ID` | `1` | ID do condomínio usado no frontend |

> Variáveis `VITE_*` são **build-time**: alterá-las em produção exige rebuild
> do frontend (`pnpm build`).

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
├── backend/                        # API Express + SQLite
│   ├── package.json
│   ├── data/                       # (gerado) sermil.db
│   └── src/
│       ├── server.js               # Entry point
│       ├── db.js                   # Conexão SQLite + auto-init + transform
│       ├── schema.sql              # DDL SQLite + triggers
│       ├── seed.sql                # Dados iniciais
│       ├── middleware/
│       │   ├── auth.js             # Verificação JWT
│       │   └── errorHandler.js     # Tratamento centralizado de erros
│       └── routes/                 # Uma rota por entidade
├── .env.example
├── database_schema.md              # Documentação do schema
└── package.json                    # Dependências do frontend
```

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

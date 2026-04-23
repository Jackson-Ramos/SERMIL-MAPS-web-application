# SERMIL MAPS

Sistema de navegação interna e controle de acesso para condomínios horizontais.

## Tecnologias

- **React 18** com **Vite**
- **TypeScript**
- **Tailwind CSS**
- **React Router v6**
- **Zustand** (estado global)
- **Axios** (requisições HTTP)
- **Recharts** (gráficos)
- **react-leaflet** (mapas)
- **qrcode.react** (QR Codes)

## Estrutura do Projeto

```
sermil-maps/
├── src/
│   ├── modules/
│   │   ├── admin/          # Módulo administrativo (desktop)
│   │   ├── porteiro/       # Módulo porteiro (tablet)
│   │   └── visitante/      # Módulo visitante (mobile)
│   ├── shared/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Chamadas à API (Axios)
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Funções auxiliares
│   └── router/             # Configuração de rotas
```

## Módulos

### 1. Administrativo (`/admin`)
Interface desktop para gestão completa do condomínio.

**Páginas:**
- Dashboard - Métricas, visitas ativas, gráficos
- Visitas - Histórico com filtros e exportação CSV
- Quadras & Lotes - Gestão visual de lotes, importação CSV
- Moradores - Cadastro de moradores
- QR Codes - Geração, download e impressão
- Configurações - Dados do condomínio e configurações do sistema

### 2. Porteiro (`/porteiro`)
Interface para tablet com atualização automática a cada 15s.

**Páginas:**
- Painel - Visitas ativas em tempo real
- Histórico - Busca por CPF ou lote
- Registro Manual - Formulário para visitas sem QR Code
- Ramais - Busca de moradores com discagem direta

### 3. Visitante (`/visitante`)
Interface mobile-first, fluxo linear sem login.

**Fluxo:**
1. Identificação (CPF)
2. Seleção de Quadra
3. Seleção de Lote
4. Escolha de navegação (Mapa Interno, Google Maps, Waze)
5. Navegação com mapa
6. Confirmação de chegada

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:5000/api
VITE_COND_ID=1
```

## Instalação

```bash
pnpm install
```

## Desenvolvimento

```bash
pnpm dev
```

## API Backend

A aplicação espera uma API REST em Flask/Python com os seguintes endpoints:

### Condomínios
- `GET /condominios/:id`
- `PUT /condominios/:id`
- `GET /condominios/:id/configuracoes`
- `PUT /condominios/:id/configuracoes`

### Quadras
- `GET /quadras?cond_id={id}`
- `POST /quadras`
- `PUT /quadras/:id`

### Lotes
- `GET /lotes?quadra_id={id}`
- `POST /lotes`
- `PUT /lotes/:id`
- `POST /lotes/import` (CSV)

### Visitas
- `POST /visita/iniciar`
- `PATCH /visita/encerrar`
- `GET /visitas/ativas?cond_id={id}`
- `GET /visitas/historico?cond_id={id}`

### QR Codes
- `GET /qrcodes?cond_id={id}`
- `POST /qrcodes`
- `DELETE /qrcodes/:id`

## Funcionalidades Principais

- ✅ Controle de acesso por QR Code
- ✅ Navegação interna com mapas
- ✅ Integração com Google Maps e Waze
- ✅ Ramal flutuante para ligar ao morador
- ✅ Dashboard com métricas em tempo real
- ✅ Polling automático de visitas ativas
- ✅ Validação de CPF no frontend
- ✅ Exportação de relatórios em CSV
- ✅ Importação de lotes em massa
- ✅ Gestão de QR Codes por portão
- ✅ Configurações personalizáveis por condomínio

## Paleta de Cores

- **Primária:** `#0B4F3A` (verde-escuro)
- **Superfícies:** Branco
- **Bordas:** `0.5px` finas

## Responsividade

- **Admin:** Desktop (1024px+)
- **Porteiro:** Tablet (768px)
- **Visitante:** Mobile (390px)

## Acessibilidade

- Contraste WCAG AA
- Botões com altura mínima de 48px
- Navegação por teclado
- Labels descritivos

## Licença

Proprietary

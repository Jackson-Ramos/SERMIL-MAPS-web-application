# SERMIL MAPS — Planejamento completo do sistema

> Sistema de navegação interna e controle de acesso para condomínios horizontais.
> Acesso via QR Code, identificação por CPF, mapa interno, ramal do morador e rastreamento de visitas.

---

## 1. Visão geral

O SERMIL MAPS resolve dois problemas simultâneos em condomínios horizontais: **navegação interna** (visitantes e entregadores não sabem onde ficam as quadras e lotes) e **controle de acesso** (a portaria não tem visibilidade de quem está no condomínio, há quanto tempo e para onde foi).

A aplicação é composta por quatro módulos independentes com autenticação separada, integrados por uma API REST central.

---

## 2. Atores do sistema

### 2.1 Visitante / Entregador
- Interface: aplicação web mobile-first, sem instalação
- Acesso: escaneamento de QR Code na portaria ou link de convite do morador
- Dispositivo: celular do próprio visitante

**Funcionalidades:**
- Escaneia QR Code na portaria e acessa o app no navegador
- Informa CPF para identificação e registro
- Pesquisa morador por nome ou navega pela lista de quadras e lotes
- Escolhe modo de navegação: mapa interno, Google Maps ou Waze
- Liga para o ramal do morador diretamente pelo app
- Confirma chegada ao destino, encerrando o registro de visita
- Acessa via link de convite enviado pelo morador (fluxo pré-cadastrado)

---

### 2.2 Porteiro
- Interface: painel web para tablet fixo na guarita
- Acesso: login com usuário e senha
- Dispositivo: tablet ou computador da portaria

**Funcionalidades:**
- Gera QR Code com rota pré-definida para um lote específico (para entregadores)
- Monitora em tempo real todos os visitantes ativos e há quanto tempo estão no condomínio
- Consulta lista de convidados cadastrada pelos moradores
- Registra visita manualmente quando o visitante não consegue usar o QR Code
- Encerra ou bloqueia visitas ativas
- Acessa ramal de todos os moradores para contato direto
- Consulta histórico completo de visitas com filtros por data, CPF e lote

---

### 2.3 Morador
- Interface: painel web desktop/mobile
- Acesso: login com usuário e senha criado pelo administrador
- Dispositivo: qualquer

**Funcionalidades:**
- Cria lista de convidados e disponibiliza para a portaria
- Agenda visita com data e horário, gerando notificação automática para a portaria
- Envia link de convite para o visitante; ao se cadastrar via link, a portaria é avisada automaticamente
- Autoriza ou recusa entrada de visitantes específicos
- Consulta histórico de quem visitou seu lote

---

### 2.4 Administração do Condomínio
- Interface: painel web desktop
- Acesso: login com perfil administrador
- Dispositivo: computador

**Funcionalidades:**
- Cadastra quadras, lotes e moradores
- Gerencia QR Codes e portões de entrada (gerar, revogar, por portão)
- Define permissões de moradores e funcionários por papel (porteiro, morador, admin)
- Configura regras do sistema: tempo máximo de visita, apps de navegação disponíveis, expiração automática
- Acessa relatórios e auditoria completa de visitas
- Expansão futura para multi-condomínio

---

## 3. Fluxos de integração entre atores

### Fluxo 1 — Visitante espontâneo (QR Code do painel)
```
[Portaria exibe QR Code no painel]
        ↓
[Visitante escaneia com o celular]
        ↓
[App abre no navegador — tela de CPF]
        ↓
[Visitante informa CPF → sistema valida e registra]
        ↓
[Visitante pesquisa morador por nome OU seleciona quadra → lote]
        ↓
[Escolhe modo de navegação: Mapa Interno / Google Maps / Waze]
        ↓
[Visita registrada no banco: CPF, destino, rota, horário de entrada]
        ↓
[Visitante navega — botão flutuante para ligar ao ramal durante a rota]
        ↓
[Ao retornar ao app → tela "Chegou?" → confirmação encerra a visita]
```

---

### Fluxo 2 — Convite do morador (pré-cadastro)
```
[Morador acessa painel e cria convite com data e nome do visitante]
        ↓
[Sistema gera link único com token de expiração]
        ↓
[Morador envia link por WhatsApp / e-mail ao visitante]
        ↓
[Visitante acessa o link e preenche nome e CPF]
        ↓
[Sistema registra pré-visita e NOTIFICA A PORTARIA]
  → Notificação push / e-mail para porteiro: "João Silva previsto para hoje às 14h — Quadra B, Lote 12"
        ↓
[Visitante chega → porteiro já tem o registro — entrada facilitada]
        ↓
[Visitante escaneia QR Code e o app já preenche destino automaticamente via token do convite]
```

---

### Fluxo 3 — QR Code gerado pelo porteiro (entregador)
```
[Porteiro confirma lote por telefone com o morador]
        ↓
[Porteiro acessa painel → "Gerar QR Code para lote" → seleciona Quadra B, Lote 12]
        ↓
[QR Code é gerado com destino pré-definido]
        ↓
[Porteiro exibe QR Code na tela ou imprime]
        ↓
[Entregador escaneia → app abre já na tela de navegação (sem precisar selecionar destino)]
        ↓
[Visita registrada → entregador navega diretamente]
```

---

### Fluxo 4 — Notificações (módulo transversal)
```
GATILHO                          → DESTINATÁRIO     → CANAL
────────────────────────────────────────────────────────────────
Convite criado pelo morador      → Porteiro          → Push / e-mail
Visitante se cadastrou via link  → Porteiro + Morador → Push / e-mail
Visita iniciada (entrada)        → Morador do lote   → Push (opcional)
Visita com tempo excedido        → Porteiro           → Push + alerta no painel
Visita expirada automaticamente  → Porteiro           → Alerta no painel
Relatório diário de visitas      → Administrador      → E-mail (agendado)
```

O módulo de notificações pode ser orquestrado via **n8n**, que monitora eventos da API e dispara os canais configurados sem acoplamento direto ao backend Flask.

---

### Fluxo 5 — Permissões (Admin → demais atores)
```
[Admin cria conta de porteiro → vincula ao condomínio → define permissões]
[Admin cria conta de morador → vincula ao lote → define se pode criar convites]
[Admin define regras globais → tempo máximo de visita, apps disponíveis, QR Codes]
```

---

## 4. Modelo de dados

### Entidades principais

| Tabela | Campos principais | Observação |
|---|---|---|
| `condominio` | id, nome, cidade, estado, ramal_portaria, tempo_max_visita | Base para multi-condomínio |
| `quadra` | id, condominio_id, nome | FK para condomínio |
| `lote` | id, quadra_id, numero, lat, lon, ramal, morador_id | Coordenadas para navegação |
| `morador` | id, lote_id, nome, cpf, ramal, user_id | Vinculado a um lote |
| `visitante` | id, cpf, nome, bloqueado, criado_em | CPF como identificador único |
| `visita` | id, visitante_id, lote_id, entrada_em, saida_em, permanencia_min, rota_json, status | Status: ativa / encerrada / expirada |
| `convite` | id, morador_id, token, nome_convidado, data_prevista, usado, expira_em | Token único por convite |
| `notificacao` | id, tipo, destinatario_id, mensagem, enviado_em, canal | Log de notificações enviadas |
| `usuario` | id, nome, email, papel, condominio_id, ativo | Papéis: admin / porteiro / morador |
| `qrcode` | id, condominio_id, portao, url, ativo, criado_em | Um QR Code por portão |

### Relacionamentos
```
condominio ──< quadra ──< lote ──< visita >── visitante
                              └──── morador ──< convite
condominio ──< qrcode
condominio ──< usuario
```

---

## 5. Arquitetura de módulos

```
sermil-maps/
├── src/
│   ├── modules/
│   │   ├── admin/          # Painel administrativo — desktop
│   │   ├── porteiro/       # Painel da portaria — tablet
│   │   ├── morador/        # Painel do morador — web
│   │   └── visitante/      # App do visitante — mobile (PWA)
│   ├── shared/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Chamadas à API (Axios)
│   │   ├── store/          # Estado global (Zustand)
│   │   └── utils/          # CPF, tempo, navegação, notificações
│   └── router/             # Configuração de rotas (React Router v6)
```

---

## 6. Stack tecnológico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend (todos os módulos) | React 18 + Vite | Stack atual do desenvolvedor |
| Estilização | Tailwind CSS | Produtividade e responsividade |
| Estado global | Zustand | Leve e simples para o porte do projeto |
| Requisições HTTP | Axios | Interceptores para erros e autenticação |
| Mapa interno | React Leaflet + OpenStreetMap | Gratuito, funciona offline com tiles cached |
| QR Code | qrcode.react | Geração e download de QR Codes no browser |
| Gráficos (admin) | Recharts | Compatível com React, simples de usar |
| Backend | Flask (Python) | Stack atual do desenvolvedor |
| Banco de dados | Oracle Database | Stack atual do desenvolvedor |
| Containerização | Docker + docker-compose | Já em uso no projeto |
| Notificações | n8n | Orquestração de eventos sem acoplamento ao Flask |
| Agendamento | APScheduler (Flask) | Expiração automática de visitas |
| Cache offline | Workbox (Service Worker) | Módulo visitante funciona com sinal fraco |

---

## 7. Módulo de notificações

### Canais disponíveis

| Canal | Caso de uso | Ferramenta |
|---|---|---|
| Push (browser) | Alertas urgentes ao porteiro | Web Push API |
| E-mail | Confirmação de convite, relatório diário | n8n + SMTP |
| Painel (in-app) | Alertas visuais no painel do porteiro | Polling / WebSocket |

### Eventos que geram notificação

```
1. Morador cria convite
   → Porteiro recebe: nome do convidado, data, lote destino

2. Visitante se cadastra via link de convite
   → Porteiro recebe: CPF confirmado, horário previsto
   → Morador recebe: confirmação de que o convidado se cadastrou

3. Visitante inicia visita (opcional, configurável)
   → Morador recebe: "Alguém entrou com destino ao seu lote"

4. Visita ultrapassa tempo máximo configurado
   → Porteiro recebe: alerta com nome (CPF), lote e tempo decorrido

5. Visita expirada automaticamente pelo sistema
   → Porteiro recebe: registro no painel marcado como expirado

6. Relatório diário (agendado, 00h)
   → Administrador recebe: total de visitas, expiradas, lotes mais visitados
```

### Integração com n8n

O n8n monitora a API do Flask via webhook ou polling e dispara os canais. Isso mantém o Flask desacoplado da lógica de notificação.

```
Flask API → POST /webhook/evento → n8n
                                    ├── E-mail (SMTP)
                                    ├── Push (Web Push)
                                    └── Slack / WhatsApp (expansão futura)
```

---

## 8. Roadmap de desenvolvimento

### Fase 1 — MVP de navegação (semanas 1–2)
- [ ] Banco de dados: tabelas `condominio`, `quadra`, `lote`
- [ ] API Flask: endpoints de quadras, lotes e coordenadas
- [ ] Módulo visitante: tela de CPF, seleção de quadra/lote, abertura de mapa externo
- [ ] QR Code estático do painel apontando para a URL do app
- [ ] Docker-compose com Flask + Oracle

### Fase 2 — Controle de acesso (semanas 3–5)
- [ ] Tabelas `visitante`, `visita`
- [ ] API: iniciar visita, encerrar visita, expiração automática via APScheduler
- [ ] Módulo visitante: tela de chegada com botão de encerramento
- [ ] Módulo porteiro: painel de visitas ativas com polling a cada 15s
- [ ] Validação de CPF com dígitos verificadores

### Fase 3 — Mapa interno e ramal (semanas 4–6)
- [ ] Integração React Leaflet com tiles do OpenStreetMap
- [ ] Rota traçada entre portão e lote destino
- [ ] Botão flutuante de ramal com discagem direta (`tel:`)
- [ ] Campo `ramal` na tabela `lote`
- [ ] Service Worker com cache de quadras e lotes (offline)

### Fase 4 — Painel do porteiro completo (semanas 6–8)
- [ ] Histórico de visitas com filtros
- [ ] Geração de QR Code por lote específico
- [ ] Registro manual de visita
- [ ] Busca de ramal por nome do morador
- [ ] Bloqueio de CPF

### Fase 5 — Módulo do morador (semanas 8–10)
- [ ] Tabelas `morador`, `convite`, `usuario`
- [ ] Painel do morador: criação de lista de convidados
- [ ] Geração de link de convite com token único
- [ ] Fluxo de cadastro via link + notificação à portaria
- [ ] Agendamento de visita com data

### Fase 6 — Notificações e módulo admin (semanas 10–12)
- [ ] Tabela `notificacao` e webhooks no Flask
- [ ] Integração n8n para e-mail e push
- [ ] Módulo admin: cadastros, permissões, QR Codes, relatórios
- [ ] Configurações do condomínio via painel

### Fase 7 — Expansão futura (pós-entrega)
- [ ] Multi-condomínio
- [ ] Integração com cancela ou interfone
- [ ] Notificações via WhatsApp
- [ ] App nativo (React Native) para o módulo visitante

---

## 9. Decisões de projeto em aberto

| Decisão | Opções | Recomendação |
|---|---|---|
| QR Code único ou por portão | Único (simples) / Por portão (rota precisa) | Por portão se tiver mapa interno ativo |
| QR Code estático ou dinâmico | Estático (simples) / Dinâmico (flexível) | Estático no MVP; dinâmico na expansão |
| Segurança do QR Code público | URL aberta / Token de sessão com validade | Token de sessão para maior controle |
| Notificação do morador na entrada | Sempre / Configurável por morador | Configurável — evita excesso de alertas |
| Armazenamento do CPF | Texto puro / Hash com salt | Hash com salt — conformidade LGPD |
| Tiles do mapa interno | OpenStreetMap online / Tiles locais offline | OSM online no MVP; local no Fase 3+ |

---

## 10. Requisitos não-funcionais

- **Desempenho:** carregamento inicial do módulo visitante abaixo de 3s em conexão 3G
- **Offline:** módulo visitante deve funcionar com sinal fraco (Service Worker com cache de quadras e lotes)
- **Acessibilidade:** contraste mínimo WCAG AA em todas as telas; área de toque mínima de 48px
- **LGPD:** CPF armazenado com hash; exibido com máscara nos painéis; dados de visita retidos por no máximo 12 meses
- **Segurança:** autenticação JWT para porteiro, morador e admin; módulo visitante sem autenticação, apenas CPF como identificador
- **Escalabilidade:** modelo multi-condomínio desde o schema inicial para evitar refatoração futura
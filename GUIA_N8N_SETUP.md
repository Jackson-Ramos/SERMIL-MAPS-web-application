# Guia de Setup — n8n + Oracle (Fase 6)

> Execute este guia **uma única vez** após o primeiro `docker compose up --build`.  
> Em execuções futuras o estado persiste nos volumes `sermil_oracle_data` e `sermil_n8n_data`.

---

## Pré-requisito — Gerar o hash de senha real

O arquivo `docker/oracle/init/02_seed.sql` contém um hash de teste.  
Antes de subir o stack, gere o hash correto para a senha que deseja usar:

```bash
# Na raiz do projeto (requer Node 20+):
node -e "const b=require('bcryptjs'); console.log(b.hashSync('Sermil@2026', 10));"
```

Abra [docker/oracle/init/02_seed.sql](docker/oracle/init/02_seed.sql), localize as duas linhas com  
`'$2b$10$92IXUNpkjO0rOQ5byMi...'` e substitua pelo hash gerado no comando acima.

---

## Passo 1 — Copiar o .env e subir o stack

```bash
# 1. Copiar o template de ambiente
cp .env.example .env

# 2. Editar as senhas (opcional em dev, obrigatório em produção)
# Abra o .env e altere JWT_SECRET, N8N_WEBHOOK_SECRET e as senhas do Oracle

# 3. Subir todos os containers
docker compose up --build
```

> **Primeira execução:** o Oracle XE leva 2 a 4 minutos para inicializar e rodar os scripts SQL.  
> Aguarde a mensagem `DATABASE IS READY TO USE!` no log do container `sermil_oracle`.

---

## Passo 2 — Monitorar a inicialização

Em um segundo terminal, acompanhe os logs de cada serviço:

```bash
# Ver todos os containers de uma vez
docker compose logs -f

# Ou filtrar por serviço
docker compose logs -f oracle
docker compose logs -f n8n
docker compose logs -f backend
```

Aguarde até que todos os health checks fiquem `healthy`:

```bash
docker compose ps
```

Saída esperada quando tudo estiver pronto:

```
NAME               STATUS
sermil_oracle      Up X minutes (healthy)
sermil_n8n         Up X minutes (healthy)
sermil_backend     Up X minutes (healthy)
sermil_frontend    Up X minutes
```

---

## Passo 3 — Acessar o painel do n8n

Abra no navegador: **http://localhost:5678**

- **Usuário:** valor de `N8N_USER` no seu `.env` (padrão: `admin`)
- **Senha:** valor de `N8N_PASSWORD` no seu `.env` (padrão: `n8nAdmin123`)

---

## Passo 4 — Criar a credential Oracle

> O nome da credential deve ser exatamente **"Oracle SERMIL"** — é o nome referenciado em todos os workflows importados.

1. No menu lateral, clique em **Credentials**
2. Clique em **+ Add Credential**
3. Busque por **Oracle Database** e selecione
4. Preencha os campos:

| Campo           | Valor                     |
|-----------------|---------------------------|
| **Host**        | `oracle`                  |
| **Port**        | `1521`                    |
| **Service Name**| `XEPDB1`                  |
| **User**        | `sermil`                  |
| **Password**    | valor de `ORACLE_APP_PASSWORD` no `.env` |

5. Clique em **Test** — deve aparecer `Connection successful`
6. Altere o **Name** para exatamente: `Oracle SERMIL`
7. Clique em **Save**

---

## Passo 5 — Verificar os workflows importados

1. No menu lateral, clique em **Workflows**
2. Você deve ver 8 workflows listados:

| Workflow | Webhooks |
|---|---|
| SERMIL — Condominios | 4 |
| SERMIL — Quadras | 3 |
| SERMIL — Lotes | 4 |
| SERMIL — Moradores | 4 |
| SERMIL — Usuarios | 6 |
| SERMIL — Visitas | 4 |
| SERMIL — QR Codes | 4 |
| SERMIL — Cron Expiração | 1 cron |

> Se os workflows **não aparecerem**, importe manualmente:
> ```bash
> docker exec sermil_n8n n8n import:workflow --separate --input=/home/node/workflows/
> ```
> Depois recarregue a página do n8n.

---

## Passo 6 — Vincular a credential em cada workflow

Após a importação automática, os nós Oracle estarão com a credential pendente (ícone de aviso amarelo). Para cada workflow:

1. Abra o workflow
2. Clique em qualquer nó **Oracle** (fundo vermelho/amarelo)
3. No campo **Credential**, selecione **Oracle SERMIL**
4. O n8n aplica a mesma credential a todos os nós Oracle do workflow automaticamente se tiverem o mesmo tipo

> **Atalho:** O n8n permite vincular a credential em lote. Abra o workflow, pressione `Ctrl+A` para selecionar todos os nós, depois clique em um nó Oracle e selecione a credential — ela será aplicada a todos os nós Oracle selecionados.

---

## Passo 7 — Ativar todos os workflows

Por padrão, workflows importados ficam **inativos** (toggle cinza no canto superior direito).

Para cada um dos 8 workflows:
1. Abra o workflow
2. Clique no toggle **Inactive → Active** (canto superior direito)
3. Confirme na janela de diálogo

Ou ative todos de uma vez via CLI:

```bash
docker exec sermil_n8n n8n update:workflow --all --active=true
```

---

## Passo 8 — Testar os webhooks

### 8.1 Teste direto no n8n (sem autenticação)

Com o workflow ativo, abra o workflow **SERMIL — Quadras**, clique em  
**GET Quadras** → botão **Test step**. Cole o JSON:

```json
{ "body": { "cond_id": 1 } }
```

O resultado deve exibir as 4 quadras do seed (A, B, C, D).

---

### 8.2 Teste via backend (fluxo completo)

**Obter token JWT:**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sermilmaps.com", "senha": "Sermil@2026"}' \
  | jq .
```

Saída esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@sermilmaps.com",
    "role": "admin",
    "cond_id": 1,
    "ativo": true
  }
}
```

Salve o token:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Testar as principais rotas:**

```bash
# Listar quadras
curl -s http://localhost:3000/api/quadras?cond_id=1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Listar moradores
curl -s http://localhost:3000/api/moradores?cond_id=1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Criar uma visita manualmente
curl -s -X POST http://localhost:3000/api/visita/iniciar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lote_id": 1,
    "cpf": "111.222.333-44",
    "nome_visitante": "João Teste",
    "quadra": "A",
    "lote": "01",
    "app_navegacao": "interno"
  }' | jq .

# Listar visitas ativas
curl -s "http://localhost:3000/api/visitas/ativas?cond_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Listar QR Codes
curl -s "http://localhost:3000/api/qrcodes?cond_id=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 8.3 Testar a aplicação no navegador

Acesse **http://localhost:3000** e verifique:

- [ ] Tela de login funciona com `admin@sermilmaps.com` / `Sermil@2026`
- [ ] Dashboard Admin carrega com dados reais (não mock)
- [ ] Quadras e lotes aparecem na listagem
- [ ] Criar uma nova quadra funciona
- [ ] Painel do Porteiro mostra visitas ativas
- [ ] Registro manual de visita cria registro real no banco
- [ ] Cron de expiração executa a cada 5 min (verificar no n8n: aba Executions)

---

## Passo 9 — Verificar o banco Oracle diretamente (opcional)

Para inspecionar os dados via SQL sem precisar de Oracle SQL Developer:

```bash
# Abrir sqlplus dentro do container
docker exec -it sermil_oracle sqlplus sermil/SermilApp1234@XEPDB1

# Dentro do sqlplus:
SELECT * FROM quadras;
SELECT * FROM usuarios;
SELECT * FROM visitas WHERE status = 'ativa';
EXIT;
```

---

## Troubleshooting

### Oracle não inicializa (container para de fazer healthcheck)

```bash
# Ver os logs de inicialização do Oracle
docker logs sermil_oracle --tail 100

# Se os scripts SQL falharam, destrua o volume e recomece
# ATENÇÃO: isso apaga todos os dados
docker compose down -v
docker compose up --build
```

### n8n não conecta ao Oracle

```bash
# Verificar se o Oracle está acessível a partir do container n8n
docker exec sermil_n8n node -e "
  require('net').createConnection(1521, 'oracle')
    .on('connect', () => { console.log('Oracle acessível'); process.exit(0); })
    .on('error', e => { console.error('Falha:', e.message); process.exit(1); });
"
```

### Workflows não foram importados automaticamente

```bash
# Importar manualmente e reiniciar o n8n
docker exec sermil_n8n n8n import:workflow --separate --input=/home/node/workflows/
docker restart sermil_n8n
```

### Backend retorna 502 (n8n não responde)

```bash
# Verificar se o n8n está healthy
docker compose ps n8n

# Testar o webhook diretamente (deve retornar JSON, não erro de conexão)
docker exec sermil_backend curl -s -X POST http://n8n:5678/webhook/quadras/list \
  -H "Content-Type: application/json" \
  -d '{"cond_id": 1}'
```

### Frontend mostra dados mock (VITE_USE_MOCK ainda ativo)

O `.env` do projeto ainda tem `VITE_USE_MOCK=true`. Essa variável é sobrescrita  
pelo `--build-arg` do docker-compose, então **dentro do Docker o mock está desativado**.  
Se você está rodando o frontend fora do Docker (`pnpm dev`), edite o `.env`:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
```

---

## Exportar workflows após alterações

Sempre que modificar um workflow no n8n, exporte e commite no git:

```bash
docker exec sermil_n8n n8n export:workflow \
  --all \
  --output=/home/node/workflows/

# Os arquivos ficam no volume montado — copie para o host:
docker cp sermil_n8n:/home/node/workflows/. ./docker/n8n/workflows/

# Commite
git add docker/n8n/workflows/
git commit -m "chore: atualiza workflows n8n"
```

---

## Checklist final

- [ ] `docker compose ps` mostra todos os containers como `healthy`
- [ ] Credential **Oracle SERMIL** criada e testada com sucesso no n8n
- [ ] Os 8 workflows estão **ativos** no n8n
- [ ] Login via `http://localhost:3000` funciona
- [ ] Dados do seed (quadras A/B/C/D, moradores, QR codes) aparecem na UI
- [ ] Criação de visita registra na tabela `VISITAS` do Oracle
- [ ] Cron de expiração aparece em execução na aba **Executions** do n8n

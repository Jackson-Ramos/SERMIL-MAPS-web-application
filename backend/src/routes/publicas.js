const router = require('express').Router();
const { db, transform } = require('../db');

// ────────────────────────────────────────────────────────────────────────────
// Endpoints públicos consumidos pelo visitante (sem autenticação).
// Apenas operações de leitura + confirmação de visita pré-registrada.
// ────────────────────────────────────────────────────────────────────────────

router.get('/condominios/:id', (req, res, next) => {
  try {
    const row = db.prepare(
      'SELECT id, nome, cidade, estado, ramal_portaria FROM condominios WHERE id = ?'
    ).get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Condomínio não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.get('/condominios/:id/configuracoes', (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT cond_id, tempo_maximo_visita,
             mapa_interno_ativo, google_maps_ativo, waze_ativo,
             ramal_flutuante_ativo, expiracao_automatica_ativa
        FROM configuracoes
       WHERE cond_id = ?
    `).get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Configurações não encontradas' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.get('/quadras', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id);
    if (!cond_id) return res.status(400).json({ error: 'cond_id obrigatório' });
    const rows = db.prepare(
      'SELECT id, cond_id, nome FROM quadras WHERE cond_id = ? ORDER BY nome'
    ).all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.get('/lotes', (req, res, next) => {
  try {
    const quadra_id = Number(req.query.quadra_id);
    if (!quadra_id) return res.status(400).json({ error: 'quadra_id obrigatório' });
    const rows = db.prepare(`
      SELECT l.id, l.quadra_id, l.numero, l.latitude, l.longitude,
             m.nome  AS nome_morador,
             m.ramal AS ramal
        FROM lotes l
        LEFT JOIN moradores m ON m.lote_id = l.id
       WHERE l.quadra_id = ?
       ORDER BY l.numero
    `).all(quadra_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

// Encerramento da visita pelo próprio visitante (botão "Cheguei").
// Idempotente — aceitar repetição sem erro pra UX no celular.
router.post('/visita/encerrar', (req, res, next) => {
  try {
    const visitaId = Number(req.body.visita_id);
    if (!visitaId) {
      return res.status(400).json({ error: 'visita_id é obrigatório' });
    }

    const visita = db.prepare('SELECT * FROM visitas WHERE id = ?').get(visitaId);
    if (!visita) return res.status(404).json({ error: 'Visita não encontrada' });

    if (visita.status === 'encerrada') {
      return res.json(transform(visita));
    }

    db.prepare(`
      UPDATE visitas
         SET horario_saida    = datetime('now'),
             status           = 'encerrada',
             duracao_minutos  = CASE
               WHEN horario_entrada IS NULL THEN duracao_minutos
               ELSE CAST(
                 (julianday('now') - julianday(horario_entrada)) * 1440 + 0.5
                 AS INTEGER
               )
             END,
             observacoes      = COALESCE(?, observacoes)
       WHERE id = ?
    `).run(req.body.observacoes ?? null, visitaId);

    const row = db.prepare('SELECT * FROM visitas WHERE id = ?').get(visitaId);
    res.json(transform(row));
  } catch (err) { next(err); }
});

// Confirmação da visita pelo visitante ao escanear o QR Code do porteiro.
// Retorna a visita já com dados do lote e do morador de destino (latitude,
// longitude, ramal, nome) para que o app do visitante possa orientá-lo
// e oferecer o botão de ligar.
router.post('/visita/confirmar', (req, res, next) => {
  try {
    const visitaId = Number(req.body.visita_id);
    if (!visitaId) {
      return res.status(400).json({ error: 'visita_id é obrigatório' });
    }

    const visita = db.prepare('SELECT * FROM visitas WHERE id = ?').get(visitaId);
    if (!visita) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (visita.status === 'pendente') {
      db.prepare(`
        UPDATE visitas
           SET horario_entrada = datetime('now'),
               status          = 'ativa',
               rota            = COALESCE(?, rota),
               app_navegacao   = COALESCE(?, app_navegacao)
         WHERE id = ?
      `).run(
        req.body.rota ? JSON.stringify(req.body.rota) : null,
        req.body.app_navegacao || null,
        visitaId,
      );
    }

    const row = db.prepare(`
      SELECT v.*,
             l.latitude     AS lote_latitude,
             l.longitude    AS lote_longitude,
             m.nome         AS lote_nome_morador,
             m.ramal        AS lote_ramal
        FROM visitas v
        LEFT JOIN lotes     l ON l.id      = v.lote_id
        LEFT JOIN moradores m ON m.lote_id = v.lote_id
       WHERE v.id = ?
    `).get(visitaId);
    res.json(transform(row));
  } catch (err) { next(err); }
});

// ─── Convite enviado pelo morador a um convidado ──────────────────────────
// Fluxo: morador gera um link com token único → envia ao convidado →
// convidado abre o link, preenche o nome (e opcionalmente CPF/telefone) →
// link fica desabilitado (uso único).

router.get('/convite/:token', (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT c.id, c.link_status, c.nome, c.preenchido_em,
             m.nome    AS morador_nome,
             q.nome    AS quadra_nome,
             l.numero  AS lote_numero,
             cond.nome AS condominio_nome,
             e.id          AS evento_id,
             e.titulo      AS evento_titulo,
             e.local_tipo  AS evento_local_tipo,
             e.local_nome  AS evento_local_nome,
             e.data_inicio AS evento_data_inicio,
             e.data_fim    AS evento_data_fim,
             e.observacoes AS evento_observacoes
        FROM convidados c
        JOIN moradores  m    ON m.id   = c.morador_id
        JOIN lotes      l    ON l.id   = m.lote_id
        JOIN quadras    q    ON q.id   = l.quadra_id
        JOIN condominios cond ON cond.id = c.cond_id
        LEFT JOIN eventos e  ON e.id   = c.evento_id
       WHERE c.link_token = ?
    `).get(req.params.token);

    if (!row) return res.status(404).json({ error: 'Convite não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.post('/convite/:token', (req, res, next) => {
  try {
    const nome = (req.body.nome || '').trim();
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

    const convite = db.prepare(
      'SELECT id, link_status FROM convidados WHERE link_token = ?'
    ).get(req.params.token);
    if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });
    if (convite.link_status !== 'pendente') {
      return res.status(409).json({ error: 'Este link já foi utilizado' });
    }

    db.prepare(`
      UPDATE convidados
         SET nome          = ?,
             cpf           = COALESCE(?, cpf),
             telefone      = COALESCE(?, telefone),
             link_status   = 'preenchido',
             preenchido_em = datetime('now')
       WHERE id = ?
    `).run(
      nome,
      req.body.cpf      || null,
      req.body.telefone || null,
      convite.id,
    );

    const row = db.prepare('SELECT id, nome, link_status, preenchido_em FROM convidados WHERE id = ?')
      .get(convite.id);
    res.json(transform(row));
  } catch (err) { next(err); }
});

module.exports = router;

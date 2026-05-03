const router = require('express').Router();
const crypto = require('crypto');
const { db, transform } = require('../db');

// ────────────────────────────────────────────────────────────────────────────
// Endpoints do módulo do morador. Todas as rotas operam restritas ao
// próprio morador autenticado (req.user.id → moradores.user_id).
// ────────────────────────────────────────────────────────────────────────────

function moradorAtual(req, res) {
  if (req.user.role !== 'morador') {
    res.status(403).json({ error: 'Acesso restrito a moradores' });
    return null;
  }
  const row = db.prepare(
    'SELECT * FROM moradores WHERE user_id = ?'
  ).get(req.user.id);
  if (!row) {
    res.status(404).json({ error: 'Morador vinculado ao usuário não encontrado' });
    return null;
  }
  return row;
}

// ─── Agendamentos ──────────────────────────────────────────────────────────

router.get('/agendamentos', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    const rows = db.prepare(`
      SELECT a.*,
             q.nome    AS quadra,
             l.numero  AS lote
        FROM agendamentos a
        JOIN lotes   l ON l.id = a.lote_id
        JOIN quadras q ON q.id = l.quadra_id
       WHERE a.morador_id = ?
       ORDER BY a.data_prevista DESC
    `).all(m.id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/agendamentos', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;

    const nome = (req.body.nome_visitante || '').trim();
    const data = (req.body.data_prevista || '').trim();
    if (!nome) return res.status(400).json({ error: 'nome_visitante é obrigatório' });
    if (!data) return res.status(400).json({ error: 'data_prevista é obrigatória' });

    const info = db.prepare(`
      INSERT INTO agendamentos (
        morador_id, cond_id, lote_id, convidado_id,
        nome_visitante, cpf, data_prevista, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.id,
      Number(req.user.cond_id),
      m.lote_id,
      req.body.convidado_id ? Number(req.body.convidado_id) : null,
      nome,
      req.body.cpf || null,
      data,
      req.body.observacoes || null,
    );
    const row = db.prepare('SELECT * FROM agendamentos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/agendamentos/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;

    const b = req.body;
    db.prepare(`
      UPDATE agendamentos
         SET nome_visitante = COALESCE(?, nome_visitante),
             cpf            = COALESCE(?, cpf),
             data_prevista  = COALESCE(?, data_prevista),
             observacoes    = COALESCE(?, observacoes),
             status         = COALESCE(?, status)
       WHERE id = ? AND morador_id = ?
    `).run(
      b.nome_visitante ?? null,
      b.cpf            ?? null,
      b.data_prevista  ?? null,
      b.observacoes    ?? null,
      b.status         ?? null,
      Number(req.params.id),
      m.id,
    );
    const row = db.prepare('SELECT * FROM agendamentos WHERE id = ? AND morador_id = ?')
      .get(Number(req.params.id), m.id);
    if (!row) return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.delete('/agendamentos/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    db.prepare('DELETE FROM agendamentos WHERE id = ? AND morador_id = ?')
      .run(Number(req.params.id), m.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Histórico de visitas do meu lote ───────────────────────────────────────

router.get('/historico', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    const limit = Number(req.query.limit || 100);
    const rows = db.prepare(`
      SELECT * FROM visitas
       WHERE lote_id = ? AND cond_id = ?
       ORDER BY COALESCE(horario_entrada, criado_em) DESC
       LIMIT ?
    `).all(m.lote_id, Number(req.user.cond_id), limit);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

// ─── Eventos ───────────────────────────────────────────────────────────────

// Contagens do morador (não lidos / pendentes) — usadas para badge no nav.
router.get('/eventos/contadores', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    const row = db.prepare(`
      SELECT
        SUM(CASE WHEN morador_ciente = 0 THEN 1 ELSE 0 END) AS nao_lidos,
        SUM(CASE WHEN aprovacao_status = 'pendente' THEN 1 ELSE 0 END) AS pendentes,
        SUM(CASE WHEN morador_ciente = 0 AND aprovacao_status = 'aprovado'  THEN 1 ELSE 0 END) AS novos_aprovados,
        SUM(CASE WHEN morador_ciente = 0 AND aprovacao_status = 'rejeitado' THEN 1 ELSE 0 END) AS novos_rejeitados
        FROM eventos
       WHERE morador_id = ?
    `).get(m.id);
    res.json({
      nao_lidos:        Number(row?.nao_lidos        || 0),
      pendentes:        Number(row?.pendentes        || 0),
      novos_aprovados:  Number(row?.novos_aprovados  || 0),
      novos_rejeitados: Number(row?.novos_rejeitados || 0),
    });
  } catch (err) { next(err); }
});

// Marca um evento como ciente (morador viu a decisão).
router.post('/eventos/:id/ciente', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    db.prepare(
      'UPDATE eventos SET morador_ciente = 1 WHERE id = ? AND morador_id = ?'
    ).run(Number(req.params.id), m.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/eventos', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    const rows = db.prepare(`
      SELECT e.*,
             (SELECT COUNT(*) FROM convidados c WHERE c.evento_id = e.id) AS total_convidados
        FROM eventos e
       WHERE e.morador_id = ?
       ORDER BY e.data_inicio DESC
    `).all(m.id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.get('/eventos/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    const row = db.prepare(
      'SELECT * FROM eventos WHERE id = ? AND morador_id = ?'
    ).get(Number(req.params.id), m.id);
    if (!row) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.post('/eventos', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;

    const titulo     = (req.body.titulo || '').trim();
    const localTipo  = req.body.local_tipo;
    const dataInicio = req.body.data_inicio;
    if (!titulo) return res.status(400).json({ error: 'titulo é obrigatório' });
    if (!['residencia', 'area_comum'].includes(localTipo)) {
      return res.status(400).json({ error: 'local_tipo inválido' });
    }
    if (!dataInicio) return res.status(400).json({ error: 'data_inicio é obrigatória' });

    const localNome = localTipo === 'area_comum'
      ? (req.body.local_nome || '').trim() || null
      : null;

    const info = db.prepare(`
      INSERT INTO eventos (
        morador_id, cond_id, titulo, local_tipo, local_nome,
        data_inicio, data_fim, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.id,
      Number(req.user.cond_id),
      titulo,
      localTipo,
      localNome,
      dataInicio,
      req.body.data_fim    || null,
      req.body.observacoes || null,
    );
    const row = db.prepare('SELECT * FROM eventos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/eventos/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;

    const b = req.body;
    db.prepare(`
      UPDATE eventos
         SET titulo      = COALESCE(?, titulo),
             local_tipo  = COALESCE(?, local_tipo),
             local_nome  = COALESCE(?, local_nome),
             data_inicio = COALESCE(?, data_inicio),
             data_fim    = COALESCE(?, data_fim),
             observacoes = COALESCE(?, observacoes),
             status      = COALESCE(?, status)
       WHERE id = ? AND morador_id = ?
    `).run(
      b.titulo      ?? null,
      b.local_tipo  ?? null,
      b.local_nome  ?? null,
      b.data_inicio ?? null,
      b.data_fim    ?? null,
      b.observacoes ?? null,
      b.status      ?? null,
      Number(req.params.id),
      m.id,
    );
    const row = db.prepare('SELECT * FROM eventos WHERE id = ? AND morador_id = ?')
      .get(Number(req.params.id), m.id);
    if (!row) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.delete('/eventos/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    db.prepare('DELETE FROM eventos WHERE id = ? AND morador_id = ?')
      .run(Number(req.params.id), m.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Convidados (sempre escopados a um evento) ────────────────────────────

function eventoDoMorador(eventoId, moradorId) {
  return db.prepare('SELECT id FROM eventos WHERE id = ? AND morador_id = ?')
    .get(Number(eventoId), moradorId);
}

router.get('/eventos/:id/convidados', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    if (!eventoDoMorador(req.params.id, m.id)) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    const rows = db.prepare(
      'SELECT * FROM convidados WHERE evento_id = ? ORDER BY criado_em DESC'
    ).all(Number(req.params.id));
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/eventos/:id/convidados', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    if (!eventoDoMorador(req.params.id, m.id)) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const nome = (req.body.nome || '').trim();
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

    const info = db.prepare(`
      INSERT INTO convidados (
        morador_id, cond_id, evento_id, nome, cpf, telefone, observacoes, origem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')
    `).run(
      m.id,
      Number(req.user.cond_id),
      Number(req.params.id),
      nome,
      req.body.cpf      || null,
      req.body.telefone || null,
      req.body.observacoes || null,
    );
    const row = db.prepare('SELECT * FROM convidados WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.post('/eventos/:id/convidados/link', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    if (!eventoDoMorador(req.params.id, m.id)) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const info = db.prepare(`
      INSERT INTO convidados (
        morador_id, cond_id, evento_id, observacoes, origem, link_token, link_status
      ) VALUES (?, ?, ?, ?, 'link', ?, 'pendente')
    `).run(
      m.id,
      Number(req.user.cond_id),
      Number(req.params.id),
      req.body.observacoes || null,
      token,
    );
    const row = db.prepare('SELECT * FROM convidados WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/convidados/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;

    const b = req.body;
    db.prepare(`
      UPDATE convidados
         SET nome        = COALESCE(?, nome),
             cpf         = COALESCE(?, cpf),
             telefone    = COALESCE(?, telefone),
             observacoes = COALESCE(?, observacoes),
             link_status = COALESCE(?, link_status)
       WHERE id = ? AND morador_id = ?
    `).run(
      b.nome        ?? null,
      b.cpf         ?? null,
      b.telefone    ?? null,
      b.observacoes ?? null,
      b.link_status ?? null,
      Number(req.params.id),
      m.id,
    );
    const row = db.prepare('SELECT * FROM convidados WHERE id = ? AND morador_id = ?')
      .get(Number(req.params.id), m.id);
    if (!row) return res.status(404).json({ error: 'Convidado não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.delete('/convidados/:id', (req, res, next) => {
  try {
    const m = moradorAtual(req, res);
    if (!m) return;
    db.prepare('DELETE FROM convidados WHERE id = ? AND morador_id = ?')
      .run(Number(req.params.id), m.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

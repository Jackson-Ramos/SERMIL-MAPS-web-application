const router = require('express').Router();
const { db, transform } = require('../db');

// ────────────────────────────────────────────────────────────────────────────
// Eventos (visão administrativa). Exige role admin.
// ────────────────────────────────────────────────────────────────────────────

function exigirAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito ao administrador' });
    return false;
  }
  return true;
}

router.get('/', (req, res, next) => {
  try {
    if (!exigirAdmin(req, res)) return;
    const filtros = ['e.cond_id = ?'];
    const params  = [Number(req.user.cond_id)];
    if (req.query.aprovacao_status) {
      filtros.push('e.aprovacao_status = ?');
      params.push(req.query.aprovacao_status);
    }

    const rows = db.prepare(`
      SELECT e.*,
             m.nome    AS morador_nome,
             m.ramal   AS morador_ramal,
             q.nome    AS quadra,
             l.numero  AS lote,
             u.nome    AS revisor_nome,
             (SELECT COUNT(*) FROM convidados c WHERE c.evento_id = e.id) AS total_convidados
        FROM eventos e
        JOIN moradores m ON m.id = e.morador_id
        JOIN lotes     l ON l.id = m.lote_id
        JOIN quadras   q ON q.id = l.quadra_id
        LEFT JOIN usuarios u ON u.id = e.revisado_por
       WHERE ${filtros.join(' AND ')}
       ORDER BY
         CASE e.aprovacao_status
           WHEN 'pendente'   THEN 0
           WHEN 'aprovado'   THEN 1
           WHEN 'rejeitado'  THEN 2
         END,
         e.data_inicio DESC
    `).all(...params);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.get('/contadores', (req, res, next) => {
  try {
    if (!exigirAdmin(req, res)) return;
    const row = db.prepare(`
      SELECT
        SUM(CASE WHEN aprovacao_status = 'pendente'  THEN 1 ELSE 0 END) AS pendente,
        SUM(CASE WHEN aprovacao_status = 'aprovado'  THEN 1 ELSE 0 END) AS aprovado,
        SUM(CASE WHEN aprovacao_status = 'rejeitado' THEN 1 ELSE 0 END) AS rejeitado
        FROM eventos
       WHERE cond_id = ?
    `).get(Number(req.user.cond_id));
    res.json({
      pendente:  Number(row?.pendente  || 0),
      aprovado:  Number(row?.aprovado  || 0),
      rejeitado: Number(row?.rejeitado || 0),
    });
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    if (!exigirAdmin(req, res)) return;
    const row = db.prepare(`
      SELECT e.*,
             m.nome   AS morador_nome,
             m.ramal  AS morador_ramal,
             q.nome   AS quadra,
             l.numero AS lote,
             u.nome   AS revisor_nome
        FROM eventos e
        JOIN moradores m ON m.id = e.morador_id
        JOIN lotes     l ON l.id = m.lote_id
        JOIN quadras   q ON q.id = l.quadra_id
        LEFT JOIN usuarios u ON u.id = e.revisado_por
       WHERE e.id = ? AND e.cond_id = ?
    `).get(Number(req.params.id), Number(req.user.cond_id));

    if (!row) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/:id/aprovacao', (req, res, next) => {
  try {
    if (!exigirAdmin(req, res)) return;

    const decisao = req.body.aprovacao_status;
    if (!['aprovado', 'rejeitado', 'pendente'].includes(decisao)) {
      return res.status(400).json({ error: 'aprovacao_status inválido' });
    }

    const motivo = decisao === 'rejeitado'
      ? (req.body.motivo_rejeicao || '').trim()
      : null;

    if (decisao === 'rejeitado' && !motivo) {
      return res.status(400).json({ error: 'motivo_rejeicao é obrigatório ao rejeitar' });
    }

    db.prepare(`
      UPDATE eventos
         SET aprovacao_status = ?,
             motivo_rejeicao  = ?,
             revisado_por     = ?,
             revisado_em      = datetime('now'),
             morador_ciente   = 0
       WHERE id = ? AND cond_id = ?
    `).run(
      decisao,
      motivo,
      Number(req.user.id),
      Number(req.params.id),
      Number(req.user.cond_id),
    );

    const row = db.prepare(`
      SELECT e.*, u.nome AS revisor_nome
        FROM eventos e
        LEFT JOIN usuarios u ON u.id = e.revisado_por
       WHERE e.id = ? AND e.cond_id = ?
    `).get(Number(req.params.id), Number(req.user.cond_id));

    if (!row) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

module.exports = router;

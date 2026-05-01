const router = require('express').Router();
const { db, transform } = require('../db');

// Confirmação da visita pelo visitante ao escanear o QR Code gerado
// pelo porteiro. Atualiza o registro pendente com o horario_entrada
// real (momento do scan) e marca como ativa.
router.post('/confirmar', (req, res, next) => {
  try {
    const visitaId = Number(req.body.visita_id);
    if (!visitaId) {
      return res.status(400).json({ error: 'visita_id é obrigatório' });
    }

    const visita = db.prepare('SELECT * FROM visitas WHERE id = ?').get(visitaId);
    if (!visita) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    // Idempotente: se já foi confirmada, retorna o registro como está.
    if (visita.status !== 'pendente') {
      return res.json(transform(visita));
    }

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

    const row = db.prepare('SELECT * FROM visitas WHERE id = ?').get(visitaId);
    res.json(transform(row));
  } catch (err) { next(err); }
});

module.exports = router;

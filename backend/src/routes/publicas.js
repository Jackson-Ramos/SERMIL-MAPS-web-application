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

// Confirmação da visita pelo visitante ao escanear o QR Code do porteiro.
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

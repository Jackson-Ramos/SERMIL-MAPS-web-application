const router = require('express').Router();
const { db, transform } = require('../db');

router.get('/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM condominios WHERE id = ?').get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Condomínio não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const { nome, cidade, estado, ramal_portaria } = req.body;
    db.prepare(`
      UPDATE condominios
         SET nome = COALESCE(?, nome),
             cidade = COALESCE(?, cidade),
             estado = COALESCE(?, estado),
             ramal_portaria = COALESCE(?, ramal_portaria)
       WHERE id = ?
    `).run(nome ?? null, cidade ?? null, estado ?? null, ramal_portaria ?? null, Number(req.params.id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id/configuracoes', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM configuracoes WHERE cond_id = ?').get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Configurações não encontradas' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id/configuracoes', (req, res, next) => {
  try {
    const cond_id = Number(req.params.id);
    const b = req.body;

    const toInt = v => (v === true || v === 1 || v === '1') ? 1 : 0;

    db.prepare(`
      UPDATE configuracoes
         SET tempo_maximo_visita        = COALESCE(?, tempo_maximo_visita),
             mapa_interno_ativo         = COALESCE(?, mapa_interno_ativo),
             google_maps_ativo          = COALESCE(?, google_maps_ativo),
             waze_ativo                 = COALESCE(?, waze_ativo),
             ramal_flutuante_ativo      = COALESCE(?, ramal_flutuante_ativo),
             expiracao_automatica_ativa = COALESCE(?, expiracao_automatica_ativa)
       WHERE cond_id = ?
    `).run(
      b.tempo_maximo_visita        ?? null,
      b.mapa_interno_ativo         === undefined ? null : toInt(b.mapa_interno_ativo),
      b.google_maps_ativo          === undefined ? null : toInt(b.google_maps_ativo),
      b.waze_ativo                 === undefined ? null : toInt(b.waze_ativo),
      b.ramal_flutuante_ativo      === undefined ? null : toInt(b.ramal_flutuante_ativo),
      b.expiracao_automatica_ativa === undefined ? null : toInt(b.expiracao_automatica_ativa),
      cond_id
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

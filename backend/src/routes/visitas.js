const router = require('express').Router();
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

router.post('/iniciar', async (req, res, next) => {
  try {
    const rows = await callN8n('visitas/iniciar', {
      cond_id:       Number(req.user.cond_id),
      lote_id:       Number(req.body.lote_id),
      cpf:           req.body.cpf,
      nome_visitante: req.body.nome_visitante || null,
      quadra:        req.body.quadra,
      lote:          req.body.lote,
      app_navegacao: req.body.app_navegacao || 'interno',
      rota:          req.body.rota          || null,
      porteiro_id:   req.user.role === 'porteiro' ? req.user.id : null,
    });
    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.patch('/encerrar', async (req, res, next) => {
  try {
    await callN8n('visitas/encerrar', {
      id:          Number(req.body.id),
      cond_id:     Number(req.user.cond_id),
      observacoes: req.body.observacoes || null,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/ativas', async (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = await callN8n('visitas/ativas', { cond_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.get('/historico', async (req, res, next) => {
  try {
    const rows = await callN8n('visitas/historico', {
      cond_id:     Number(req.query.cond_id || req.user.cond_id),
      cpf:         req.query.cpf        || null,
      quadra:      req.query.quadra     || null,
      status:      req.query.status     || null,
      data_inicio: req.query.data_inicio || null,
      data_fim:    req.query.data_fim    || null,
      limit:       Number(req.query.limit || 50),
    });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

module.exports = router;

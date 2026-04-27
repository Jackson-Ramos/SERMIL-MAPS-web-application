const router = require('express').Router();
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

router.get('/', async (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = await callN8n('moradores/list', { cond_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const rows = await callN8n('moradores/create', {
      lote_id: Number(req.body.lote_id),
      nome:    req.body.nome,
      cpf:     req.body.cpf     || null,
      ramal:   req.body.ramal   || null,
    });
    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await callN8n('moradores/update', { id: Number(req.params.id), ...req.body });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await callN8n('moradores/delete', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

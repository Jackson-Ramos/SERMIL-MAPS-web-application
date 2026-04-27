const router = require('express').Router();
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

router.get('/:id', async (req, res, next) => {
  try {
    const rows = await callN8n('condominios/get', { id: Number(req.params.id) });
    if (!rows?.length) return res.status(404).json({ error: 'Condomínio não encontrado' });
    res.json(transform(rows[0]));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await callN8n('condominios/update', { id: Number(req.params.id), ...req.body });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:id/configuracoes', async (req, res, next) => {
  try {
    const rows = await callN8n('condominios/configuracoes/get', { cond_id: Number(req.params.id) });
    if (!rows?.length) return res.status(404).json({ error: 'Configurações não encontradas' });
    res.json(transform(rows[0]));
  } catch (err) { next(err); }
});

router.put('/:id/configuracoes', async (req, res, next) => {
  try {
    await callN8n('condominios/configuracoes/update', {
      cond_id: Number(req.params.id),
      ...req.body,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

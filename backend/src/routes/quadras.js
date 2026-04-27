const router = require('express').Router();
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

router.get('/', async (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = await callN8n('quadras/list', { cond_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const cond_id = req.body.cond_id || req.user.cond_id;
    const rows = await callN8n('quadras/create', { ...req.body, cond_id: Number(cond_id) });
    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await callN8n('quadras/update', {
      id:      Number(req.params.id),
      cond_id: Number(req.user.cond_id),
      ...req.body,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

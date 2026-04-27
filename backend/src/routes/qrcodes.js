const router = require('express').Router();
const crypto = require('crypto');
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.get('/', async (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = await callN8n('qrcodes/list', { cond_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const token = crypto.randomUUID().replace(/-/g, '');
    const url   = `${BASE_URL}/v/entrada?token=${token}`;

    let expira_em = null;
    if (req.body.expiracao_horas) {
      const ms = Number(req.body.expiracao_horas) * 3_600_000;
      expira_em = new Date(Date.now() + ms).toISOString();
    }

    const rows = await callN8n('qrcodes/create', {
      cond_id:    Number(req.user.cond_id),
      criado_por: Number(req.user.id),
      nome_portao: req.body.nome_portao,
      token,
      url,
      uso_unico: req.body.uso_unico ? 1 : 0,
      expira_em,
    });

    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await callN8n('qrcodes/revoke', {
      id:      Number(req.params.id),
      cond_id: Number(req.user.cond_id),
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/validate', async (req, res, next) => {
  try {
    const rows = await callN8n('qrcodes/validate', { token: req.body.token });
    if (!rows?.length) return res.status(404).json({ error: 'Token inválido ou expirado' });
    res.json(transform(rows[0]));
  } catch (err) { next(err); }
});

module.exports = router;

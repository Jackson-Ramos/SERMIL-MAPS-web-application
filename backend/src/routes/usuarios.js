const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

router.get('/', async (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = await callN8n('usuarios/list', { cond_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.senha) {
      return res.status(400).json({ error: 'Senha é obrigatória ao criar usuário' });
    }

    const senha_hash = await bcrypt.hash(req.body.senha, 10);
    const rows = await callN8n('usuarios/create', {
      cond_id:    Number(req.body.cond_id || req.user.cond_id),
      nome:       req.body.nome,
      email:      req.body.email,
      senha_hash,
      role:       req.body.role,
    });
    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = {
      id:      Number(req.params.id),
      cond_id: Number(req.user.cond_id),
      nome:    req.body.nome,
      email:   req.body.email,
      role:    req.body.role,
    };

    if (req.body.senha) {
      payload.senha_hash = await bcrypt.hash(req.body.senha, 10);
    }

    await callN8n('usuarios/update', payload);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/toggle-ativo', async (req, res, next) => {
  try {
    await callN8n('usuarios/toggle-ativo', {
      id:      Number(req.params.id),
      cond_id: Number(req.user.cond_id),
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await callN8n('usuarios/delete', {
      id:      Number(req.params.id),
      cond_id: Number(req.user.cond_id),
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

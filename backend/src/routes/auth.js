const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { callN8n }  = require('../n8nClient');
const { transform } = require('../transform');

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const cond_id = Number(process.env.COND_ID || 1);
    const rows = await callN8n('usuarios/auth', { email, cond_id });

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = transform(rows[0]);

    if (!user.ativo) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const payload = {
      id:      user.id,
      nome:    user.nome,
      email:   user.email,
      role:    user.role,
      cond_id: user.cond_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    const { senha_hash, ...usuario } = user;
    res.json({ token, usuario });
  } catch (err) {
    next(err);
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token não informado' });
  try {
    const user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;

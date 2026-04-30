const router = require('express').Router();
const crypto = require('crypto');
const { db, transform } = require('../db');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.get('/', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = db.prepare(
      'SELECT * FROM qr_codes WHERE cond_id = ? ORDER BY criado_em DESC'
    ).all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const token = crypto.randomUUID().replace(/-/g, '');
    const url   = `${BASE_URL}/v/entrada?token=${token}`;

    let expira_em = null;
    if (req.body.expiracao_horas) {
      const ms = Number(req.body.expiracao_horas) * 3_600_000;
      expira_em = new Date(Date.now() + ms).toISOString();
    }

    const info = db.prepare(`
      INSERT INTO qr_codes (cond_id, criado_por, nome_portao, token, url, uso_unico, expira_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(req.user.cond_id),
      Number(req.user.id),
      req.body.nome_portao,
      token,
      url,
      req.body.uso_unico ? 1 : 0,
      expira_em,
    );

    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('UPDATE qr_codes SET ativo = 0 WHERE id = ? AND cond_id = ?')
      .run(Number(req.params.id), Number(req.user.cond_id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/validate', (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT * FROM qr_codes
       WHERE token = ? AND ativo = 1
         AND (expira_em IS NULL OR expira_em > datetime('now'))
    `).get(req.body.token);

    if (!row) return res.status(404).json({ error: 'Token inválido ou expirado' });

    db.prepare('UPDATE qr_codes SET usos = usos + 1 WHERE id = ?').run(row.id);

    res.json(transform(row));
  } catch (err) { next(err); }
});

module.exports = router;

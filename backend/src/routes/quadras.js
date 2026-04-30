const router = require('express').Router();
const { db, transform } = require('../db');

router.get('/', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = db.prepare('SELECT * FROM quadras WHERE cond_id = ? ORDER BY nome').all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const cond_id = Number(req.body.cond_id || req.user.cond_id);
    const info = db.prepare('INSERT INTO quadras (cond_id, nome) VALUES (?, ?)').run(cond_id, req.body.nome);
    const row  = db.prepare('SELECT * FROM quadras WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    db.prepare('UPDATE quadras SET nome = COALESCE(?, nome) WHERE id = ? AND cond_id = ?')
      .run(req.body.nome ?? null, Number(req.params.id), Number(req.user.cond_id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

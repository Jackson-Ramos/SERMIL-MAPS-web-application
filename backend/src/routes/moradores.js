const router = require('express').Router();
const { db, transform } = require('../db');

// Lista todos os moradores cujos lotes pertencem a quadras do condomínio.
router.get('/', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = db.prepare(`
      SELECT m.*
        FROM moradores m
        JOIN lotes   l ON l.id = m.lote_id
        JOIN quadras q ON q.id = l.quadra_id
       WHERE q.cond_id = ?
       ORDER BY m.nome
    `).all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const info = db.prepare(
      'INSERT INTO moradores (lote_id, nome, cpf, ramal, user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(
      Number(req.body.lote_id),
      req.body.nome,
      req.body.cpf   || null,
      req.body.ramal || null,
      req.body.user_id ? Number(req.body.user_id) : null,
    );
    const row = db.prepare('SELECT * FROM moradores WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE moradores
         SET nome    = COALESCE(?, nome),
             cpf     = COALESCE(?, cpf),
             ramal   = COALESCE(?, ramal),
             lote_id = COALESCE(?, lote_id),
             user_id = COALESCE(?, user_id)
       WHERE id = ?
    `).run(
      b.nome    ?? null,
      b.cpf     ?? null,
      b.ramal   ?? null,
      b.lote_id ?? null,
      b.user_id ?? null,
      Number(req.params.id),
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM moradores WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

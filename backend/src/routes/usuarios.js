const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { db, transform } = require('../db');

const COLUNAS = 'id, cond_id, nome, email, role, ativo, criado_em';

router.get('/', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = db.prepare(`
      SELECT ${COLUNAS}
        FROM usuarios
       WHERE cond_id = ?
       ORDER BY nome
    `).all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.senha) {
      return res.status(400).json({ error: 'Senha é obrigatória ao criar usuário' });
    }
    const senha_hash = await bcrypt.hash(req.body.senha, 10);

    const info = db.prepare(`
      INSERT INTO usuarios (cond_id, nome, email, senha_hash, role, ativo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      Number(req.body.cond_id || req.user.cond_id),
      req.body.nome,
      req.body.email,
      senha_hash,
      req.body.role,
    );
    const row = db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id      = Number(req.params.id);
    const cond_id = Number(req.user.cond_id);
    const senha_hash = req.body.senha ? await bcrypt.hash(req.body.senha, 10) : null;
    const ativo = req.body.ativo === undefined
      ? null
      : (req.body.ativo === true || req.body.ativo === 1 ? 1 : 0);

    db.prepare(`
      UPDATE usuarios
         SET nome       = COALESCE(?, nome),
             email      = COALESCE(?, email),
             role       = COALESCE(?, role),
             ativo      = COALESCE(?, ativo),
             senha_hash = COALESCE(?, senha_hash)
       WHERE id = ? AND cond_id = ?
    `).run(
      req.body.nome  ?? null,
      req.body.email ?? null,
      req.body.role  ?? null,
      ativo,
      senha_hash,
      id, cond_id,
    );

    const row = db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/:id/toggle-ativo', (req, res, next) => {
  try {
    const id      = Number(req.params.id);
    const cond_id = Number(req.user.cond_id);

    db.prepare(`
      UPDATE usuarios
         SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END
       WHERE id = ? AND cond_id = ?
    `).run(id, cond_id);

    const row = db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(transform(row));
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM usuarios WHERE id = ? AND cond_id = ?')
      .run(Number(req.params.id), Number(req.user.cond_id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

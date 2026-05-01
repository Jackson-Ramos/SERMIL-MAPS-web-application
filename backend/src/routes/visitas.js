const router = require('express').Router();
const { db, transform } = require('../db');

router.post('/iniciar', (req, res, next) => {
  try {
    const isPendente = req.body.pendente === true;
    const status = isPendente ? 'pendente' : 'ativa';
    const horarioEntrada = isPendente ? null : new Date().toISOString().replace('T', ' ').slice(0, 19);

    const info = db.prepare(`
      INSERT INTO visitas (
        cond_id, lote_id, cpf, nome_visitante,
        quadra, lote, app_navegacao, rota, porteiro_id,
        horario_entrada, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(req.user.cond_id),
      Number(req.body.lote_id),
      req.body.cpf,
      req.body.nome_visitante ?? null,
      req.body.quadra ?? '',
      req.body.lote ?? '',
      req.body.app_navegacao || 'interno',
      req.body.rota ? JSON.stringify(req.body.rota) : null,
      req.user.role === 'porteiro' ? req.user.id : null,
      horarioEntrada,
      status,
    );
    const row = db.prepare('SELECT * FROM visitas WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.patch('/encerrar', (req, res, next) => {
  try {
    db.prepare(`
      UPDATE visitas
         SET horario_saida = datetime('now'),
             status        = 'encerrada',
             observacoes   = COALESCE(?, observacoes)
       WHERE id = ? AND cond_id = ?
    `).run(
      req.body.observacoes ?? null,
      Number(req.body.visita_id ?? req.body.id),
      Number(req.user.cond_id),
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/ativas', (req, res, next) => {
  try {
    const cond_id = Number(req.query.cond_id || req.user.cond_id);
    const rows = db.prepare(`
      SELECT * FROM visitas
       WHERE cond_id = ? AND status = 'ativa'
       ORDER BY horario_entrada DESC
    `).all(cond_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.get('/historico', (req, res, next) => {
  try {
    const filtros = [];
    const params  = [];

    filtros.push('cond_id = ?');
    params.push(Number(req.query.cond_id || req.user.cond_id));

    if (req.query.cpf)         { filtros.push('cpf = ?');           params.push(req.query.cpf); }
    if (req.query.quadra)      { filtros.push('quadra = ?');        params.push(req.query.quadra); }
    if (req.query.status)      { filtros.push('status = ?');        params.push(req.query.status); }
    if (req.query.data_inicio) { filtros.push('horario_entrada >= ?'); params.push(req.query.data_inicio); }
    if (req.query.data_fim)    { filtros.push('horario_entrada <= ?'); params.push(req.query.data_fim); }

    const limit = Number(req.query.limit || 50);

    const rows = db.prepare(`
      SELECT * FROM visitas
       WHERE ${filtros.join(' AND ')}
       ORDER BY horario_entrada DESC
       LIMIT ?
    `).all(...params, limit);

    res.json(transform(rows));
  } catch (err) { next(err); }
});

module.exports = router;

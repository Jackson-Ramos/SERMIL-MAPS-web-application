const router = require('express').Router();
const multer = require('multer');
const { db, transform } = require('../db');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseCSV(buffer) {
  const text  = buffer.toString('utf-8');
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || null; });
    return row;
  });
}

router.get('/', (req, res, next) => {
  try {
    const quadra_id = Number(req.query.quadra_id);
    if (!quadra_id) return res.status(400).json({ error: 'quadra_id obrigatório' });
    const rows = db.prepare('SELECT * FROM lotes WHERE quadra_id = ? ORDER BY numero').all(quadra_id);
    res.json(transform(rows));
  } catch (err) { next(err); }
});

router.post('/import', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo CSV não enviado' });

    const rows = parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'CSV vazio ou inválido' });

    const stmt = db.prepare(
      'INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (?, ?, ?, ?)'
    );

    let importados = 0;
    let erros      = 0;

    const insertMany = db.transaction((items) => {
      for (const r of items) {
        try {
          stmt.run(
            Number(r.quadra_id),
            r.numero,
            r.latitude  ? Number(r.latitude)  : null,
            r.longitude ? Number(r.longitude) : null,
          );
          importados++;
        } catch {
          erros++;
        }
      }
    });

    insertMany(rows);
    res.json({ success: true, importados, erros });
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const info = db.prepare(
      'INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (?, ?, ?, ?)'
    ).run(
      Number(req.body.quadra_id),
      req.body.numero,
      req.body.latitude  ?? null,
      req.body.longitude ?? null,
    );
    const row = db.prepare('SELECT * FROM lotes WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(transform(row));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const b = req.body;
    db.prepare(`
      UPDATE lotes
         SET numero    = COALESCE(?, numero),
             latitude  = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude)
       WHERE id = ?
    `).run(b.numero ?? null, b.latitude ?? null, b.longitude ?? null, Number(req.params.id));
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

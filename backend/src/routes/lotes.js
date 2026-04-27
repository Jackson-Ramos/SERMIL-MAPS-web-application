const router = require('express').Router();
const multer = require('multer');
const { callN8n }   = require('../n8nClient');
const { transform } = require('../transform');

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

router.get('/', async (req, res, next) => {
  try {
    const quadra_id = Number(req.query.quadra_id);
    if (!quadra_id) return res.status(400).json({ error: 'quadra_id obrigatório' });
    const rows = await callN8n('lotes/list', { quadra_id });
    res.json(transform(rows || []));
  } catch (err) { next(err); }
});

router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo CSV não enviado' });

    const rows = parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'CSV vazio ou inválido' });

    // Insere linha a linha via endpoint create para reutilizar o workflow existente
    const results = await Promise.allSettled(
      rows.map(row => callN8n('lotes/create', {
        quadra_id: Number(row.quadra_id),
        numero:    row.numero,
        latitude:  row.latitude  ? Number(row.latitude)  : null,
        longitude: row.longitude ? Number(row.longitude) : null,
      }))
    );

    const importados = results.filter(r => r.status === 'fulfilled').length;
    const erros      = results.filter(r => r.status === 'rejected').length;

    res.json({ success: true, importados, erros });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const rows = await callN8n('lotes/create', {
      quadra_id: Number(req.body.quadra_id),
      numero:    req.body.numero,
      latitude:  req.body.latitude  ?? null,
      longitude: req.body.longitude ?? null,
    });
    res.status(201).json(transform(rows?.[0] || {}));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await callN8n('lotes/update', { id: Number(req.params.id), ...req.body });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;

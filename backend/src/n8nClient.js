const N8N_BASE_URL    = process.env.N8N_BASE_URL    || 'http://n8n:5678';
const WEBHOOK_SECRET  = process.env.N8N_WEBHOOK_SECRET || '';

async function callN8n(path, body = {}) {
  const url = `${N8N_BASE_URL}/webhook/${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err  = new Error(`n8n [${path}] retornou ${res.status}: ${text}`);
    err.status = res.status >= 500 ? 502 : res.status;
    throw err;
  }

  const data = await res.json().catch(() => null);
  return data;
}

module.exports = { callN8n };

// Campos Oracle NUMBER(1) que devem ser convertidos para boolean no frontend.
const BOOLEAN_FIELDS = new Set([
  'ativo',
  'uso_unico',
  'mapa_interno_ativo',
  'google_maps_ativo',
  'waze_ativo',
  'ramal_flutuante_ativo',
  'expiracao_automatica_ativa',
]);

function transformRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.toLowerCase();
    if (BOOLEAN_FIELDS.has(key)) {
      out[key] = v === 1 || v === '1' || v === true;
    } else {
      out[key] = v;
    }
  }
  return out;
}

function transform(data) {
  if (Array.isArray(data)) return data.map(transformRow);
  if (data && typeof data === 'object') return transformRow(data);
  return data;
}

module.exports = { transform };

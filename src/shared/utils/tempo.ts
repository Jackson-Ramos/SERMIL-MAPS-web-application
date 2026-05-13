export function calcularPermanencia(entradaISO: string | null): string {
  if (!entradaISO) return '0 min';

  const entrada = new Date(entradaISO);
  const agora = new Date();
  const diferencaMs = agora.getTime() - entrada.getTime();
  const minutos = Math.floor(diferencaMs / 60000);

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

export function formatarHora(isoString: string | null): string {
  if (!isoString) return '—';

  const data = new Date(isoString);
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
}

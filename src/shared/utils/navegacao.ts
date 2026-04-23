export function abrirGoogleMaps(lat: number, lon: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  window.open(url, '_blank');
}

export function abrirWaze(lat: number, lon: number): void {
  const url = `waze://?ll=${lat},${lon}&navigate=yes`;
  window.location.href = url;
}

export function detectarAppNavegacao(): 'interno' | 'gmaps' | 'waze' {
  const pathname = window.location.pathname;

  if (pathname.includes('/mapa')) {
    return 'interno';
  }

  const referrer = document.referrer;
  if (referrer.includes('google.com/maps')) {
    return 'gmaps';
  }
  if (referrer.includes('waze')) {
    return 'waze';
  }

  return 'interno';
}

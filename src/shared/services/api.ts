import axios from 'axios';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Resolve a URL base da API. Se VITE_API_URL apontar para localhost mas a
// página estiver sendo acessada por outro host (ex.: celular acessando o IP
// local da máquina dev), substitui o hostname pelo da página. Isso permite
// que dispositivos na mesma rede consumam o backend sem reconfigurar a env.
export function resolveApiBaseUrl(suffix: string = ''): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  const fallback = 'http://localhost:5000/api';
  const baseRaw = envUrl || fallback;

  if (typeof window === 'undefined') return baseRaw + suffix;

  const pageHost = window.location.hostname;
  const isPageOnLocalhost = pageHost === 'localhost' || pageHost === '127.0.0.1';
  const baseUrlObj = (() => {
    try { return new URL(baseRaw); } catch { return null; }
  })();
  const isApiOnLocalhost =
    baseUrlObj && (baseUrlObj.hostname === 'localhost' || baseUrlObj.hostname === '127.0.0.1');

  if (baseUrlObj && isApiOnLocalhost && !isPageOnLocalhost) {
    baseUrlObj.hostname = pageHost;
    return baseUrlObj.toString().replace(/\/$/, '') + suffix;
  }

  return baseRaw.replace(/\/$/, '') + suffix;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Anexa o JWT (salvo no localStorage pelo authStore) em toda requisição.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sermil_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → token inválido/expirado: limpa storage e força volta ao login.
    if (error.response?.status === 401) {
      localStorage.removeItem('sermil_token');
      localStorage.removeItem('sermil_role');
      localStorage.removeItem('sermil_usuario');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      if (USE_MOCK) {
        console.warn('API não disponível, usando dados mock');
        return { data: null, status: 200 };
      }
    }

    if (error.response) {
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        'Erro na requisição';
      console.error('Erro na API:', message);
      throw new Error(message);
    } else if (error.request) {
      console.error('Sem resposta da API');
      if (USE_MOCK) {
        return { data: null, status: 200 };
      }
      throw new Error('Servidor não respondeu. Verifique sua conexão.');
    } else {
      console.error('Erro ao configurar requisição:', error.message);
      throw error;
    }
  }
);

export default api;
export { USE_MOCK };

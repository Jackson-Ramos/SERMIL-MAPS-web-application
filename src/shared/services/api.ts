import axios from 'axios';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

// Mock Auth Service

export const login = async (usuario: string, senha: string):Promise<{ token: string, role: 'admin' | 'porteiro' }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (usuario === 'admin' && senha === 'admin') {
        resolve({ token: 'mock_jwt_admin_token', role: 'admin' });
      } else if (usuario === 'porteiro' && senha === 'porteiro') {
        resolve({ token: 'mock_jwt_porteiro_token', role: 'porteiro' });
      } else {
        reject(new Error('Credenciais inválidas'));
      }
    }, 500);
  });
};

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { login } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import { toast } from 'sonner';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(usuario, senha);
      setAuth(data.token, data.role);
      toast.success('Login efetuado com sucesso!');
      
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/porteiro');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl text-[#0B4F3A] mb-6 text-center">Acesso Restrito</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Usuário" 
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
          <Input 
            label="Senha" 
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          
          <Button type="submit" className="w-full pt-2" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Dica (Mock):</p>
          <p>Admin: admin / admin</p>
          <p>Porteiro: porteiro / porteiro</p>
        </div>
      </div>
    </div>
  );
}

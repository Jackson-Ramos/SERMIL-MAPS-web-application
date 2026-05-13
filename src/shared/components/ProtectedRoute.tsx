import { Navigate } from 'react-router';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, roleRequired }: { children: React.ReactNode, roleRequired: 'admin' | 'porteiro' | 'morador' }) {
  const { token, role } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== roleRequired) {
    // Redireciona para o painel correto do usuário
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'porteiro') return <Navigate to="/porteiro" replace />;
    if (role === 'morador') return <Navigate to="/morador" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

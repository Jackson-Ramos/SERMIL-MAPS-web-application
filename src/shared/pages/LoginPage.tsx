import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { login } from '../services/authService';
import { toast } from 'sonner';
import { Eye, EyeOff, MapPin, Shield, Lock, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#0B4F3A]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-16 w-48 h-48 rounded-full bg-[#28b88d]/20" />

        <motion.div
          className="relative z-10 flex flex-col h-full p-12"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xl font-semibold tracking-wide">SERMIL MAPS</span>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6 inline-flex w-20 h-20 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Shield className="w-10 h-10 text-[#28b88d]" />
            </div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Controle de<br />Acesso Seguro
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Sistema integrado de gerenciamento de mapas e controle de acesso para serviços militares.
            </p>

            <div className="mt-10 flex flex-col gap-4">
              {[
                'Gestão de visitantes em tempo real',
                'Controle de acesso por perfil',
                'Registro e auditoria de entradas',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#28b88d]/30 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-[#28b88d]" />
                  </div>
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} SERMIL MAPS — Uso exclusivo autorizado
          </p>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white dark:bg-gray-950 px-8 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B4F3A]">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#0B4F3A] dark:text-[#28b88d] text-lg font-semibold">SERMIL MAPS</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Acesso Restrito
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Insira suas credenciais para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  placeholder="Digite seu usuário"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="Digite sua senha"
                  className="w-full pl-10 pr-12 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 mt-2 rounded-xl bg-[#0B4F3A] hover:bg-[#0a3f2f] text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mock hint */}
          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Credenciais de demonstração
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div>
                <span className="font-medium">Admin:</span> admin / admin
              </div>
              <div>
                <span className="font-medium">Porteiro:</span> porteiro / porteiro
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

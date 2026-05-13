import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { CalendarDays, Clock, PartyPopper, LogOut, MapPin, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '../../shared/store/authStore';
import { getContadoresMorador } from '../../shared/services/eventoService';

interface MoradorLayoutProps {
  children: ReactNode;
}

export default function MoradorLayout({ children }: MoradorLayoutProps) {
  const location = useLocation();
  const { logout, usuario } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [eventosNaoLidos, setEventosNaoLidos] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const carregar = async () => {
      try {
        const c = await getContadoresMorador();
        if (!cancelled) setEventosNaoLidos(c.nao_lidos);
      } catch { /* silencioso */ }
    };
    carregar();
    const interval = setInterval(carregar, 60_000);
    const onChange = () => carregar();
    window.addEventListener('eventos:atualizado', onChange);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('eventos:atualizado', onChange);
    };
  }, [location.pathname]);

  const navItems: { path: string; icon: any; label: string; badge?: number }[] = [
    { path: '/morador', icon: CalendarDays, label: 'Agendamentos' },
    { path: '/morador/historico', icon: Clock, label: 'Histórico' },
    { path: '/morador/eventos', icon: PartyPopper, label: 'Eventos', badge: eventosNaoLidos },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="relative bg-[#0B4F3A] text-white shadow-lg z-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-[#28b88d]/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/12 backdrop-blur-sm border border-white/15">
              <MapPin className="w-[18px] h-[18px] text-[#28b88d]" />
            </div>
            <div className="leading-none">
              <p className="text-white text-[13px] font-bold tracking-wide">SERMIL MAPS</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-[#28b88d]/20 border border-[#28b88d]/30 text-[#28b88d] text-[9px] font-bold uppercase tracking-widest">
                Morador
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {usuario?.nome && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#28b88d] animate-pulse" />
                <span className="text-[11px] font-semibold text-white/85 tracking-wide">
                  {usuario.nome}
                </span>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-all"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={logout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/20 transition-all"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm z-10">
        <div className="flex items-center justify-center sm:justify-start px-2 sm:px-5 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/morador'
                ? location.pathname === '/morador'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center gap-2 px-3 sm:px-4 py-3 text-[12px] font-semibold tracking-wide
                  transition-colors flex-shrink-0
                  ${isActive
                    ? 'text-[#0B4F3A] dark:text-[#28b88d]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
                <span
                  className={`absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-0.5 rounded-full transition-all ${
                    isActive ? 'bg-[#0B4F3A] dark:bg-[#28b88d]' : 'bg-transparent'
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}

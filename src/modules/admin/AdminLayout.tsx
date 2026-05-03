import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { getContadoresAdmin } from '../../shared/services/eventoAdminService';
import {
  LayoutDashboard,
  Users,
  UserCog,
  MapPin,
  QrCode,
  Settings,
  Home,
  ClipboardList,
  PartyPopper,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '../../shared/store/authStore';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { path: '/admin',         icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/visitas', icon: ClipboardList,   label: 'Visitas'   },
      { path: '/admin/eventos', icon: PartyPopper,     label: 'Eventos'   },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { path: '/admin/quadras-lotes', icon: Home,    label: 'Quadras & Lotes' },
      { path: '/admin/moradores',     icon: Users,   label: 'Moradores'       },
      { path: '/admin/usuarios',      icon: UserCog, label: 'Usuários'        },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/admin/qrcode',        icon: QrCode,  label: 'QR Codes'     },
      { path: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { logout }     = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [eventosPendentes, setEventosPendentes] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const carregar = async () => {
      try {
        const c = await getContadoresAdmin();
        if (!cancelled) setEventosPendentes(c.pendente);
      } catch { /* silencioso — badge é informativo */ }
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

  const badgePor: Record<string, number> = {
    '/admin/eventos': eventosPendentes,
  };

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col bg-[#0B4F3A] shadow-xl z-10 overflow-hidden">

        {/* Dot-grid background — same pattern as login's left panel */}
        <div
          className="absolute inset-y-0 left-0 w-[220px] pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-20 -left-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 -right-10 w-32 h-32 rounded-full bg-[#28b88d]/10 pointer-events-none" />

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/12 backdrop-blur-sm border border-white/15 flex-shrink-0">
            <MapPin className="w-[18px] h-[18px] text-[#28b88d]" />
          </div>
          <div className="leading-none">
            <p className="text-white text-[13px] font-bold tracking-wide">SERMIL MAPS</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-[#28b88d]/20 border border-[#28b88d]/30 text-[#28b88d] text-[9px] font-bold uppercase tracking-widest">
              Admin
            </span>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 select-none">
                {group.label}
              </p>

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map(({ path, icon: Icon, label }) => {
                  const active = isActive(path);
                  const badge = badgePor[path];
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all duration-150
                        ${active
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/55 hover:bg-white/8 hover:text-white/90'
                        }
                      `}
                    >
                      {/* Active left accent bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#28b88d]" />
                      )}

                      {/* Icon wrapper */}
                      <span
                        className={`
                          flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0
                          transition-colors duration-150
                          ${active
                            ? 'bg-[#28b88d]/20 text-[#28b88d]'
                            : 'text-white/40 group-hover:text-white/70'
                          }
                        `}
                      >
                        <Icon size={15} />
                      </span>

                      <span className="truncate text-[13px] flex-1">{label}</span>

                      {badge && badge > 0 ? (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="relative z-10 border-t border-white/10 px-3 py-3 space-y-0.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:bg-white/8 hover:text-white/90 transition-all duration-150 group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 group-hover:text-white/70 transition-colors">
              {theme === 'dark'
                ? <Sun size={15} />
                : <Moon size={15} />
              }
            </span>
            <span className="text-[13px] font-medium">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 group-hover:text-red-400 transition-colors">
              <LogOut size={15} />
            </span>
            <span className="text-[13px] font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
        {children}
      </main>
    </div>
  );
}

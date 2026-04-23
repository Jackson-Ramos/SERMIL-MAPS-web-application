import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  MapPin,
  QrCode,
  Settings,
  Home,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import ThemeToggle from '../../shared/components/ThemeToggle';
import { useAuthStore } from '../../shared/store/authStore';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/visitas', icon: ClipboardList, label: 'Visitas' },
    { path: '/admin/quadras-lotes', icon: Home, label: 'Quadras & Lotes' },
    { path: '/admin/moradores', icon: Users, label: 'Moradores' },
    { path: '/admin/qrcode', icon: QrCode, label: 'QR Codes' },
    { path: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <aside className="w-[200px] bg-[#0B4F3A] text-white flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-[#0a3f2f] flex justify-between items-center">
          <div>
            <h1 className="text-xl">SERMIL MAPS</h1>
            <p className="text-xs opacity-75">Admin</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded mb-1 transition-colors ${
                  isActive
                    ? 'bg-white text-[#0B4F3A]'
                    : 'hover:bg-[#0a3f2f] text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded mb-1 transition-colors hover:bg-red-600 text-white mt-auto"
          >
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </button>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors">{children}</main>
    </div>
  );
}

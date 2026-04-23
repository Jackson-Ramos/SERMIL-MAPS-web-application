import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Monitor, Clock, PlusCircle, Phone, LogOut } from 'lucide-react';
import ThemeToggle from '../../shared/components/ThemeToggle';
import { useAuthStore } from '../../shared/store/authStore';

interface PorteiroLayoutProps {
  children: ReactNode;
}

export default function PorteiroLayout({ children }: PorteiroLayoutProps) {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/porteiro', icon: Monitor, label: 'Painel' },
    { path: '/porteiro/historico', icon: Clock, label: 'Histórico' },
    { path: '/porteiro/registro', icon: PlusCircle, label: 'Registro Manual' },
    { path: '/porteiro/ramal', icon: Phone, label: 'Ramais' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-[#0B4F3A] text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-2xl">SERMIL MAPS - Portaria</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={logout} className="p-2 hover:bg-[#0a3f2f] rounded-md transition-colors" title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-around p-2 shadow-sm z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded transition-colors ${
                isActive
                  ? 'bg-[#0B4F3A] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={24} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-auto p-4">{children}</main>
    </div>
  );
}

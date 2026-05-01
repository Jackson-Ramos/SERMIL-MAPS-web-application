import { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, ChevronLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface VisitanteLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  titulo?: string;
  subtitulo?: string;
}

export default function VisitanteLayout({
  children,
  showBack = false,
  titulo,
  subtitulo,
}: VisitanteLayoutProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Brand header */}
      <header className="relative bg-[#0B4F3A] text-white shadow-lg z-20 overflow-hidden shrink-0">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-[#28b88d]/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-4 py-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors active:scale-95"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-semibold">Voltar</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/12 backdrop-blur-sm border border-white/15">
                <MapPin className="w-[18px] h-[18px] text-[#28b88d]" />
              </div>
              <div className="leading-none">
                <p className="text-white text-[13px] font-bold tracking-wide">SERMIL MAPS</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-[#28b88d]/20 border border-[#28b88d]/30 text-[#28b88d] text-[9px] font-bold uppercase tracking-widest">
                  Visitante
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-all active:scale-95"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {(titulo || subtitulo) && (
          <div className="relative z-10 px-4 pb-3">
            {titulo && (
              <p className="text-white font-bold text-[15px] leading-tight">{titulo}</p>
            )}
            {subtitulo && (
              <p className="text-white/60 text-[11px] mt-0.5">{subtitulo}</p>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

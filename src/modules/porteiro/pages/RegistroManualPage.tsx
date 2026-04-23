import { useState, useEffect, useRef } from 'react';
import { getQuadras } from '../../../shared/services/quadraService';
import { getLotes } from '../../../shared/services/loteService';
import { iniciarVisita } from '../../../shared/services/visitaService';
import { Quadra, Lote } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { validarCPF, mascararCPF } from '../../../shared/utils/cpf';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRData {
  url: string;
  quadraNome: string;
  loteNumero: string;
  morador?: string;
  cpf: string;
}

export default function RegistroManualPage() {
  const [cpf, setCpf] = useState('');
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSelecionado, setLoteSelecionado] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarQuadras(); }, []);

  useEffect(() => {
    if (quadraSelecionada) carregarLotes(quadraSelecionada);
    else setLotes([]);
    setLoteSelecionado(null);
  }, [quadraSelecionada]);

  const carregarQuadras = async () => {
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      setQuadras(await getQuadras(condId));
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    }
  };

  const carregarLotes = async (quadraId: number) => {
    try {
      setLotes(await getLotes(quadraId));
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setCpf(mascararCPF(valor));
    setErro('');
    setQrData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setQrData(null);

    if (!validarCPF(cpf)) {
      setErro('CPF inválido. Verifique o número digitado.');
      return;
    }
    if (!loteSelecionado) {
      setErro('Selecione um lote de destino.');
      return;
    }

    setRegistrando(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      await iniciarVisita(cpf, loteSelecionado, condId, { tipo: 'manual' });

      const quadraAtual = quadras.find(q => q.id === quadraSelecionada);
      const loteAtual = lotes.find(l => l.id === loteSelecionado);

      // Build URL the visitor will scan to open map navigation directly
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        condId: String(condId),
        loteId: String(loteSelecionado),
        quadraNome: quadraAtual?.nome || '',
        loteNumero: loteAtual?.numero || '',
        cpf,
      });
      const url = `${baseUrl}/visitante/direto?${params.toString()}`;

      setQrData({
        url,
        quadraNome: quadraAtual?.nome || '',
        loteNumero: loteAtual?.numero || '',
        morador: loteAtual?.nome_morador || undefined,
        cpf,
      });

      toast.success('Visita registrada! QR Code gerado para o visitante.');
    } catch (error: any) {
      setErro(error.message || 'Erro ao registrar visita');
    } finally {
      setRegistrando(false);
    }
  };

  const handleNovaVisita = () => {
    setQrData(null);
    setCpf('');
    setQuadraSelecionada(null);
    setLoteSelecionado(null);
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `visita_qr_${qrData?.loteNumero}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const loteAtual = lotes.find(l => l.id === loteSelecionado);
  const quadraAtual = quadras.find(q => q.id === quadraSelecionada);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Registro Manual</h1>
        <p className="text-xs font-medium text-gray-500 mt-1">Entrada de visitante sem QR Code próprio</p>
      </header>

      {/* Formulário */}
      {!qrData ? (
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
          <div className="py-3 px-5 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <h3 className="text-[11px] font-bold uppercase text-gray-800 dark:text-gray-200 tracking-wide">Dados do Visitante</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-gray-900 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">CPF do Visitante</label>
              <Input
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Quadra de Destino</label>
              <select
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0B4F3A] focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:text-white"
                value={quadraSelecionada || ''}
                onChange={(e) => setQuadraSelecionada(Number(e.target.value))}
                required
              >
                <option value="">Selecione uma quadra...</option>
                {quadras.map((q) => (
                  <option key={q.id} value={q.id}>Quadra {q.nome}</option>
                ))}
              </select>
            </div>

            {quadraSelecionada && (
              <div className="space-y-1 animate-in fade-in duration-300">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Lote de Destino</label>
                <select
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0B4F3A] focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:text-white"
                  value={loteSelecionado || ''}
                  onChange={(e) => setLoteSelecionado(Number(e.target.value))}
                  required
                >
                  <option value="">Selecione um lote...</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lote {l.numero}{l.nome_morador ? ` — ${l.nome_morador}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loteSelecionado && quadraAtual && loteAtual && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl p-3 flex items-center gap-3 animate-in fade-in duration-300">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">Destino confirmado</p>
                  <p className="text-[12px] font-bold text-green-800">Q.{quadraAtual.nome} — L.{loteAtual.numero}{loteAtual.nome_morador ? ` · ${loteAtual.nome_morador}` : ''}</p>
                </div>
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[11px] font-bold text-red-700">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={registrando}
              className="w-full rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-3 transition-colors disabled:opacity-70 text-sm"
            >
              {registrando ? 'Registrando entrada...' : 'Registrar Entrada & Gerar QR'}
            </button>
          </form>
        </Card>
      ) : (
        /* QR Code gerado */
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
          <div className="py-3 px-5 border-b border-gray-50 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <h3 className="text-[11px] font-bold uppercase text-green-800 dark:text-green-300 tracking-wide">Visita Registrada — QR Pronto</h3>
            </div>
            <button
              onClick={handleNovaVisita}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-full transition-colors"
            >
              Nova visita
            </button>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 flex flex-col items-center gap-5">
            {/* Info do destino */}
            <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex justify-between text-center divide-x divide-gray-200 dark:divide-gray-700">
              <div className="flex-1 px-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Visitante</p>
                <p className="text-[12px] font-bold text-gray-900 dark:text-white font-mono mt-0.5">{qrData.cpf}</p>
              </div>
              <div className="flex-1 px-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Destino</p>
                <p className="text-[12px] font-bold text-gray-900 dark:text-white mt-0.5">Q.{qrData.quadraNome} — L.{qrData.loteNumero}</p>
              </div>
              {qrData.morador && (
                <div className="flex-1 px-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Morador</p>
                  <p className="text-[12px] font-bold text-gray-900 dark:text-white mt-0.5 truncate">{qrData.morador}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100"
            >
              <QRCodeSVG
                value={qrData.url}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#0B4F3A"
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-[11px] text-gray-500 text-center max-w-xs">
              Mostre este QR Code ao visitante. Ao escanear, ele abrirá o mapa com o caminho até o destino.
            </p>

            {/* Ações */}
            <div className="flex gap-3 w-full">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} />
                Baixar PNG
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

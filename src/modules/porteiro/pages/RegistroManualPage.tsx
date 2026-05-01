import { useState, useEffect, useRef } from 'react';
import { getQuadras } from '../../../shared/services/quadraService';
import { getLotes } from '../../../shared/services/loteService';
import { iniciarVisita } from '../../../shared/services/visitaService';
import { Quadra, Lote } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import PageHeader from '../../../shared/components/PageHeader';
import { validarCPF, mascararCPF } from '../../../shared/utils/cpf';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Printer,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  ChevronDown,
  Sparkles,
  Plus,
  IdCard,
} from 'lucide-react';

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

  useEffect(() => {
    carregarQuadras();
  }, []);

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
      const quadraAtual = quadras.find((q) => q.id === quadraSelecionada);
      const loteAtual = lotes.find((l) => l.id === loteSelecionado);

      // Pré-registra como pendente: o horario_entrada será marcado quando
      // o visitante escanear o QR Code abaixo.
      const visita = await iniciarVisita(
        cpf,
        loteSelecionado,
        condId,
        { tipo: 'manual' },
        quadraAtual?.nome || '',
        loteAtual?.numero || '',
        undefined,
        true,
      );

      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        condId: String(condId),
        loteId: String(loteSelecionado),
        quadraNome: quadraAtual?.nome || '',
        loteNumero: loteAtual?.numero || '',
        cpf,
        visitaId: String(visita.id),
      });
      const url = `${baseUrl}/visitante/direto?${params.toString()}`;

      setQrData({
        url,
        quadraNome: quadraAtual?.nome || '',
        loteNumero: loteAtual?.numero || '',
        morador: loteAtual?.nome_morador || undefined,
        cpf,
      });

      toast.success('Visita pré-registrada! O horário será marcado quando o visitante escanear o QR.');
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

  const loteAtual = lotes.find((l) => l.id === loteSelecionado);
  const quadraAtual = quadras.find((q) => q.id === quadraSelecionada);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <PageHeader
        title="Registro Manual"
        subtitle="Cadastro de visitante sem QR Code próprio"
      />

      {!qrData ? (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2">
            <User size={14} className="text-gray-500" />
            <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wider">
              Dados do Visitante
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <Input
              label="CPF do Visitante"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              startIcon={<IdCard size={15} />}
              className="!font-mono"
            />

            {/* Quadra select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quadra de Destino
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={15} />
                </div>
                <select
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] focus:border-transparent transition-all duration-200 appearance-none"
                  value={quadraSelecionada || ''}
                  onChange={(e) => setQuadraSelecionada(Number(e.target.value))}
                  required
                >
                  <option value="">Selecione uma quadra...</option>
                  {quadras.map((q) => (
                    <option key={q.id} value={q.id}>
                      Quadra {q.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={15} />
                </div>
              </div>
            </div>

            {/* Lote select */}
            {quadraSelecionada && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lote de Destino
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={15} />
                  </div>
                  <select
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B4F3A] dark:focus:ring-[#28b88d] focus:border-transparent transition-all duration-200 appearance-none"
                    value={loteSelecionado || ''}
                    onChange={(e) => setLoteSelecionado(Number(e.target.value))}
                    required
                  >
                    <option value="">Selecione um lote...</option>
                    {lotes.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lote {l.numero}
                        {l.nome_morador ? ` — ${l.nome_morador}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown size={15} />
                  </div>
                </div>
              </div>
            )}

            {/* Confirmação visual */}
            {loteSelecionado && quadraAtual && loteAtual && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-green-700 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400 tracking-wider">
                    Destino confirmado
                  </p>
                  <p className="text-[12px] font-bold text-green-900 dark:text-green-200 truncate">
                    Q.{quadraAtual.nome} — L.{loteAtual.numero}
                    {loteAtual.nome_morador ? ` · ${loteAtual.nome_morador}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 animate-in fade-in duration-200">
                <AlertCircle size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-[12px] font-semibold text-red-700 dark:text-red-300">{erro}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={registrando}
              size="lg"
              className="w-full"
            >
              <Sparkles size={16} />
              {registrando ? 'Registrando entrada...' : 'Registrar Entrada & Gerar QR'}
            </Button>
          </form>
        </Card>
      ) : (
        /* QR Code generated */
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-900/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-700 dark:text-green-400" />
              <h3 className="text-[11px] font-bold uppercase text-green-800 dark:text-green-300 tracking-wider">
                Visita Registrada
              </h3>
              <Badge variant="success" dot>
                QR Pronto
              </Badge>
            </div>
            <button
              onClick={handleNovaVisita}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={11} />
              Nova visita
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-5">
            {/* Info do destino */}
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
              <InfoTile label="Visitante" value={qrData.cpf} mono />
              <InfoTile label="Destino" value={`Q.${qrData.quadraNome} — L.${qrData.loteNumero}`} />
              <InfoTile label="Morador" value={qrData.morador || '—'} />
            </div>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
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

            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center max-w-xs leading-relaxed">
              Mostre este QR Code ao visitante. Ao escanear, ele abrirá o mapa com o caminho até o destino.
            </p>

            {/* Ações */}
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={downloadQR} className="flex-1">
                <Download size={14} />
                Baixar PNG
              </Button>
              <Button variant="secondary" onClick={() => window.print()} className="flex-1">
                <Printer size={14} />
                Imprimir
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface InfoTileProps {
  label: string;
  value: string;
  mono?: boolean;
}

function InfoTile({ label, value, mono }: InfoTileProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-center min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p
        className={`text-[12px] font-bold text-gray-900 dark:text-white truncate mt-0.5 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getQrCodes, gerarQrCode, revogarQrCode } from '../../../shared/services/qrcodeService';
import { QRCode } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Badge from '../../../shared/components/Badge';
import Modal from '../../../shared/components/Modal';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';
import { Download, Printer, Trash2, QrCode, Clock, RefreshCw } from 'lucide-react';

export default function QrCodePage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [nomePortao, setNomePortao] = useState('');
  const [expiracaoHoras, setExpiracaoHoras] = useState('');
  const [usoUnico, setUsoUnico] = useState(false);
  const [gerando, setGerando] = useState(false);
  const qrRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    carregarQrCodes();
  }, []);

  const carregarQrCodes = async () => {
    setLoading(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      const dados = await getQrCodes(condId);
      setQrCodes(dados);
    } catch (error) {
      console.error('Erro ao carregar QR Codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setNomePortao('');
    setExpiracaoHoras('');
    setUsoUnico(false);
  };

  const handleGerarQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGerando(true);
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      await gerarQrCode(
        condId,
        nomePortao,
        expiracaoHoras ? Number(expiracaoHoras) : undefined,
        usoUnico
      );
      handleFecharModal();
      carregarQrCodes();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    } finally {
      setGerando(false);
    }
  };

  const handleRevogar = async (qrId: number) => {
    if (!confirm('Tem certeza que deseja revogar este QR Code?')) return;
    try {
      await revogarQrCode(qrId);
      carregarQrCodes();
    } catch (error) {
      console.error('Erro ao revogar QR Code:', error);
    }
  };

  const downloadQrCode = (qrCode: QRCode) => {
    const svg = qrRefs.current[qrCode.id]?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode_${qrCode.nome_portao}.png`;
      link.href = pngFile;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const imprimirQrCode = (qrCode: QRCode) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = qrRefs.current[qrCode.id]?.querySelector('svg');
    if (!svg) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qrCode.nome_portao}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; padding: 40px; font-family: sans-serif; }
            h2 { margin-bottom: 24px; color: #0B4F3A; }
          </style>
        </head>
        <body>
          <h2>QR Code - ${qrCode.nome_portao}</h2>
          ${svg.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isExpirado = (expira_em?: string) => {
    if (!expira_em) return false;
    return new Date(expira_em) < new Date();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="QR Codes de Acesso"
        subtitle="Gerencie os códigos de acesso para os portões do condomínio"
        action={
          <Button onClick={() => setModalAberto(true)}>
            <QrCode size={16} />
            Novo QR Code
          </Button>
        }
      />

      {qrCodes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<QrCode size={22} />}
            title="Nenhum QR Code cadastrado"
            description="Gere um QR Code para permitir acesso rápido a um portão do condomínio."
            action={
              <Button onClick={() => setModalAberto(true)}>
                <QrCode size={16} />
                Gerar QR Code
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qrCode) => {
            const expirado = isExpirado(qrCode.expira_em);
            return (
              <Card key={qrCode.id} className="overflow-hidden !p-0">
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {qrCode.nome_portao}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {qrCode.uso_unico && (
                      <Badge variant="warning">Único</Badge>
                    )}
                    {expirado ? (
                      <Badge variant="expirada" dot>Expirado</Badge>
                    ) : (
                      <Badge variant="ativa" dot>Ativo</Badge>
                    )}
                  </div>
                </div>

                {/* QR Code area */}
                <div className="flex flex-col items-center px-5 pt-5 pb-4">
                  <div
                    ref={(el) => (qrRefs.current[qrCode.id] = el)}
                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <QRCodeSVG
                      value={qrCode.url}
                      size={180}
                      fgColor={expirado ? '#9ca3af' : '#0B4F3A'}
                    />
                  </div>

                  {/* URL */}
                  <p className="mt-3 text-[10px] font-mono text-gray-400 dark:text-gray-500 break-all text-center leading-relaxed px-1">
                    {qrCode.url}
                  </p>

                  {/* Metadata */}
                  {(qrCode.expira_em || qrCode.uso_unico) && (
                    <div className="w-full mt-3 space-y-1.5">
                      {qrCode.expira_em && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="flex-shrink-0" />
                          <span>
                            {expirado ? 'Expirou em' : 'Expira em'}{' '}
                            <span className={`font-semibold ${expirado ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              {new Date(qrCode.expira_em).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                      {qrCode.uso_unico && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                          <RefreshCw size={12} className="flex-shrink-0" />
                          <span>Descartável após o primeiro uso</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 pb-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadQrCode(qrCode)}
                    className="flex-1"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => imprimirQrCode(qrCode)}
                    className="flex-1"
                  >
                    <Printer size={14} />
                    Imprimir
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRevogar(qrCode.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalAberto}
        onClose={handleFecharModal}
        title="Novo QR Code"
        subtitle="Configure as permissões de acesso para o portão"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button type="submit" form="form-qrcode" disabled={gerando}>
              {gerando ? 'Gerando...' : 'Gerar QR Code'}
            </Button>
            <Button variant="secondary" onClick={handleFecharModal} disabled={gerando}>
              Cancelar
            </Button>
          </div>
        }
      >
        <form id="form-qrcode" onSubmit={handleGerarQrCode} className="space-y-4">
          <Input
            label="Nome do Portão"
            value={nomePortao}
            onChange={(e) => setNomePortao(e.target.value)}
            required
            placeholder="Ex: Portão Principal"
          />
          <Input
            label="Expiração (horas)"
            type="number"
            value={expiracaoHoras}
            onChange={(e) => setExpiracaoHoras(e.target.value)}
            placeholder="Deixe vazio para sem expiração"
            min="1"
          />
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <input
              type="checkbox"
              checked={usoUnico}
              onChange={(e) => setUsoUnico(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0B4F3A] focus:ring-[#0B4F3A] accent-[#0B4F3A]"
            />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Uso único</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">O código será invalidado após o primeiro acesso</p>
            </div>
          </label>
        </form>
      </Modal>
    </div>
  );
}

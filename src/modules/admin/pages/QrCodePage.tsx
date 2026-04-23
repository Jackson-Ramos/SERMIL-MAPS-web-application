import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getQrCodes, gerarQrCode, revogarQrCode } from '../../../shared/services/qrcodeService';
import { QRCode } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Loading from '../../../shared/components/Loading';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { Download, Trash2 } from 'lucide-react';

export default function QrCodePage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [nomePortao, setNomePortao] = useState('');
  const [expiracaoHoras, setExpiracaoHoras] = useState('');
  const [usoUnico, setUsoUnico] = useState(false);
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

  const handleGerarQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const condId = Number(import.meta.env.VITE_COND_ID) || 1;
      await gerarQrCode(
        condId, 
        nomePortao, 
        expiracaoHoras ? Number(expiracaoHoras) : undefined, 
        usoUnico
      );
      setModalAberto(false);
      setNomePortao('');
      setExpiracaoHoras('');
      setUsoUnico(false);
      carregarQrCodes();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
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

      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode_${qrCode.nome_portao}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
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
            body { display: flex; flex-direction: column; align-items: center; padding: 20px; }
            h2 { margin-bottom: 20px; }
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>QR Codes</h1>
        <Button onClick={() => setModalAberto(true)}>Gerar Novo QR Code</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id}>
            <div className="flex flex-col items-center">
              <h3 className="mb-4">{qrCode.nome_portao}</h3>
              <div ref={(el) => (qrRefs.current[qrCode.id] = el)} className="bg-white p-2 rounded">
                <QRCodeSVG value={qrCode.url} size={200} />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 break-all text-center">{qrCode.url}</p>
              
              <div className="w-full mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {qrCode.expira_em && (
                  <p>• Expira em: {new Date(qrCode.expira_em).toLocaleString()}</p>
                )}
                {qrCode.uso_unico && (
                  <p>• Uso único (Descartável)</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => downloadQrCode(qrCode)}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => imprimirQrCode(qrCode)}
                >
                  Imprimir
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleRevogar(qrCode.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="mb-4">Gerar Novo QR Code</h3>
            <form onSubmit={handleGerarQrCode} className="space-y-4">
              <Input
                label="Nome do Portão"
                value={nomePortao}
                onChange={(e) => setNomePortao(e.target.value)}
                required
                placeholder="Ex: Portão Principal"
              />
              <Input
                label="Expiração (em horas, opcional)"
                type="number"
                value={expiracaoHoras}
                onChange={(e) => setExpiracaoHoras(e.target.value)}
                placeholder="Ex: 24"
                min="1"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={usoUnico} 
                  onChange={(e) => setUsoUnico(e.target.checked)}
                  className="rounded border-gray-300 text-[#0B4F3A] focus:ring-[#0B4F3A]"
                />
                QR Code de uso único
              </label>
              <div className="flex gap-2 mt-6">
                <Button type="submit">Gerar</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

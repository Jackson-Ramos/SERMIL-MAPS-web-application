import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getLotes } from '../../../shared/services/loteService';
import { Lote } from '../../../shared/types';
import Loading from '../../../shared/components/Loading';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

export default function TelaLotes() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { quadraNome, quadraId, setLote } = useVisitanteStore();

  useEffect(() => {
    carregarLotes();
  }, []);

  const carregarLotes = async () => {
    setLoading(true);
    setErro('');

    if (!quadraId) {
      setErro('Sessão expirada. Escaneie o QR Code novamente.');
      setLoading(false);
      return;
    }

    try {
      const dados = await getLotes(quadraId);
      setLotes(dados);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarLote = (lote: Lote) => {
    setLote(
      lote.id,
      lote.numero,
      lote.nome_morador || null,
      lote.ramal || null,
      lote.latitude || null,
      lote.longitude || null
    );
    navigate('/visitante/navegacao');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorMessage message={erro} onRetry={carregarLotes} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-[#0B4F3A] mb-4 hover:underline"
        >
          ← Voltar
        </button>

        <h1 className="text-2xl mb-2 text-center">Quadra {quadraNome}</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Selecione o número do lote
        </p>

        <div className="grid grid-cols-4 gap-3">
          {lotes.map((lote) => (
            <button
              key={lote.id}
              onClick={() => handleSelecionarLote(lote)}
              className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center hover:shadow-md transition-all min-h-[64px] ${
                lote.nome_morador
                  ? 'border-[#0B4F3A] bg-green-50 hover:bg-green-100'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{lote.numero}</span>
              {lote.nome_morador && (
                <span className="text-xs text-gray-600 mt-1 text-center px-1">
                  {lote.nome_morador.split(' ')[0]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

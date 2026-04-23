import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getQuadras } from '../../../shared/services/quadraService';
import { Quadra } from '../../../shared/types';
import Loading from '../../../shared/components/Loading';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

export default function TelaQuadras() {
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const { condId, setQuadra } = useVisitanteStore();

  useEffect(() => {
    carregarQuadras();
  }, []);

  const carregarQuadras = async () => {
    setLoading(true);
    setErro('');

    if (!condId) {
      setErro('Sessão expirada. Escaneie o QR Code novamente.');
      setLoading(false);
      return;
    }

    try {
      const dados = await getQuadras(condId);
      setQuadras(dados);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar quadras');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarQuadra = (quadra: Quadra) => {
    setQuadra(quadra.id, quadra.nome);
    navigate('/visitante/lotes');
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
        <ErrorMessage message={erro} onRetry={carregarQuadras} />
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

        <h1 className="text-2xl mb-2 text-center">Selecione a Quadra</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Escolha a quadra do seu destino
        </p>

        <div className="space-y-3">
          {quadras.map((quadra) => (
            <button
              key={quadra.id}
              onClick={() => handleSelecionarQuadra(quadra)}
              className="w-full bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-[#0B4F3A] hover:bg-green-50 transition-colors min-h-[64px] flex items-center justify-center"
            >
              <span className="text-xl">Quadra {quadra.nome}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

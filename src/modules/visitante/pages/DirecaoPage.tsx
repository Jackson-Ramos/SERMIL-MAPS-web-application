import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import Loading from '../../../shared/components/Loading';

/**
 * Página intermediária acessada pelo QR Code gerado pelo porteiro.
 * Lê os parâmetros da URL, popula o visitanteStore e redireciona para /visitante/navegacao.
 */
export default function DirecaoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCondGate, setCpf, setQuadra, setLote } = useVisitanteStore();

  useEffect(() => {
    const condId = Number(searchParams.get('condId')) || 1;
    const loteId = Number(searchParams.get('loteId'));
    const quadraNome = searchParams.get('quadraNome') || '';
    const loteNumero = searchParams.get('loteNumero') || '';
    const cpf = searchParams.get('cpf') || '';

    if (!loteId) {
      // Parâmetros inválidos, volta para a tela inicial
      navigate('/');
      return;
    }

    // Popula o estado global do visitante com os dados do QR Code
    setCondGate(condId, 'manual');
    if (cpf) setCpf(cpf);
    setQuadra(0, quadraNome);
    setLote(loteId, loteNumero, null, null, null, null);

    // Redireciona direto para a tela de navegação (escolha do app de mapa)
    navigate('/visitante/navegacao', { replace: true });
  }, []);

  return <Loading />;
}

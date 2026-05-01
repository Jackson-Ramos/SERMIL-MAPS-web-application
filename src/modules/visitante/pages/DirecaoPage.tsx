import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import { confirmarVisitaPublico } from '../../../shared/services/publicService';
import Loading from '../../../shared/components/Loading';

/**
 * Página intermediária acessada pelo QR Code gerado pelo porteiro.
 * Lê os parâmetros da URL, confirma a visita pendente (marcando o
 * horario_entrada real) e redireciona para /visitante/navegacao.
 */
export default function DirecaoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCondGate, setCpf, setQuadra, setLote, setVisita } = useVisitanteStore();

  useEffect(() => {
    const condId = Number(searchParams.get('condId')) || 1;
    const loteId = Number(searchParams.get('loteId'));
    const quadraNome = searchParams.get('quadraNome') || '';
    const loteNumero = searchParams.get('loteNumero') || '';
    const cpf = searchParams.get('cpf') || '';
    const visitaId = Number(searchParams.get('visitaId')) || 0;

    if (!loteId) {
      navigate('/');
      return;
    }

    setCondGate(condId, 'manual');
    if (cpf) setCpf(cpf);
    setQuadra(0, quadraNome);
    setLote(loteId, loteNumero, null, null, null, null);

    if (visitaId) {
      confirmarVisitaPublico(visitaId)
        .then((visita: any) => {
          setVisita(visita.id, visita.horario_entrada);
          // Endpoint enriquecido: traz dados do lote/morador para que a tela
          // de navegação possa oferecer o botão de ligar para o ramal.
          setLote(
            loteId,
            loteNumero,
            visita.lote_nome_morador ?? null,
            visita.lote_ramal ?? null,
            visita.lote_latitude ?? null,
            visita.lote_longitude ?? null,
          );
        })
        .catch((err) => {
          console.error('Erro ao confirmar visita:', err);
        })
        .finally(() => {
          navigate('/visitante/navegacao', { replace: true });
        });
    } else {
      navigate('/visitante/navegacao', { replace: true });
    }
  }, []);

  return <Loading />;
}

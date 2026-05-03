import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  MapPin,
  User,
  IdCard,
  Phone,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  CalendarDays,
  Home,
  Building2,
  PartyPopper,
} from 'lucide-react';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { ConviteInfo } from '../../../shared/types';
import { getConvite, preencherConvite } from '../../../shared/services/conviteService';

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<ConviteInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await getConvite(token);
        setInfo(data);
        if (data.link_status === 'preenchido') setSucesso(true);
      } catch (e: any) {
        setErroCarga(e.message || 'Convite inválido ou já utilizado');
      } finally {
        setCarregando(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!token) return;
    if (!nome.trim()) {
      setErro('Informe seu nome.');
      return;
    }
    setEnviando(true);
    try {
      await preencherConvite(token, {
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, '') || undefined,
        telefone: telefone.trim() || undefined,
      });
      setSucesso(true);
    } catch (e: any) {
      setErro(e.message || 'Erro ao enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0B4F3A]">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#0B4F3A] dark:text-[#28b88d] text-base font-bold tracking-wide">
            SERMIL MAPS
          </span>
        </div>

        {carregando ? (
          <Card>
            <div className="p-8 text-center text-sm text-gray-500">Carregando convite...</div>
          </Card>
        ) : erroCarga ? (
          <Card className="!p-0 overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/15 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Convite indisponível
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{erroCarga}</p>
            </div>
          </Card>
        ) : sucesso ? (
          <Card className="!p-0 overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/15 flex items-center justify-center">
                <CheckCircle2 size={26} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Convite confirmado!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                {info?.evento_titulo ? (
                  <>
                    Sua presença em <span className="font-semibold">{info.evento_titulo}</span>{' '}
                    foi registrada. Apresente seu nome na portaria do {info.condominio_nome} ao
                    chegar.
                  </>
                ) : (
                  <>
                    {info?.morador_nome} foi notificado. Apresente este nome na portaria do{' '}
                    {info?.condominio_nome} ao chegar.
                  </>
                )}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 text-xs">
                <Lock size={11} className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">
                  Este link já foi utilizado
                </span>
              </div>
            </div>
          </Card>
        ) : info ? (
          <Card className="!p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-[#0B4F3A]/5 to-[#28b88d]/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B4F3A] dark:text-[#28b88d]">
                Você foi convidado(a){info.evento_titulo ? ' para' : ' por'}
              </p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                {info.evento_titulo && (
                  <PartyPopper size={18} className="text-[#0B4F3A] dark:text-[#28b88d] flex-shrink-0" />
                )}
                <span>{info.evento_titulo || info.morador_nome}</span>
              </h1>
              {info.evento_titulo && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  por <span className="font-semibold">{info.morador_nome}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {info.condominio_nome} · Quadra {info.quadra_nome} · Lote {info.lote_numero}
              </p>
            </div>

            {/* Detalhes do evento */}
            {info.evento_titulo && (
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
                {info.evento_data_inicio && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-semibold">
                      {new Date(info.evento_data_inicio).toLocaleString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  {info.evento_local_tipo === 'residencia' ? (
                    <>
                      <Home size={14} className="text-gray-400 flex-shrink-0" />
                      <span>Na residência</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{info.evento_local_nome || 'Área comum'}</span>
                    </>
                  )}
                </div>
                {info.evento_observacoes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic pt-1">
                    {info.evento_observacoes}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Preencha seus dados para confirmar o convite. O morador será notificado.
              </p>

              <Input
                label="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                startIcon={<User size={15} />}
                maxLength={120}
                required
              />
              <Input
                label="CPF (opcional)"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                placeholder="00000000000"
                startIcon={<IdCard size={15} />}
                maxLength={11}
                className="!font-mono"
              />
              <Input
                label="Telefone (opcional)"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                startIcon={<Phone size={15} />}
                maxLength={20}
              />

              {erro && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                  <AlertCircle size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-red-700 dark:text-red-300">{erro}</p>
                </div>
              )}

              <Button type="submit" loading={enviando} size="lg" className="w-full">
                <Sparkles size={15} />
                Confirmar convite
              </Button>

              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                Este link é de uso único. Após o envio, ele não poderá mais ser utilizado.
              </p>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getCondominioPublico } from '../../../shared/services/publicService';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { validarCPF, mascararCPF } from '../../../shared/utils/cpf';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';
import VisitanteLayout from '../VisitanteLayout';
import { IdCard, Building2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TelaIdentificacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cpf, setCpfLocal] = useState('');
  const [erro, setErro] = useState('');
  const [nomeCondominio, setNomeCondominio] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { setCondGate, setCpf } = useVisitanteStore();

  useEffect(() => {
    const condId = searchParams.get('cond');
    const gate = searchParams.get('gate');

    if (!condId || !gate) {
      setErro('QR Code inválido. Escaneie novamente na entrada.');
      return;
    }

    setCondGate(Number(condId), gate);
    carregarCondominio(Number(condId));
  }, [searchParams]);

  const carregarCondominio = async (condId: number) => {
    setCarregando(true);
    try {
      const dados = await getCondominioPublico(condId);
      setNomeCondominio(dados.nome);
    } catch {
      setErro('Erro ao carregar informações. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setCpfLocal(mascararCPF(valor));
    setErro('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCPF(cpf)) {
      setErro('CPF inválido. Verifique os dígitos e tente novamente.');
      return;
    }
    setCpf(cpf);
    navigate('/visitante/quadras');
  };

  return (
    <VisitanteLayout>
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-5">
        <motion.div
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Welcome block */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B4F3A]/8 dark:bg-[#28b88d]/10 border border-[#0B4F3A]/12 dark:border-[#28b88d]/20 mb-3">
              <Building2 size={13} className="text-[#0B4F3A] dark:text-[#28b88d]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B4F3A] dark:text-[#28b88d]">
                {carregando ? 'Carregando...' : (nomeCondominio || 'SERMIL MAPS')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Bem-vindo!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Digite seu CPF para começar a navegação
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-4"
          >
            <Input
              label="Seu CPF"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              startIcon={<IdCard size={15} />}
              className="!font-mono text-base"
            />

            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
              >
                <AlertCircle size={14} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-[12px] font-medium text-red-700 dark:text-red-300">{erro}</p>
              </motion.div>
            )}

            <Button type="submit" size="lg" className="w-full">
              Continuar
            </Button>
          </form>

          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 px-4">
            Seus dados são usados apenas para controle de acesso nesta visita.
          </p>
        </motion.div>
      </div>
    </VisitanteLayout>
  );
}

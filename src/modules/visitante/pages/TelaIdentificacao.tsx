import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getCondominio } from '../../../shared/services/condominioService';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { validarCPF, mascararCPF } from '../../../shared/utils/cpf';
import { useVisitanteStore } from '../../../shared/store/visitanteStore';

export default function TelaIdentificacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cpf, setCpfLocal] = useState('');
  const [erro, setErro] = useState('');
  const [nomeCondominio, setNomeCondominio] = useState('');
  const { setCondGate, setCpf } = useVisitanteStore();

  useEffect(() => {
    const condId = searchParams.get('cond');
    const gate = searchParams.get('gate');

    if (!condId || !gate) {
      setErro('QR Code inválido');
      return;
    }

    setCondGate(Number(condId), gate);

    carregarCondominio(Number(condId));
  }, [searchParams]);

  const carregarCondominio = async (condId: number) => {
    try {
      const dados = await getCondominio(condId);
      setNomeCondominio(dados.nome);
    } catch (error) {
      setErro('Erro ao carregar informações do condomínio');
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
      setErro('CPF inválido. Verifique os dígitos.');
      return;
    }

    setCpf(cpf);
    navigate('/visitante/quadras');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl mb-2">Bem-vindo ao</h1>
          <h2 className="text-3xl text-[#0B4F3A]">{nomeCondominio || 'SERMIL MAPS'}</h2>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Digite seu CPF"
              value={cpf}
              onChange={handleCpfChange}
              error={erro}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              className="text-lg"
            />

            <Button type="submit" className="w-full text-lg">
              Continuar
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Seus dados serão utilizados apenas para controle de acesso
        </p>
      </div>
    </div>
  );
}

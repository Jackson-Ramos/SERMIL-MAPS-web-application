import { useState, useEffect } from 'react';
import useConfigStore from '../../../shared/store/configStore';
import { getCondominio, updateCondominio } from '../../../shared/services/condominioService';
import { Condominio } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Loading from '../../../shared/components/Loading';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { config, loading, fetchConfig, updateConfig } = useConfigStore();
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [salvandoCondominio, setSalvandoCondominio] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    const condId = Number(import.meta.env.VITE_COND_ID) || 1;
    fetchConfig(condId);
    carregarCondominio(condId);
  }, []);

  const carregarCondominio = async (condId: number) => {
    try {
      const dados = await getCondominio(condId);
      setCondominio(dados);
    } catch (error) {
      console.error('Erro ao carregar condomínio:', error);
    }
  };

  const handleSalvarCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominio) return;

    setSalvandoCondominio(true);
    try {
      await updateCondominio(condominio.id, condominio);
      toast.success('Dados do condomínio salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar condomínio:', error);
      toast.error('Erro ao salvar dados do condomínio');
    } finally {
      setSalvandoCondominio(false);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !condominio) return;

    setSalvandoConfig(true);
    try {
      await updateConfig(condominio.id, config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSalvandoConfig(false);
    }
  };

  if (loading || !config || !condominio) return <Loading />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Sec */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Preferências do sistema e dados da planta</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Dados do Condomínio */}
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col">
          <div className="py-3 px-5 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/80 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <h3 className="text-[11px] font-bold uppercase text-gray-800 dark:text-gray-200 tracking-wide">
              Dados da Instalação
            </h3>
          </div>
          
          <form onSubmit={handleSalvarCondominio} className="p-5 bg-white dark:bg-gray-900/20 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Nome do Condomínio</label>
              <Input
                value={condominio.nome}
                onChange={(e) => setCondominio({ ...condominio, nome: e.target.value })}
                required
                className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Cidade</label>
              <Input
                value={condominio.cidade}
                onChange={(e) => setCondominio({ ...condominio, cidade: e.target.value })}
                required
                className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Ramal Principal (Portaria)</label>
              <Input
                value={condominio.ramal_portaria}
                onChange={(e) => setCondominio({ ...condominio, ramal_portaria: e.target.value })}
                required
                className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={salvandoCondominio}
                className="w-full !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5 transition-colors disabled:opacity-70"
              >
                {salvandoCondominio ? 'Salvando...' : 'Atualizar Dados'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Configurações do Sistema */}
        <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden flex flex-col">
          <div className="py-3 px-5 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-800/80 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h3 className="text-[11px] font-bold uppercase text-gray-800 dark:text-gray-200 tracking-wide">
              Preferências do App
            </h3>
          </div>
          
          <form onSubmit={handleSalvarConfig} className="p-5 bg-white dark:bg-gray-900/20 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Tempo Máximo de Visita (min)</label>
              <Input
                type="number"
                value={config.tempo_maximo_visita}
                onChange={(e) =>
                  useConfigStore.setState({
                    config: {
                      ...config,
                      tempo_maximo_visita: parseInt(e.target.value),
                    },
                  })
                }
                required
                className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono w-full sm:w-1/2"
              />
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">Módulos & Vetores de Rota</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Mapa Interno</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={config.mapa_interno_ativo} onChange={(e) => useConfigStore.setState({ config: { ...config, mapa_interno_ativo: e.target.checked } })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Google Maps</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={config.google_maps_ativo} onChange={(e) => useConfigStore.setState({ config: { ...config, google_maps_ativo: e.target.checked } })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Waze</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={config.waze_ativo} onChange={(e) => useConfigStore.setState({ config: { ...config, waze_ativo: e.target.checked } })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Ramal Flutuante</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={config.ramal_flutuante_ativo} onChange={(e) => useConfigStore.setState({ config: { ...config, ramal_flutuante_ativo: e.target.checked } })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </div>
                </label>

                <label className="col-span-1 sm:col-span-2 flex items-center justify-between cursor-pointer p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <div>
                    <span className="text-[11px] font-bold text-red-800 dark:text-red-400 block">Expiração Automática</span>
                    <span className="text-[9px] font-medium text-red-600/70 dark:text-red-400/70">Encerra visitas após o tempo máximo</span>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={config.expiracao_automatica_ativa} onChange={(e) => useConfigStore.setState({ config: { ...config, expiracao_automatica_ativa: e.target.checked } })} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={salvandoConfig}
                className="w-full !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5 transition-colors disabled:opacity-70"
              >
                {salvandoConfig ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

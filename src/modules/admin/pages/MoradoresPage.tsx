import { useState } from 'react';
import { Morador } from '../../../shared/types';
import Card from '../../../shared/components/Card';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([
    {
      id: 1,
      nome: 'João Silva',
      quadra: 'A',
      lote: '12',
      ramal: '1234',
      total_visitas: 45,
    },
    {
      id: 2,
      nome: 'Maria Santos',
      quadra: 'B',
      lote: '8',
      ramal: '1235',
      total_visitas: 32,
    },
  ]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const moradoresFiltrados = moradores.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Sec */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Moradores</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Diretório de proprietários e autorizados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setModalAberto(true)}
            className="!rounded-full border-0 shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Morador
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <Card className="!rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm !p-0 overflow-hidden">
        {/* Barra de Busca */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="text-[11px] font-bold uppercase text-gray-700 dark:text-gray-200 tracking-wide flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Diretório Ativo
          </h3>
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <Input
              placeholder="Buscar morador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="!text-sm !py-2 !pl-10 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm w-full"
            />
          </div>
        </div>

        {/* Tabela de Moradores */}
        <div className="overflow-x-auto bg-white dark:bg-gray-900">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3 px-5">Nome do Morador</th>
                <th className="py-3 px-5">Localização</th>
                <th className="py-3 px-5">Ramal</th>
                <th className="py-3 px-5 text-center">Visitas Recebidas</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-gray-700 dark:text-gray-300">
              {moradoresFiltrados.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium text-[11px]">
                     Nenhum morador encontrado com esse nome.
                   </td>
                 </tr>
              ) : (
                moradoresFiltrados.map((morador) => (
                  <tr key={morador.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors group">
                    <td className="py-3 px-5 font-bold text-gray-900 dark:text-gray-100">{morador.nome}</td>
                    <td className="py-3 px-5">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                        Q.{morador.quadra} - L.{morador.lote}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-gray-500 dark:text-gray-400">
                      📞 {morador.ramal}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full font-bold">
                        {morador.total_visitas}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button className="text-gray-400 hover:text-[#0B4F3A] transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center">
          <p className="text-[10px] font-medium text-gray-500">
            Total de {moradoresFiltrados.length} moradores listados
          </p>
        </div>
      </Card>

      {/* Modal de Criação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 w-[450px] shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Novo Morador</h3>
                <p className="text-[11px] font-medium text-gray-500">Cadastro de proprietário ou morador autorizado</p>
              </div>
              <button 
                onClick={() => setModalAberto(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setModalAberto(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Nome Completo</label>
                <Input
                  required
                  placeholder="Nome do morador"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Quadra</label>
                  <Input
                    required
                    placeholder="Ex: A"
                    className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Lote</label>
                  <Input
                    required
                    placeholder="Ex: 12"
                    className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1">Ramal de Comunicação</label>
                <Input
                  required
                  placeholder="Ex: 1024"
                  className="!text-sm !py-2.5 !rounded-xl !border-gray-200 dark:!border-gray-700 shadow-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800 mt-6">
                <Button 
                  type="submit" 
                  className="flex-1 !rounded-xl font-bold tracking-wide shadow-md bg-[#0B4F3A] hover:bg-[#073627] text-white py-2.5"
                >
                  Confirmar Cadastro
                </Button>
                <Button 
                  type="button"
                  variant="secondary" 
                  onClick={() => setModalAberto(false)}
                  className="flex-1 !rounded-xl font-bold tracking-wide border border-gray-200 dark:border-gray-700 py-2.5 hover:bg-gray-50"
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

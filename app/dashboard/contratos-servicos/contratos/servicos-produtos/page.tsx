'use client';

import React, { useState } from 'react';
import Sidebar from '../../../../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Star, CheckCircle, Clock, ListChecks } from 'lucide-react';

const mockServicos = [
  {
    id: 1,
    nome: 'Locação de Guindaste',
    categoria: 'Locação',
    area: 'Mecânica',
    fornecedorPreferencial: true,
    emUso: true,
    sla: '24h para mobilização',
    tipoCobranca: 'Diária'
  },
  {
    id: 2,
    nome: 'Serviço de Manutenção Elétrica',
    categoria: 'Manutenção',
    area: 'Elétrica',
    fornecedorPreferencial: false,
    emUso: false,
    sla: '48h para atendimento emergencial',
    tipoCobranca: 'Por demanda'
  },
];

export default function ListaServicos() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('servicos');
  const [busca, setBusca] = useState('');

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  const servicosFiltrados = mockServicos.filter(servico =>
    servico.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Lista de Serviços Cadastrados
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main className="p-6 w-full max-w-[1200px] mx-auto">
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold text-[#5a0d0d]">Serviços Cadastrados</h2>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria / Área</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cobrança</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferencial</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servicosFiltrados.map((servico) => (
                  <tr key={servico.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-[#5a0d0d]">{servico.nome}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{servico.categoria} / {servico.area}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{servico.sla}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{servico.tipoCobranca}</td>
                    <td className="px-4 py-2">
                      {servico.emUso ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle size={14} /> Em uso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Clock size={14} /> Já utilizado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {servico.fornecedorPreferencial && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                          <Star size={14} /> Preferencial
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>9
            </table>

          </div>
        </main>
      </div>
    </div>
  );
}

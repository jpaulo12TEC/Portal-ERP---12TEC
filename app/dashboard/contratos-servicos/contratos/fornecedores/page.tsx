'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '../../../../../components/ui/separator';
import { Search, Users, Plus, XCircle, FilePlus2, ArrowLeft } from 'lucide-react';
import Sidebar from '../../../../../components/Sidebar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function FornecedoresPage() {
  const [activeTab, setActiveTab] = useState<string>('contratos');
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const router = useRouter();

  const supabase = createClientComponentClient();

useEffect(() => {
  const fetchFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('id, nome_fantasia, categoria') // ajuste os nomes das colunas conforme seu schema
      .order('nome_fantasia', { ascending: true }); // ordem decrescente

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } else {
      setFornecedores(data || []);
    }
  };


    fetchFornecedores();
  }, [supabase]);

  const fornecedoresFiltrados = fornecedores.filter((f) =>
    f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error('Erro ao navegar:', error);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'} ${isModalOpen ? 'backdrop-blur-lg' : ''}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] px-4 py-2 text-white shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all shadow"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <span className="text-sm font-medium">Gerenciamento de Contratos</span>
        </div>

        <div className="relative w-full max-w-md mx-4">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-[34px] pl-10 pr-4 text-sm rounded-full bg-white text-black border-none focus:ring-2 focus:ring-[#5a0d0d]"
          />
          <Search className="absolute left-3 top-[8px] text-gray-500" size={16} />
        </div>

        <div className="flex-shrink-0">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px]" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className="p-8 w-full max-w-[1100px] mx-auto">
          <h2 className="text-2xl font-bold text-[#2b0000] mb-6">Gestão de Fornecedores</h2>

          {/* Ações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <ActionCard
              icon={<Plus className="w-5 h-5" />}
              label="Cadastrar Fornecedor"
              onClick={() => router.push('/dashboard/contratos-servicos/contratos/fornecedores/cadastrar')}
            />
            <ActionCard
              icon={<XCircle className="w-5 h-5" />}
              label="Desabilitar Fornecedor"
              onClick={() => router.push('/dashboard/contratos-servicos/contratos/fornecedores/desabilitar')}
            />
            <ActionCard
              icon={<FilePlus2 className="w-5 h-5" />}
              label="Incluir Produto ou Serviço"
              onClick={() => router.push('/dashboard/contratos-servicos/contratos/fornecedores/produtos-servicos')}
            />
            <ActionCard
              icon={<FilePlus2 className="w-5 h-5" />}
              label="Atualizar"
              onClick={() => window.location.reload()}
            />
          </div>

          {/* Lista de Fornecedores */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#5a0d0d] mb-2">Lista de Fornecedores</h3>
            <Separator className="mb-4" />

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full h-[38px] bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d] text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            </div>

            <ul className="space-y-3">
              {fornecedoresFiltrados.map((fornecedor) => (
                <li
                  key={fornecedor.id}
                  className="bg-white p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:border-[#5a0d0d] hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/contratos-servicos/contratos/fornecedores/${fornecedor.id}`)}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#5a0d0d]">{fornecedor.nome_fantasia}</p>
                    <p className="text-xs text-gray-500">{fornecedor.categoria}</p>
                  </div>
                  <Users className="w-4 h-4 text-[#5a0d0d]" />
                </li>
              ))}

              {fornecedoresFiltrados.length === 0 && (
                <li className="bg-gray-50 p-4 border border-dashed border-gray-300 text-sm text-gray-500 italic rounded-xl text-center">
                  Nenhum fornecedor encontrado.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      className="border border-[#5a0d0d] rounded-xl p-5 bg-white text-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white cursor-pointer shadow-sm transition-all flex flex-col items-center justify-center text-center"
      onClick={onClick}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

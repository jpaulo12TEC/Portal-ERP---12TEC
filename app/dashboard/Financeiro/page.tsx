'use client';

import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import TabelaProvisao from '../../../components/TabelaProvisao';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, PlusCircle, Trash2, Calendar, LineChart, Repeat, Package, FilePlus, FolderKanban, Wallet, BarChart3, ClipboardList, FileText } from "lucide-react";
import { CompraCadastro } from "@/components/FormulariodeCompra";
import FinanceForm from "@/components/Cadastrodespesa";
import HistoricoLancamentos from '@/components/HistoricoLancamentos';
import Resumo from '@/components/Resumo';
import ProdutosAnalise from "@/components/catalogoprodutos";


export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Financeiro');
  const router = useRouter();

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

  const cards = [

    { id: "Lançamentos", title: "Lançamentos", icon: <ClipboardList size={32} />, component: <HistoricoLancamentos /> },
{ id: "resumo", title: "Resumo", icon: <Wallet size={32} />, component: <Resumo /> },

{ id: "filtros", title: "Previsão de Pagamentos", icon: <Calendar size={32} />, component: <TabelaProvisao /> },
{ id: "cadastrocompra", title: "Cadastro de Compra", icon: <FilePlus size={32} />, component: <CompraCadastro /> },
{ id: "despesas", title: "Despesas Recorrentes", icon: <Repeat size={32} />, component: <FinanceForm /> },
{ id: "produtos", title: "Catálogo", icon: <Package size={32} />, component: <ProdutosAnalise /> },

  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Departamento Financeiro e Análises
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex p-0 bg-white">
        <Sidebar
          onNavClickAction={handleNavClick}
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>

          {/* Cards em grid */}
          {!selectedTab && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedTab(card.id)}
                  className="cursor-pointer bg-white rounded-2xl shadow-md border hover:shadow-xl hover:-translate-y-1 transition-all p-6 flex flex-col items-center justify-center text-center"
                >
                  <div className="mb-4 text-[#5a0d0d]">{card.icon}</div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                </div>
              ))}
            </div>
          )}

          {/* Conteúdo do card selecionado */}
          {selectedTab && (
<div>
  <button
    onClick={() => setSelectedTab(null)}
    className="group mb-6 flex items-center gap-3 px-6 py-3 
               rounded-xl bg-white/10 backdrop-blur-md border border-white/20
               text-gray-800 font-medium shadow-lg hover:shadow-xl 
               hover:bg-white/20 transition-all duration-300"
  >
    <ArrowLeft 
      size={22} 
      className="text-red-900 group-hover:-translate-x-1 transition-transform duration-300" 
    />
    <span className="text-base tracking-wide">Voltar aos Cards</span>
  </button>

  {cards.find((c) => c.id === selectedTab)?.component}
</div>

          )}
        </div>
      </div>
    </div>
  );
}

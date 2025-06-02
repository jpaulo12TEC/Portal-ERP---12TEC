'use client';

import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import TabelaProvisao from '../../../components/TabelaProvisao'; // Importe o componente
import { useRouter } from 'next/navigation';
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { LineChart } from "lucide-react";
import { CompraCadastro } from "@/components/FormulariodeCompra";
import FinanceForm from "@/components/Cadastrodespesa";
import HistoricoLancamentos from '@/components/HistoricoLancamentos';
import Resumo from '@/components/Resumo'  // caminho relativo do arquivo Resumo
import GraficoCompras from '@/components/Analise'

export default function Dashboard() {
  // Estado para controlar qual componente exibir
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [menuActive, setMenuActive] = useState(false); // Estado para o menu
  const [activeTab, setActiveTab] = useState<string>('Financeiro'); // Estado para o item ativo
  const router = useRouter();

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab); // Atualiza o tab ativo
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };
  const handleBarras = async (tab: string) => {
      setSelectedTab(tab); // Atualiza o estado do componente selecionado
  };

  

  return (
<div className={`flex flex-col h-screen `}>
      {/* Topbar */}
<div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"} `}>
  <div className="flex space-x-4  w-full h-[40px] items-center">
    
    {/* Botão de retorno estilizado */}
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

      {/* Passando a função handleNavClick como onNavClickAction */}
      <Sidebar 
        className="" 
        onNavClickAction={handleNavClick} 
        menuActive={menuActive}  // Passando o estado para o Sidebar
        setMenuActive={setMenuActive}  // Passando a função de set para o Sidebar
        activeTab={activeTab}  // Passando o estado de item ativo
      />

      <div className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
<div className="mb-6">


<h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
  <span className="block w-1 h-8 bg-red-900 rounded"></span>
  
  Planejamento de Pagamentos
</h1>

</div>





        {/* Botões de navegação modernos */}
<div className="flex border-b border-gray-300 mb-4">
    <button
    onClick={() => handleBarras("Lançamentos")}
    className={`${
      selectedTab === "Lançamentos"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Lançamentos
  </button>
    <button
    onClick={() => handleBarras("resumo")}
    className={`${
      selectedTab === "resumo"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Resumo
  </button>
  <button
    onClick={() => handleBarras("analise")}
    className={`${
      selectedTab === "analise"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Análise
  </button>
  <button
    onClick={() => handleBarras("filtros")}
    className={`${
      selectedTab === "filtros"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Previsão de pagamentos
  </button>
    <button
    onClick={() => handleBarras("cadastrocompra")}
    className={`${
      selectedTab === "cadastrocompra"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Cadastro de compra
  </button>
      <button
    onClick={() => handleBarras("despesas")}
    className={`${
      selectedTab === "despesas"
        ? "border-b-4 border-blue-600 text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    } px-4 py-2 font-semibold transition`}
  >
    Incluir recorrente
  </button>
</div>

        {/* Renderizar o componente TabelaProvisao apenas se "filtros" for o botão selecionado */}
        {selectedTab === "filtros" && <TabelaProvisao />}
        {selectedTab === "cadastrocompra" && <CompraCadastro />}
        {selectedTab === "despesas" && <FinanceForm />}
        {selectedTab === "Lançamentos" && <HistoricoLancamentos />}
        {selectedTab === "resumo" && <Resumo />}
        {selectedTab === "analise" && <GraficoCompras />}
        
         
      </div>
    </div>
    </div>
  );
}

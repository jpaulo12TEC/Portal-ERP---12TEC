'use client';

import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import TabelaProvisao from '../../../components/TabelaProvisao'; // Importe o componente
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  // Estado para controlar qual componente exibir
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [menuActive, setMenuActive] = useState(true); // Estado para o menu
  const [activeTab, setActiveTab] = useState<string>('Compras'); // Estado para o item ativo
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
        <h1 className="text-2xl font-bold mb-6">Previsão de Pagamentos</h1>

        {/* Botões de navegação modernos */}
        <div className="flex gap-0 w-[100%] mb-4">
          <button
            onClick={() => handleBarras("analise")}
            className={`${
              selectedTab === "analise" ? "bg-blue-950" : "bg-gradient-to-r from-gray-400 to-gray-600"
            } text-white h-[30px] shadow-lg transform hover:scale-104 hover:z-10 transition-all duration-300 ease-in-out w-full relative`}
          >
            Análise
          </button>
          <button
            onClick={() => handleBarras("filtros")}
            className={`${
              selectedTab === "filtros" ? "bg-red-950" : "bg-gradient-to-r from-gray-400 to-gray-600"
            } text-white h-[30px]  shadow-lg transform hover:scale-103 hover:z-10 transition-all duration-300 ease-in-out w-full relative`}
          >
            Banco de dados
          </button>
        </div>

        {/* Renderizar o componente TabelaProvisao apenas se "filtros" for o botão selecionado */}
        {selectedTab === "filtros" && <TabelaProvisao />}
        {selectedTab === "analise" && <div>Componente Análise</div>}
        {selectedTab === "bd-financeiro" && <div>Componente BD e Financeiro</div>}
      </div>
    </div>
  );
}

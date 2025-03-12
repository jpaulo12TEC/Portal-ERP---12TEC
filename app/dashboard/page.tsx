'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Search } from "lucide-react";

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(''); // Página atual
  const [menuActive, setMenuActive] = useState(false); // Para controlar se o menu está aberto ou não
  const [activeTab, setActiveTab] = useState(''); // Estado para o tab ativo
  const router = useRouter();

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab); // Atualiza o tab ativo
      setCurrentPage(tab); // Atualiza a página atual
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Menu Superior */}
      <div className="flex items-center justify-between bg-[#5f0202] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px]"> {/* Usando space-x-4 para espaçar os itens na horizontal */}
          
          {/* Botão "Departamento de Compras" com fundo diferente */}
          <div className="px-10 py-3 mr-[0px] bg-[#200101] h-[50px]">
            <button className="w-full text-left hover:text-gray-300">Departamento de Compras</button>
          </div>

          {/* Divisão entre os botões */}
          <div className="border-r-1 border-white h-auto"></div>

          {/* Botão "Pedido de Compra" */}
          <div className="px-4 py-2 bg-[#5f0202]">
            <button className="w-full text-left text-sm hover:text-gray-300">Pedido de Compra</button>
          </div>

          <div className="border-r-1 border-white h-auto"></div>

          {/* Botão "Nova Ordem" */}
          <div className="px-4 py-2 bg-[#5f0202]">
            <button className="w-full text-left text-sm hover:text-gray-300">Nova Ordem</button>
          </div>

          <div className="border-r-1 border-white h-auto"></div>

          {/* Botão "Previsão de Pagamento" */}
          <div className="px-4 py-2 bg-[#5f0202]">
            <button className="w-full text-left text-sm hover:text-gray-300">Previsão de Pagamento</button>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative w-full max-w-[400px] ml-6 mr-70"> {/* Ajuste da largura */}
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        {/* Logo da empresa no canto direito */}
        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar 
          onNavClickAction={handleNavClick} 
          className="h-full" 
          menuActive={menuActive} // Passando o estado menuActive
          setMenuActive={setMenuActive} // Passando a função setMenuActive
          activeTab={activeTab} // Passando o estado da tab ativa
        />

        <div className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>  
          <h1 className="text-2xl font-bold">Bem-vindo ao Dashboard</h1>
        </div>
      </div>
    </div>
  );
}

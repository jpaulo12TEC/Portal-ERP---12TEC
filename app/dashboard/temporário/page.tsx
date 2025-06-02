'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado



export default function Dashboard() {
  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState(''); // Página atual
  const [menuActive, setMenuActive] = useState(false); // Para controlar se o menu está aberto ou não
  const [activeTab, setActiveTab] = useState(''); // Estado para o tab ativo
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  



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
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-sm" : ""}`}>
       {/* Topbar */}
       <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
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
        Admissão de colaborador
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

      <div className="flex flex-1">
        <Sidebar 
          onNavClickAction={handleNavClick} 
          className="h-full" 
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        


        
      </div>
    </div>
  );
}

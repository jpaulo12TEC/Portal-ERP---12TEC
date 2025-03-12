'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

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
    <div className="flex h-screen">
      <Sidebar 
        onNavClickAction={handleNavClick} 
        className="h-full" 
        menuActive={menuActive} // Passando o estado menuActive
        setMenuActive={setMenuActive} // Passando a função setMenuActive
        activeTab={activeTab} // Passando o estado da tab ativa
      />

<div className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
        <main className="p-6">
          <h1 className="text-2xl font-bold">Bem-vindo ao Dashboard</h1>

          {currentPage === 'Compras' && <div>📊 Previsão de Pagamentos</div>}
          {currentPage === 'RH' && <div>🛒 Lista de Compras</div>}
          {currentPage === 'novaCompra' && <div>➕ Cadastrar Nova Compra</div>}
        </main>
      </div>
    </div>
  );
}

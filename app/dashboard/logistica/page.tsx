'use client';

import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Truck, Upload, Download, ClipboardList } from "lucide-react";

export default function RomaneioPage() {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Logística');
  const router = useRouter();

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

  // Cards para Romaneio
const cards = [
  { id: "entradas", title: "Entradas", icon: <Upload size={32} />, route: "/dashboard//logistica/entradas" },
  { id: "saidas", title: "Saídas", icon: <Download size={32} />, route: "/dashboard/logistica/saidas" },
  { id: "relatorios", title: "Relatórios de Romaneio", icon: <ClipboardList size={32} />, route: "/dashboard//logistica/relatorioromaneio" },
];

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div
        className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${
          menuActive ? "ml-[300px]" : "ml-[80px]"
        }`}
      >
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
              Logística – Romaneio
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
          <img
            src="/Logobranca.png"
            alt="Logo da Empresa"
            className="h-[40px] w-auto"
          />
        </div>
      </div>

      <div className="flex p-0 bg-white">
        <Sidebar
          onNavClickAction={handleNavClick}
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div
          className={`content flex-1 p-6 min-h-screen ${
            menuActive ? "ml-[300px]" : "ml-[80px]"
          }`}
        >
          {/* Cards */}
          {!selectedTab && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
<div
  key={card.id}
  onClick={() => router.push(card.route)}
  className="cursor-pointer bg-white rounded-2xl shadow-md border hover:shadow-xl hover:-translate-y-1 transition-all p-6 flex flex-col items-center justify-center text-center"
>
  <div className="mb-4 text-[#5a0d0d]">{card.icon}</div>
  <h2 className="text-lg font-semibold">{card.title}</h2>
</div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

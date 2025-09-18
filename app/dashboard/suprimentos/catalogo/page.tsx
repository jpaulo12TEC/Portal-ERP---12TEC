'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Box } from "lucide-react";
import ProdutosAnalise from "@/components/catalogoprodutos";

export default function Catalogo() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => router.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Catálogo de Produtos
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
        {/* Sidebar */}
        <Sidebar
          onNavClickAction={() => {}}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={"Compras"}
        />

        {/* Conteúdo principal */}
        <main className="flex-1 p-4 overflow-auto">
          <ProdutosAnalise />
        </main>
      </div>
    </div>
  );
}

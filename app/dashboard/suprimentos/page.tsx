'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from '../../../components/Sidebar';
import { ShoppingCart, Box, ClipboardList, CalendarCheck, FileText  } from 'lucide-react';
import AcompanhamentoPedidos from '@/components/Acompanhamentodepedidos';


export default function Compras() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);

  const avisos = [
    { title: 'Pedido atrasado', description: 'Pedido nº 00120 ainda não entregue.' },
    { title: 'Material em falta', description: 'Falta de tinta vermelha no estoque.' },
    { title: 'Novo fornecedor', description: 'Fornecedor XYZ homologado esta semana.' },
  ];

  const acoes = [
    { label: 'Pedido de Compra', path: '/dashboard/suprimentos/pedidos', icon: ShoppingCart },
    { label: 'Catálogo de Produtos', path: '/dashboard/compras/catalogo', icon: Box },
    { label: 'Estoque', path: '/dashboard/compras/estoque', icon: ClipboardList },
    { label: 'Inventário', path: '/dashboard/compras/inventario', icon: ClipboardList },
    { label: 'Acompanhamento', path: '/dashboard/compras/acompanhamento', icon: CalendarCheck },
    { label: 'Documentos de Compra', path: '/dashboard/compras/documentos', icon: FileText },
  ];


return (
  <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
    {/* Topbar */}
    <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
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
            Departamento de Compras
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
        onNavClickAction={() => {}}
        className="h-full"
        menuActive={menuActive}
        setMenuActive={setMenuActive}
        activeTab={'Suprimentos'}
      />

      <div className="p-6 w-[85%] mx-auto space-y-6">
        {/* Ações rápidas */}
        <div>
          <h3 className="text-lg font-semibold text-[#5a0d0d] mb-4">Ações rápidas</h3>
          <div className="flex flex-wrap gap-4">
            {acoes.map(({ label, path, icon: Icon }) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                className="w-[140px] h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow hover:shadow-lg transition-all bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white"
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Linha divisória */}
        <hr className="border-t border-gray-300 my-6" />

        {/* Quadro de acompanhamento de pedidos */}
        <div>
          <h3 className="text-lg font-semibold text-[#5a0d0d] mb-4">Acompanhamento de Pedidos</h3>
          <AcompanhamentoPedidos />
        </div>
      </div>
    </div>
  </div>
);
}

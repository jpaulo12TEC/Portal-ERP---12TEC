'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from '../../../components/Sidebar';
import { FileText, ShoppingCart, Box, ClipboardList, CalendarCheck, PlusCircle, Trash2 } from 'lucide-react';

export default function Compras() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);

  // Fake data para demonstração
  const pedidos = [
    {
      numero: '00123',
      solicitante: 'João Silva',
      materiais: 'Parafusos, Porcas, Chapas',
      destino: 'Armazém Central',
      status: 'Em andamento',
      ultimaObs: 'Aguardando aprovação',
      link: '#',
      telefone: '(79) 99999-9999',
    },
    {
      numero: '00124',
      solicitante: 'Maria Souza',
      materiais: 'Tintas, Rolos',
      destino: 'Filial 2',
      status: 'Concluído',
      ultimaObs: 'Recebido pelo setor',
      link: '#',
      telefone: '(79) 98888-8888',
    },
  ];

  const avisos = [
    { title: 'Pedido atrasado', description: 'Pedido nº 00120 ainda não entregue.' },
    { title: 'Material em falta', description: 'Falta de tinta vermelha no estoque.' },
    { title: 'Novo fornecedor', description: 'Fornecedor XYZ homologado esta semana.' },
  ];

  const acoes = [
    { label: 'Pedido de Compra', path: '/dashboard/compras/pedidos', icon: ShoppingCart },
    { label: 'Catálogo de Produtos', path: '/dashboard/compras/catalogo', icon: Box },
    { label: 'Estoque', path: '/dashboard/compras/estoque', icon: ClipboardList },
    { label: 'Inventário', path: '/dashboard/compras/inventario', icon: ClipboardList },
    { label: 'Acompanhamento', path: '/dashboard/compras/acompanhamento', icon: CalendarCheck },
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

        <div className="p-6 w-full max-w-[1200px] mx-auto space-y-6">
          
          {/* Ações rápidas */}
          <div>
            <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Ações Rápidas</h2>
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

          {/* Quadro de acompanhamento de pedidos */}
          <div>
            <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Acompanhamento de Pedidos</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Pedido nº', 'Solicitante', 'Lista de Materiais', 'Destino', 'Status', 'Última Obs', 'Link', 'Contato'].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map((pedido, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{pedido.numero}</td>
                      <td className="px-4 py-2 text-sm">{pedido.solicitante}</td>
                      <td className="px-4 py-2 text-sm">{pedido.materiais}</td>
                      <td className="px-4 py-2 text-sm">{pedido.destino}</td>
                      <td className="px-4 py-2 text-sm">{pedido.status}</td>
                      <td className="px-4 py-2 text-sm">{pedido.ultimaObs}</td>
                      <td className="px-4 py-2 text-sm">
                        <a href={pedido.link} className="text-blue-600 hover:underline">Acompanhar</a>
                      </td>
                      <td className="px-4 py-2 text-sm">{pedido.telefone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Avisos e Lembretes */}
          <div>
            <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Avisos e Lembretes</h2>
            <div className="flex flex-col gap-4">
              {avisos.map(({ title, description }, idx) => (
                <div key={idx} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-sm font-semibold text-[#5a0d0d]">{title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

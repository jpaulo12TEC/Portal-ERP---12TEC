'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { Separator } from "../../../components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { FilePlus, FileText, ClipboardList, FolderKanban, ListChecks } from 'lucide-react';

export default function PaginaInicialContratos() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('contratos');
  const [menuActive, setMenuActive] = useState(false);

  const botoesPrincipais = [
    {
      label: 'Solicitar nova contratação',
      icon: FilePlus,
      path: '/dashboard/contratos-servicos/solicitacao'
    },
    {
      label: 'Contratos ativos',
      icon: FileText,
      path: '/dashboard/contratos/ativos'
    },
    {
      label: 'Verificar solicitação',
      icon: ClipboardList,
      path: '/dashboard/contratos-servicos/acompanhar-solicitacao'
    },
    {
      label: 'Gestão de contratos',
      icon: FolderKanban,
      path: '/dashboard/contratos-servicos/contratos' // página do código que você colou
    },
        {
      label: 'Serviços Cadastrados',
      icon: ListChecks,
      path: '/dashboard/contratos-servicos/servicos-cadastrados'
    },
  ];

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <span className="w-full text-left">Menu de Contratos</span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className="p-6 w-full max-w-[1100px] mx-auto">
          <h3 className="text-lg font-semibold mb-4">Selecione uma opção</h3>
          <Separator className="mb-6" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {botoesPrincipais.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => router.push(path)}
                className="h-[120px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
              >
                <Icon className="w-8 h-8 mb-3" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

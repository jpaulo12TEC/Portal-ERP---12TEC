'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { Separator } from "../../../components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { FileText, FilePlus, ClipboardList, ListChecks, Folder, BarChart, AlertCircle, CheckSquare } from 'lucide-react';

export default function PaginaQualidade() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Qualidade');
  const [menuActive, setMenuActive] = useState(false);

  const botoesPrincipais = [
    { label: 'Documentos da Qualidade', icon: FileText, path: '/dashboard/qualidade/formularios' },
    { label: 'Sugestões / Reclamações', icon: AlertCircle, path: '/dashboard/qualidade/sugestoes' },
    { label: 'Indicadores de Desempenho', icon: BarChart, path: '/dashboard/qualidade/indicadores' },
    { label: 'Auditorias', icon: CheckSquare, path: '/dashboard/qualidade/auditorias' },
    { label: 'Relatórios NC', icon: ClipboardList, path: '/dashboard/qualidade/nc' },
    { label: 'Ações Corretivas e Preventivas', icon: FilePlus, path: '/dashboard/qualidade/acp' },
    { label: 'Controle de Documentos', icon: Folder, path: '/dashboard/qualidade/documentos' },
    { label: 'Treinamentos / Certificações', icon: ListChecks, path: '/dashboard/qualidade/treinamentos' },
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
            <span className="w-full text-left">Menu Qualidade</span>
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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

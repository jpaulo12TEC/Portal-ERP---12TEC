'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from "lucide-react";
import { useUser } from '@/components/UserContext';
import Sidebar from '../../../components/Sidebar';
import {
  FileText,
  UserPlus,
  LayoutDashboard,
  UserX,
  CalendarCheck,
  PlusCircle,
  Trash2  
} from 'lucide-react';



export default function AdmissaoColaborador() {
  const { nome } = useUser();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Pessoal');
  const router = useRouter();
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);



  

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
              Departamento de Gestão de Pessoas
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
          activeTab={activeTab}
        />

<div className="p-6 w-full max-w-[1100px] mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    
<div>
  <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Ações Rápidas</h2>
  <div className="flex flex-wrap gap-4">
    {[
      {
        label: 'Documentação',
        path: '/dashboard/RH/documentacaodoscolaboradores',
        icon: FileText,
      },
      {
        label: 'Admissão',
        path: '/dashboard/RH/admissao',
        icon: UserPlus,
      },
      {
        label: 'Visão Geral',
        path: '/visao-geral',
        icon: LayoutDashboard,
      },
      {
        label: 'Demissão',
        path: '/demissao',
        icon: UserX,
      },
      {
        label: 'Férias',
        path: '/ferias',
        icon: CalendarCheck,
      },
            {
        label: 'Adicionar Aviso',
        path: '/novo-aviso',
        icon: PlusCircle,
      },
              {
    label: 'Remover Aviso',
    path: '/remover-aviso',
    icon: Trash2,
    type: 'delete',
  },


].map(({ label, path, icon: Icon, type }) => (
  <button
    key={label}
    onClick={() => router.push(path)}
    className={`w-[110px] h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow transition-all
      ${
        type === 'add'
          ? 'bg-[#5a0d0d] text-white hover:bg-[#7a1a1a]'
          : type === 'delete'
          ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-600 hover:text-white'
          : 'bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white'
      }`}
  >
    <Icon className="w-6 h-6 mb-2" />
    <span className="text-xs font-medium">{label}</span>
  </button>
))}
  </div>
</div>

    {/* Avisos e Lembretes (sem ícones) */}
    <div>
      <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Avisos e Lembretes</h2>
      <div className="flex flex-col gap-4">
        {[
          {
            title: 'Entrevista agendada',
            description: 'Hoje às 14h com João Mendes - sala 2B',
          },
          {
            title: 'Documento pendente',
            description: 'Faltando RG do colaborador Ana P.',
          },
          {
            title: 'Reunião de equipe',
            description: 'Amanhã às 10h - Alinhar planos de férias',
          },
          {
            title: 'Contrato expirando',
            description: 'Contrato do colaborador Pedro vence em 5 dias',
          },
        ].map(({ title, description }, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <h3 className="text-sm font-semibold text-[#5a0d0d]">{title}</h3>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          </div>
        ))}
      </div>
    </div>

  </div>
</div>









</div>


      </div>
    
  );
}

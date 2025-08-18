'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Separator } from "../../../../components/ui/separator"
import { FaClipboardList, FaTasks, FaFileAlt, FaUserCheck } from "react-icons/fa";
import {
  FilePlus,
  ClipboardList,
  FileSignature,
  BarChart3,
  Clock10,
  Search,
  Paperclip,
  FileEdit,
  History,
  CheckSquare,
  ListChecks,
  Users,
  CalendarCheck,
  Star
} from 'lucide-react';
import Sidebar from '../../../../components/Sidebar';
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado


export default function Contratos() {
  const router = useRouter();

const [activeTab, setActiveTab] = useState<string>('contratos'); // Estado para o item ativo
const [menuActive, setMenuActive] = useState(false); // Estado para o menu

  const [isModalOpen, setIsModalOpen] = useState(false);

    const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab); // Atualiza o tab ativo
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

const botoesContratos = [
  // 📘 Fase 1 - PRÉ-CONTRATUAL
    {
    label: 'Cotação e Orçamentos',
    path: '/dashboard/contratos-servicos/contratos/servicos-produtos',
    icon: ListChecks, // você pode importar esse ícone
  },
  {
    label: 'Iniciar Contrato',
    path: '/dashboard/contratos-servicos/contratos/iniciar',
    icon: FilePlus,
  },
  {
    label: 'Elaboração e Ajustes',
    path: '/dashboard/contratos-servicos/contratos/elaboracao',
    icon: FileSignature,
  },
  {
    label: 'Checklist Pré-Assinatura',
    path: '/dashboard/contratos-servicos/contratos/checklist',
    icon: CheckSquare,
  },
  {
    label: 'Fornecedores',
    path: '/dashboard/contratos-servicos/contratos/fornecedores',
    icon: Users, // você pode importar esse ícone
  },

  // ⚙️ Fase 2 - EXECUÇÃO CONTRATUAL
  {
    label: 'Gerenciar Contratos',
    path: '/dashboard/contratos-servicos/contratos/gerenciar',
    icon: ClipboardList,
  },
  {
    label: 'Compromissos Contratuais',
    path: '/dashboard/contratos-servicos/contratos/obrigacoes',
    icon: CalendarCheck, // importar esse ícone
  },
  {
    label: 'Termos Aditivos',
    path: '/dashboard/contratos-servicos/contratos/aditivos',
    icon: FileEdit,
  },
  {
    label: 'Anexos',
    path: '/dashboard/contratos-servicos/contratos/anexos',
    icon: Paperclip,
  },
  {
    label: 'Alertas/Vencimentos',
    path: '/dashboard/contratos-servicos/contratos/alertas',
    icon: Clock10,
  },

  // 📤 Fase 3 - ENCERRAMENTO
  {
    label: 'Histórico de Revisões',
    path: '/dashboard/contratos-servicos/contratos/historico',
    icon: History,
  },

  // 📊 Fase 4 - SUPORTE E GOVERNANÇA
  {
    label: 'Score de Fornecedores',
    path: '/dashboard/contratos-servicos/contratos/avaliacoes',
    icon: Star, // importar esse ícone
  },
  {
    label: 'Relatórios',
    path: '/dashboard/contratos-servicos/contratos/relatorios',
    icon: BarChart3,
  },
  {
    label: 'Buscar Contrato',
    path: '/dashboard/contratos-servicos/contratos/buscar',
    icon: Search,
  },
];


  return (
<div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-lg" : ""}`}>
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
        Gerenciamento de Contratos
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

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar 
          onNavClickAction={handleNavClick} 
          className="h-full" 
          menuActive={menuActive} // Passando o estado menuActive
          setMenuActive={setMenuActive} // Passando a função setMenuActive
          activeTab={activeTab} // Passando o estado da tab ativa
        />

        <div className="p-6 w-full max-w-[1100px] mx-auto">
        
<div className="space-y-6">
  {/* Fase 1 - Pré-Contratual */}
  <div className="mb-20">
    <h3 className="text-sm text-gray-600 font-semibold mb-2 mt-2">Pré-Contratual</h3>
        <Separator className="mb-4" />
     <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {botoesContratos.slice(0, 5).map(({ label, path, icon: Icon }) => (
        <button
          key={label}
          onClick={() => router.push(path)}
          className="w-full h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
        >
          <Icon className="w-6 h-6 mb-2" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  </div>

  {/* Fase 2 - Execução */}
  <div className="mb-20">
    <h3 className="text-sm text-gray-600 font-semibold mb-2 mt-4">Execução Contratual</h3>
    <Separator className="mb-4" />
     <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {botoesContratos.slice(5, 10).map(({ label, path, icon: Icon }) => (
        <button
          key={label}
          onClick={() => router.push(path)}
          className="w-full h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
        >
          <Icon className="w-6 h-6 mb-2" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  </div>



  {/* Fase 3 - Suporte e Governança */}
  <div className="mb-10">
    <h3 className="text-sm text-gray-600 font-semibold mb-2 mt-4">Suporte e Governança</h3>
    <Separator className="mb-4" />
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4  ">
      {botoesContratos.slice(10).map(({ label, path, icon: Icon }) => (
        <button
          key={label}
          onClick={() => router.push(path)}
          className="w-full h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
        >
          <Icon className="w-6 h-6 mb-2" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  </div>
</div>

        </div>
      </div>
    </div>
  );
}

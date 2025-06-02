'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado
import { supabase } from '../../../../lib/superbase';




export default function Dashboard() {
  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState(''); // Página atual
  const [menuActive, setMenuActive] = useState(false); // Para controlar se o menu está aberto ou não
  const [activeTab, setActiveTab] = useState(''); // Estado para o tab ativo
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  

  const DOCUMENTOS_OBRIGATORIOS = [
    "RG",
    "CPF",
    "Comprovante de residência",
    "CTPS",
    "Certificado de Reservista",
    "Título de eleitor"
  ];


  useEffect(() => {
    async function carregarDados() {
      console.log("Iniciando carregamento de dados...");
      try {
        const { data: funcionarios, error: erro1 } = await supabase.from('funcionarios').select('*');
        if (erro1) {
          console.error("Erro ao buscar funcionários (Supabase):", erro1);
          return;
        }
  
        console.log("Funcionários carregados:", funcionarios); // <- Aqui está o console.log
  
        const { data: documentos, error: erro2 } = await supabase.from('documentoscolaboradores').select('*');
        if (erro2) {
          console.error("Erro ao buscar documentos (Supabase):", erro2);
          return;
        }
  
        const hoje = new Date();
        const resultado = funcionarios.map(func => {
          const docsFuncionario = documentos.filter(d => d.funcionario_id === func.id && d.valido);
  
          const comComentario = docsFuncionario.filter(d => d.comentario && d.comentario.trim() !== "").length;
  
          const vencidos = docsFuncionario.filter(d => {
            if (!d.vencimento) return false;
            const venc = new Date(d.vencimento);
            const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 30;
          }).length;
  
          const documentosPresentes = docsFuncionario.map(d => d.nome_documento);
          const faltando = DOCUMENTOS_OBRIGATORIOS.filter(doc => !documentosPresentes.includes(doc)).length;
  
          return {
            id: func.id, // <-- ADICIONE ISSO
            nome: func.nome_completo,
            cargo: func.cargo,
            departamento: func.departamento,
            tipo_regime: func.tipo_regime,
            vencidos,
            comComentario,
            faltando
          };
        });
  
        setColaboradores(resultado);
      } catch (erro) {
        console.error("Erro inesperado ao carregar dados:", erro);
      }
    }
  
    carregarDados();
  }, []);



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
        Documentação dos colaboradores
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

<div className="flex-1 p-6">
  {/* Botão Novo Documento */}


  {/* Tabela de colaboradores */}
 {/* Tabela moderna */}
 <div className="overflow-hidden rounded-lg shadow-md mt-10 border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200 bg-white">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome do colaborador</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Departamento</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo de regime</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documentos vencidos</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Docs com comentário</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Docs faltando</th>
        </tr>
      </thead>
<tbody className="divide-y divide-gray-100">
  {colaboradores.map((colab, index) => (
    <tr
      key={index}
      onClick={() => router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)}
      className="hover:bg-blue-50 cursor-pointer transition"
    >
      <td className="px-6 py-4 text-sm text-gray-800">{colab.nome}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
      <td className="px-6 py-4 text-sm font-semibold text-red-600">{colab.vencidos}</td>
      <td className="px-6 py-4 text-sm font-semibold text-yellow-600">{colab.comComentario}</td>
      <td className="px-6 py-4 text-sm font-semibold text-red-800">{colab.faltando}</td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
</div>


        
      </div>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { Search } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { ArrowLeft } from "lucide-react";
import { supabase } from '../../../../lib/superbase';

export default function Dashboard() {
const [showAtivos, setShowAtivos] = useState(true);
const [showDesligados, setShowDesligados] = useState(false);


  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState('');
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const router = useRouter();
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
      try {
        const { data: funcionarios } = await supabase.from('funcionarios').select('*');
        const { data: documentos } = await supabase.from('documentoscolaboradores').select('*');

        const hoje = new Date();

const resultado = (funcionarios || []).map(func => {
  const docsFuncionario = (documentos || []).filter(d => d.funcionario_id === func.id && d.valido);

  const comComentario = docsFuncionario.filter(d => d.comentario && d.comentario.trim() !== "").length;

  const vencidos = docsFuncionario.filter(d => {
    if (!d.vencimento) return false;
    const diff = (new Date(d.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

  const documentosPresentes = docsFuncionario.map(d => d.nome_documento);
  const faltando = DOCUMENTOS_OBRIGATORIOS.filter(doc => !documentosPresentes.includes(doc)).length;

  return {
    id: func.id,
    nome: func.nome_completo,
    cargo: func.cargo,
    departamento: func.departamento,
    tipo_regime: func.tipo_regime,
    situacao: func.situacao,
    vencidos,
    comComentario,
    faltando
  };
});

        setColaboradores(resultado);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      }
    }

    carregarDados();
  }, []);

  const handleNavClick = async (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(tab);
    router.push(`/dashboard/${tab}`);
  };

  const ativos = colaboradores.filter(c => c.situacao === "Ativo");
  const desligados = colaboradores.filter(c => c.situacao === "Desligado");

  const renderTabela = (lista: any[], cor: string) => (
    <div className="overflow-hidden rounded-lg shadow-md mt-6 border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Departamento</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo de regime</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vencidos</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Com comentário</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faltando</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lista.map((colab, index) => (
            <tr
              key={index}
              onClick={() => router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)}
              className="hover:bg-blue-50 cursor-pointer transition"
            >
              <td className="px-6 py-4 text-sm text-gray-800">{colab.nome}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
              <td className={`px-6 py-4 text-sm font-semibold ${cor}-600`}>{colab.vencidos}</td>
              <td className={`px-6 py-4 text-sm font-semibold ${cor}-500`}>{colab.comComentario}</td>
              <td className={`px-6 py-4 text-sm font-semibold ${cor}-800`}>{colab.faltando}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAccordion = (title: string, lista: any[], cor: string, show: boolean, setShow: (v: boolean) => void) => (
  <div className="mt-4 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
    <button
      onClick={() => setShow(!show)}
      className={`w-full flex justify-between items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors font-semibold text-gray-700`}
    >
      <span>{title} ({lista.length})</span>
      <span className={`transform transition-transform duration-200 ${show ? "rotate-90" : ""}`}>▶</span>
    </button>
    {show && renderTabela(lista, cor)}
  </div>
);

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
  {renderAccordion("Ativos", ativos, "green", showAtivos, setShowAtivos)}
  {renderAccordion("Desligados", desligados, "red", showDesligados, setShowDesligados)}
</div>

      </div>
    </div>
  );
}

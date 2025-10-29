'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { Search, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { supabase } from '../../../../lib/superbase';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

type Documento = {
  id: number;
  funcionario_id: number;
  nome_documento: string;
  nome_arquivo?: string | null;
  comentario?: string;
  vencimento?: string | null;
  valido: boolean;
};

export default function Dashboard() {
  const { nome } = useUser();
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Pessoal');
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [showAtivos, setShowAtivos] = useState(true);
  const [showDesligados, setShowDesligados] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('ativos'); // ativos, desligados, afastados


  const toggleSection = (section: string) => {
  setExpandedSection(expandedSection === section ? null : section);
};





const DOCUMENTOS_OBRIGATORIOS = {
  contratacao: (tipoRegime: string) => {
    if (tipoRegime === 'CLT') {
      return [
        "Acordo de Compensacao",
        "Acordo de Prorrogacao",
        "Contrato de Experiencia",
        "Declaracao Encargos de IR",
        "Ficha de Registro",
        "LGPD",
        "Opcao de Desistencia de VT",
        "Solicitacao de VT",
        "Termo de Responsabilidade",
      ];
    }

    if (tipoRegime === 'PJ') {
      return ["Contrato de Prestacao de Servico"];
    }

    return [];
  },
  identificacao: [
    "RG",
    "CPF",
    "CTPS - Digital",
    "E-Social",
    "Comprovante de Residencia",
    "Certidao de Nascimento ou Casamento",
    "Caderneta de Vacinação",
  ],
  competencia: ["Certificado de Curso"],
  seguranca: ["Ficha de EPI", "ASO", "Ordem de Serviço"],
};

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: funcionarios } = await supabase.from('funcionarios').select('*');
        const { data: documentos } = await supabase.from('documentoscolaboradores').select('*');
        const hoje = new Date();

        const resultado = (funcionarios || []).map(func => {
          const docsFuncionario = (documentos || []).filter(d => d.funcionario_id === func.id);
          const nomesDocsValidos = docsFuncionario
            .filter(d => d.valido && d.nome_arquivo)
            .map(d => d.nome_documento);

          const comComentario = docsFuncionario.filter(d => d.comentario?.trim()).length;
          const vencidos = docsFuncionario.filter(
            d => d.vencimento && (new Date(d.vencimento).getTime() - hoje.getTime()) / (1000*60*60*24) <= 30
          ).length;

          const docsNulos = docsFuncionario
            .filter(d => d.nome_arquivo == null || d.nome_arquivo.trim() === "")
            .map(d => d.nome_documento);

          const docsObrigatorios = [
            ...DOCUMENTOS_OBRIGATORIOS.contratacao(func.tipo_regime),
            ...DOCUMENTOS_OBRIGATORIOS.identificacao,
            ...DOCUMENTOS_OBRIGATORIOS.competencia,
            ...DOCUMENTOS_OBRIGATORIOS.seguranca
          ];

          const faltando = [...new Set([
            ...docsObrigatorios,
            ...docsNulos
          ])].filter(doc => !nomesDocsValidos.includes(doc));

          return {
            id: func.id,
            nome: func.nome_completo,
            cargo: func.cargo,
            departamento: func.departamento,
            tipo_regime: func.tipo_regime,
            situacao: func.situacao,
            comComentario,
            vencidos,
            faltando: faltando.length,
            documentosDetalhes: docsFuncionario,
            faltandoNomes: faltando
          };
        });

        setColaboradores(resultado);
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      }
    }
    carregarDados();
  }, []);

  const handleExportarPlanilha = () => {
    const linhas: any[] = [];

    colaboradores.forEach(colab => {
      // Faltando
      colab.faltandoNomes.forEach((doc: string) => {
        linhas.push({ "Colaborador": colab.nome, "Documento": doc, "Situação": "Faltando" });
      });

      // Vencidos
      colab.documentosDetalhes
        .filter((d: Documento) => d.vencimento && (new Date(d.vencimento).getTime() - new Date().getTime()) / (1000*60*60*24) <= 30)
        .forEach((d: Documento) => {
          linhas.push({ "Colaborador": colab.nome, "Documento": d.nome_documento, "Situação": "Vencido" });
        });

      // Com comentário
      colab.documentosDetalhes
        .filter((d: Documento) => d.comentario?.trim())
        .forEach((d: Documento) => {
          linhas.push({ "Colaborador": colab.nome, "Documento": d.nome_documento, "Situação": "Com Comentário" });
        });
    });

    if (linhas.length === 0) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documentos RH");
    XLSX.writeFile(workbook, "Documentos_Colaboradores.xlsx");
  };

  const ativos = colaboradores.filter(c => c.situacao === "Ativo");
  const desligados = colaboradores.filter(c => c.situacao === "Desligado");
  const afastados = colaboradores.filter(c => c.situacao === "Afastado");

  const resumo = {
    total: colaboradores.length,
    ativos: ativos.length,
    desligados: desligados.length,
    afastados: afastados.length,
    clt: colaboradores.filter(c => c.tipo_regime === "CLT").length,
    pj: colaboradores.filter(c => c.tipo_regime === "PJ").length,
    docsFaltando: colaboradores.reduce((acc, c) => acc + c.faltando, 0)
  };

  const handleToggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

const renderTabela = (lista: any[]) => (
  <div className="overflow-hidden rounded-lg shadow-md mt-3 border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200 bg-white">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Depto</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Regime</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vencidos</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Com Comentário</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faltando</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {lista.map(colab => (
          <React.Fragment key={colab.id}>
            <tr
              className="hover:bg-blue-50 transition cursor-pointer"
              onClick={() => handleToggleRow(colab.id)}
            >
              <td className="px-6 py-4 text-sm text-gray-800 flex items-center justify-between">
                {colab.nome}
                {expandedRow === colab.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
              <td className="px-6 py-4 text-sm font-semibold text-red-600">{colab.vencidos}</td>
              <td className="px-6 py-4 text-sm font-semibold text-blue-600">{colab.comComentario}</td>
              <td className="px-6 py-4 text-sm font-semibold text-orange-600">{colab.faltando}</td>
            </tr>

{expandedRow === colab.id && (
  <tr className="bg-gray-50 transition-all duration-300 relative">
    <td colSpan={7} className="px-6 py-4 relative">
      {/* Botão flutuante no canto superior direito */}
      <button
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-all"
        onClick={() => router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)}
      >
        <Eye className="w-4 h-4" />
        Ver Detalhes
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="font-semibold text-gray-800 mb-1">Vencidos</p>
          <ul className="list-disc ml-5 text-gray-700">
            {colab.documentosDetalhes
              .filter((d: Documento) =>
                d.vencimento && (new Date(d.vencimento).getTime() - new Date().getTime()) / (1000*60*60*24) <= 30
              )
              .map((d: Documento) => <li key={d.id}>{d.nome_documento} ({d.vencimento})</li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800 mb-1">Com Comentário</p>
          <ul className="list-disc ml-5 text-gray-700">
            {colab.documentosDetalhes
              .filter((d: Documento) => d.comentario?.trim())
              .map((d: Documento) => <li key={d.id}>{d.nome_documento}: {d.comentario}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800 mb-1">Faltando</p>
          <ul className="list-disc ml-5 text-gray-700">
            {colab.faltandoNomes.map((doc: string, i: number) => (
              <li key={i}>{doc}</li>
            ))}
          </ul>
        </div>
      </div>
    </td>
  </tr>
)}

          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button onClick={() => window.history.back()} className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">Documentação dos colaboradores</button>
          </div>
        </div>
        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black" />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>
        <div className="flex-shrink-0 ml-auto pr-4 flex items-center gap-2">

          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar menuActive={menuActive} setMenuActive={setMenuActive} activeTab="Pessoal" onNavClickAction={() => {}} />
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Resumo geral */}
{/* Resumo geral + Exportar */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
  <div className="bg-green-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">Total Colaboradores</p>
    <p className="text-2xl font-bold">{resumo.total}</p>
  </div>
  <div className="bg-blue-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">Ativos</p>
    <p className="text-2xl font-bold">{resumo.ativos}</p>
  </div>
  <div className="bg-red-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">Desligados</p>
    <p className="text-2xl font-bold">{resumo.desligados}</p>
  </div>
  <div className="bg-teal-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">Afastados</p>
    <p className="text-2xl font-bold">{resumo.afastados}</p>
  </div>
  <div className="bg-yellow-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">CLT</p>
    <p className="text-2xl font-bold">{resumo.clt}</p>
  </div>
  <div className="bg-purple-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">PJ</p>
    <p className="text-2xl font-bold">{resumo.pj}</p>
  </div>
  <div className="bg-orange-500 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center">
    <p className="text-sm font-medium">Docs Faltando</p>
    <p className="text-2xl font-bold">{resumo.docsFaltando}</p>
  </div>

  {/* Novo card elegante para exportar */}
  <div
    onClick={handleExportarPlanilha}
    className="bg-green-600 text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center cursor-pointer hover:bg-green-700 transition-all"
  >
    <FileSpreadsheet className="w-6 h-6 mb-1" />
    <p className="text-sm font-medium text-center">Exportar Planilha</p>
  </div>
</div>


{/* Tabela de Ativos */}
<div className="mt-6">
  <h2
    className="text-lg font-semibold text-blue-600 mb-2 cursor-pointer select-none"
    onClick={() => toggleSection('ativos')}
  >
    Ativos ({ativos.length})
  </h2>
  {expandedSection === 'ativos' && renderTabela(ativos)}
</div>

{/* Tabela de Desligados */}
{desligados.length > 0 && (
  <div className="mt-6">
    <h2
      className="text-lg font-semibold text-red-600 mb-2 cursor-pointer select-none"
      onClick={() => toggleSection('desligados')}
    >
      Desligados ({desligados.length})
    </h2>
    {expandedSection === 'desligados' && renderTabela(desligados)}
  </div>
)}

{/* Tabela de Afastados */}
{afastados.length > 0 && (
  <div className="mt-6">
    <h2
      className="text-lg font-semibold text-teal-600 mb-2 cursor-pointer select-none"
      onClick={() => toggleSection('afastados')}
    >
      Afastados ({afastados.length})
    </h2>
    {expandedSection === 'afastados' && renderTabela(afastados)}
  </div>
)}

        </div>
      </div>
    </div>
  );
}

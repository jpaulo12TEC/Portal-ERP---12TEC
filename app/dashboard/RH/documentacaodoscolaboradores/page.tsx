'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { Search, ArrowLeft } from "lucide-react";
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
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('ativos');
  const [colaboradores, setColaboradores] = useState<any[]>([]);

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

  identificacao: (tipoRegime: string) => {
    const base = [
      "RG",
      "CPF",
      "Comprovante de Residencia",
      "Certidao de Nascimento ou Casamento",
      "Caderneta de Vacinação",
    ];

    if (tipoRegime !== 'PJ') {
      base.push("CTPS - Digital", "E-Social");
    }

    return base;
  },

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
  const hoje = new Date();

  // Garante que DocumentosNDA é array
  const documentosNDA: string[] = Array.isArray(func.DocumentosNDA) ? func.DocumentosNDA : [];

  // Só considera documentos que NÃO estão no NDA
  const docsValidos = docsFuncionario.filter(d => !documentosNDA.includes(d.nome_documento));

  // Nomes dos documentos válidos com arquivo
  const nomesDocsValidos = docsValidos
    .filter(d => d.valido && d.nome_arquivo?.trim())
    .map(d => d.nome_documento);

  // Comentários
  const comComentario = docsValidos.filter(d => d.comentario?.trim()).length;

  // Vencidos: documentos válidos que não estão no NDA
  const docsVencidos = docsValidos.filter(d => d.vencimento && new Date(d.vencimento) < hoje);

  // A vencer (até 30 dias): documentos válidos que não estão no NDA
  const docsAVencer = docsValidos.filter(d => {
    if (!d.vencimento) return false;
    const dias = (new Date(d.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return dias > 0 && dias <= 30;
  });

  // Documentos obrigatórios extras (sem arquivo ou "null")
  const docsObrigatoriosExtra = docsValidos
    .filter(d => !d.nome_arquivo || d.nome_arquivo.trim().toLowerCase() === "null")
    .map(d => d.nome_documento);

  // Todos os documentos obrigatórios
  const todosObrigatorios = [
    ...DOCUMENTOS_OBRIGATORIOS.contratacao(func.tipo_regime),
    ...DOCUMENTOS_OBRIGATORIOS.identificacao(func.tipo_regime),
    ...DOCUMENTOS_OBRIGATORIOS.competencia,
    ...DOCUMENTOS_OBRIGATORIOS.seguranca,
    ...docsObrigatoriosExtra
  ];

  // Faltando: remove apenas os que estão no NDA
  const faltando = todosObrigatorios.filter(
    doc => !nomesDocsValidos.includes(doc) && !documentosNDA.includes(doc)
  );

  // Próximo limite de férias
  let proximoLimite: string;
  if (func.tipo_regime === "PJ") {
    proximoLimite = "-";
  } else {
    let dataAdmissao = new Date(func.data_admissao);
    let limite = new Date(dataAdmissao);
    limite.setFullYear(limite.getFullYear() + 1);
    while (limite < hoje) {
      limite.setFullYear(limite.getFullYear() + 1);
    }
    proximoLimite = limite.toLocaleDateString('pt-BR');
  }

  return {
    id: func.id,
    nome: func.nome_completo,
    cargo: func.cargo,
    departamento: func.departamento,
    tipo_regime: func.tipo_regime,
    situacao: func.situacao,
    comComentario,
    vencidos: docsVencidos.length,
    faltando: faltando.length,
    documentosDetalhes: docsValidos, // só exibe os que não estão no NDA
    faltandoNomes: faltando,
    docsVencidos,
    docsAVencer,
    proximoPeriodoFerias: proximoLimite,
  };
});





        setColaboradores(resultado.sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      }
    }

    carregarDados();
  }, []);

// ...imports e hooks continuam iguais
const handleExportarPlanilha = () => {
  const linhas: { Colaborador: string; Documento: string; Situação: string; "Data de Vencimento"?: string }[] = [];

  const hoje = new Date();

  colaboradores.forEach(colab => {
    // Documentos faltando
    colab.faltandoNomes.forEach((doc: string) => {
      linhas.push({
        Colaborador: colab.nome,
        Documento: doc,
        Situação: "Faltando",
      });
    });

    // Documentos com vencimento
    colab.documentosDetalhes.forEach((d: Documento) => {
      if (!d.vencimento) return;

      const vencimentoDate = new Date(d.vencimento);
      const diffDias = Math.ceil((vencimentoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      // Considera vencido ou a vencer dentro de 30 dias
      if (diffDias < 0) {
        linhas.push({
          Colaborador: colab.nome,
          Documento: d.nome_documento,
          Situação: "Vencido",
          "Data de Vencimento": vencimentoDate.toLocaleDateString("pt-BR"),
        });
      } else if (diffDias <= 30) {
        linhas.push({
          Colaborador: colab.nome,
          Documento: d.nome_documento,
          Situação: "A Vencer",
          "Data de Vencimento": vencimentoDate.toLocaleDateString("pt-BR"),
        });
      }
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



  const handleToggleRow = (id: number) => setExpandedRow(expandedRow === id ? null : id);

  const ativos = colaboradores.filter(c => c.situacao === "Ativo");
  const desligados = colaboradores.filter(c => c.situacao === "Desligado");
  const afastados = colaboradores.filter(c => c.situacao === "Afastado");

const ativosList = colaboradores.filter(c => c.situacao === "Ativo");
const desligadosList = colaboradores.filter(c => c.situacao === "Desligado");
const afastadosList = colaboradores.filter(c => c.situacao === "Afastado");

const resumo = {
  total: colaboradores.length,
  ativos: ativosList.length,
  desligados: desligadosList.length,
  afastados: afastadosList.length,
  clt: colaboradores.filter(c => c.tipo_regime === "CLT").length,
  pj: colaboradores.filter(c => c.tipo_regime === "PJ").length,

  docsFaltando: colaboradores.reduce((acc, c) => acc + (c.faltandoNomes?.length || 0), 0),
  docsVencidos: colaboradores.reduce((acc, c) => acc + (c.vencidos || 0), 0),
  docsAVencer: colaboradores.reduce((acc, c) => acc + (c.docsAVencer?.length || 0), 0),
  docsComComentario: colaboradores.reduce((acc, c) => acc + (c.comComentario || 0), 0),

  ativosResumo: {
    docsFaltando: ativosList.reduce((acc, c) => acc + (c.faltandoNomes?.length || 0), 0),
    docsVencidos: ativosList.reduce((acc, c) => acc + (c.vencidos || 0), 0),
    docsAVencer: ativosList.reduce((acc, c) => acc + (c.docsAVencer?.length || 0), 0),
    docsComComentario: ativosList.reduce((acc, c) => acc + (c.comComentario || 0), 0),
  },
  desligadosResumo: {
    docsFaltando: desligadosList.reduce((acc, c) => acc + (c.faltandoNomes?.length || 0), 0),
    docsComComentario: desligadosList.reduce((acc, c) => acc + (c.comComentario || 0), 0),
  },
  afastadosResumo: {
    docsFaltando: afastadosList.reduce((acc, c) => acc + (c.faltandoNomes?.length || 0), 0),
    docsComComentario: afastadosList.reduce((acc, c) => acc + (c.comComentario || 0), 0),
  }
};


const renderTabela = (lista: any[], incluirVencimento: boolean = true) => (
  <div className="overflow-hidden rounded-lg shadow-md mt-3 border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200 bg-white">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Depto</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Regime</th>
          {incluirVencimento && <th className="px-6 py-3 text-left text-sm font-semibold text-red-600">Vencidos</th>}
          {incluirVencimento && <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-600">A Vencer</th>}
          <th className="px-6 py-3 text-left text-sm font-semibold text-orange-600">Faltando</th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-blue-600">Com Comentário</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {lista.map(colab => (
          <React.Fragment key={colab.id}>
            <tr className="hover:bg-blue-50 cursor-pointer transition" onClick={() => handleToggleRow(colab.id)}>
              <td className="px-6 py-4 text-sm text-gray-800 flex items-center justify-between">
                {colab.nome}
                {expandedRow === colab.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
              {incluirVencimento && <td className="px-6 py-4 text-sm font-semibold text-red-600">{colab.vencidos || 0}</td>}
              {incluirVencimento && <td className="px-6 py-4 text-sm font-semibold text-yellow-600">{colab.docsAVencer?.length || 0}</td>}
              <td className="px-6 py-4 text-sm font-semibold text-orange-600">{colab.faltandoNomes?.length || 0}</td>
              <td className="px-6 py-4 text-sm font-semibold text-blue-600">{colab.comComentario || 0}</td>
            </tr>
            {expandedRow === colab.id && (
              <tr className="bg-gray-50 transition-all duration-300 relative">
                <td colSpan={incluirVencimento ? 8 : 6} className="px-6 py-4 relative">
                  <button
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-all"
                    onClick={() => router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)}
                  >
                    <Eye className="w-4 h-4" /> Ver Detalhes
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {incluirVencimento && (
                      <>
                        <div>
                          <p className="font-semibold text-red-700 mb-1">Vencidos</p>
                          <ul className="list-disc ml-5 text-gray-700">
                            {colab.documentosDetalhes?.filter((d: Documento) => d.vencimento && (new Date(d.vencimento).getTime() - new Date().getTime()) / (1000*60*60*24) <= 0)
                              .map((d: Documento) => <li key={d.id}>{d.nome_documento} ({d.vencimento})</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-700 mb-1">A Vencer</p>
                          <ul className="list-disc ml-5 text-gray-700">
                            {colab.docsAVencer?.map((d: Documento) => <li key={d.id}>{d.nome_documento} ({d.vencimento})</li>)}
                          </ul>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="font-semibold text-orange-700 mb-1">Faltando</p>
                      <ul className="list-disc ml-5 text-gray-700">
                        {colab.faltandoNomes?.map((doc: string, i: number) => <li key={i}>{doc}</li>)}
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
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"/>
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17}/>
        </div>
        <div className="flex-shrink-0 ml-auto pr-4 flex items-center gap-2">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto"/>
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar menuActive={menuActive} setMenuActive={setMenuActive} activeTab="Pessoal" onNavClickAction={() => {}}/>
        <div className="flex-1 p-6 overflow-y-auto">

          {/* Dashboard Cards */}
{/* Dashboard Visual - Relatório Corporativo */}
<div className="flex flex-col gap-6">

  {/* Exportar Planilha */}
  <div className="flex justify-end">
    <button
      onClick={handleExportarPlanilha}
      className=" text-gray-900 flex items-center gap-2 px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
    >
      <img src="/excel-icon.svg" alt="Excel" className="w-5 h-5"/>
      Exportar Planilha
    </button>
  </div>

  {/* Cards de Resumo */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

    {/* Total Colaboradores */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <p className="text-xs text-gray-500 uppercase font-semibold">Total Colaboradores</p>
      <p className="text-4xl font-bold text-gray-800">{resumo.total}</p>
      <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs">
        <span>Ativos: {resumo.ativos}</span>
        <span>Desligados: {resumo.desligados}</span>
        <span>Afastados: {resumo.afastados}</span>
        <span>Docs Faltando: {resumo.docsFaltando}</span>
      </div>
    </div>

    {/* Ativos */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <p className="text-xs text-gray-500 uppercase font-semibold">Ativos</p>
      <p className="text-4xl font-bold text-gray-800">{resumo.ativos}</p>
      <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs">
{/* Ativos */}
<span>Docs Faltando: {resumo.ativosResumo.docsFaltando}</span>
<span>Vencidos: {resumo.ativosResumo.docsVencidos}</span>
<span>A Vencer: {resumo.ativosResumo.docsAVencer}</span>
<span>Com Comentário: {resumo.ativosResumo.docsComComentario}</span>

      </div>
    </div>

    {/* Desligados */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <p className="text-xs text-gray-500 uppercase font-semibold">Desligados</p>
      <p className="text-4xl font-bold text-gray-800">{resumo.desligados}</p>
      <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs">
        <span>Docs Faltando: {desligados.reduce((acc, c) => acc + c.faltando, 0)}</span>
        <span>Com Comentário: {desligados.reduce((acc, c) => acc + c.comComentario, 0)}</span>
      </div>
    </div>

    {/* Afastados */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      <p className="text-xs text-gray-500 uppercase font-semibold">Afastados</p>
      <p className="text-4xl font-bold text-gray-800">{resumo.afastados}</p>
      <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs">
        <span>Docs Faltando: {afastados.reduce((acc, c) => acc + c.faltando, 0)}</span>
        <span>Com Comentário: {afastados.reduce((acc, c) => acc + c.comComentario, 0)}</span>
      </div>
    </div>

  </div>
</div>




<div className="mt-6">
  <h2
    className="text-lg font-semibold text-blue-600 mb-2 cursor-pointer select-none"
    onClick={() => toggleSection('ativos')}
  >
    Ativos ({ativos.length})
  </h2>

  {expandedSection === 'ativos' && (
    <div className="overflow-hidden rounded-lg shadow-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Depto</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Regime</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 bg-blue-50 text-center">
              Data Limite de Férias
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-red-700 bg-red-50 text-center">
              Vencidos
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-700 bg-yellow-50 text-center">
              A Vencer
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-orange-700 bg-orange-50 text-center">
              Faltando
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 text-center">
              Com Comentário
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {ativos.map(colab => (
            <React.Fragment key={colab.id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleToggleRow(colab.id)}
              >
                <td className="px-6 py-4 text-sm text-gray-800">{colab.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
                <td className="px-6 py-4 text-sm font-semibold text-blue-600 text-center">
                  {colab.proximoPeriodoFerias}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-red-600 text-center">
                  {colab.docsVencidos?.length || 0}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-yellow-600 text-center">
                  {colab.docsAVencer?.length || 0}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-orange-600 text-center">
                  {colab.faltando || 0}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-center">
                  {colab.comComentario || 0}
                </td>
              </tr>

              {expandedRow === colab.id && (
                <tr className="bg-gray-50">
                  <td colSpan={9} className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-4">
                      <img src="/ficha.png" alt="Ficha" className="w-6 h-6 opacity-70" />
                      <button
                        className="text-blue-700 font-semibold underline text-sm hover:text-blue-900"
                        onClick={() =>
                          router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)
                        }
                      >
                        VER FICHA DO FUNCIONÁRIO
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Vencidos */}
                      <div>
                        <h4 className="font-semibold text-red-700 border-b border-red-300 mb-2 pb-1">
                          Documentos Vencidos
                        </h4>
                        {colab.docsVencidos?.length > 0 ? (
                          <ul className="list-disc ml-5 text-gray-700">
                            {colab.docsVencidos.map((d: Documento, i: number) => (
                              <li key={i}>
                                {`${d.nome_documento} - vencido em ${
                                  d.vencimento
                                    ? new Date(d.vencimento).toLocaleDateString('pt-BR')
                                    : 'sem data'
                                }`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">Nenhum documento vencido</p>
                        )}
                      </div>

                      {/* A vencer */}
                      <div>
                        <h4 className="font-semibold text-yellow-700 border-b border-yellow-300 mb-2 pb-1">
                          Documentos a Vencer (30 dias)
                        </h4>
                        {colab.docsAVencer?.length > 0 ? (
                          <ul className="list-disc ml-5 text-gray-700">
                            {colab.docsAVencer.map((d: Documento, i: number) => (
                              <li key={i}>
                                {`${d.nome_documento} - vence em ${
                                  d.vencimento
                                    ? new Date(d.vencimento).toLocaleDateString('pt-BR')
                                    : 'sem data'
                                }`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">Nenhum documento próximo de vencer</p>
                        )}
                      </div>

                      {/* Faltando */}
                      <div>
                        <h4 className="font-semibold text-orange-700 border-b border-orange-300 mb-2 pb-1">
                          Documentos Faltando
                        </h4>
                        {colab.faltandoNomes?.length > 0 ? (
                          <ul className="list-disc ml-5 text-gray-700">
                            {colab.faltandoNomes.map((doc: string, i: number) => (
                              <li key={i}>{doc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">Nenhum documento faltando</p>
                        )}
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
  )}
</div>


          {desligados.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-red-600 mb-2 cursor-pointer select-none" onClick={() => toggleSection('desligados')}>
                Desligados ({desligados.length})
              </h2>
              {expandedSection === 'desligados' && renderTabela(desligados, false)}
            </div>
          )}
          {afastados.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-teal-600 mb-2 cursor-pointer select-none" onClick={() => toggleSection('afastados')}>
                Afastados ({afastados.length})
              </h2>
              {expandedSection === 'afastados' && renderTabela(afastados, false)}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

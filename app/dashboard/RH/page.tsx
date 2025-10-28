'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/superbase';
import { ArrowLeft, Search, ClipboardList, FileText, AlertCircle, UserCheck, Clock, UserPlus } from "lucide-react";

type Documento = {
  id: number;
  funcionario_id: number;
  nome_documento: string;
  nome_arquivo?: string | null;
  comentario?: string;
  vencimento?: string | null;
  valido: boolean;
};

export default function DocumentacaoColaboradores() {
  const { nome } = useUser();
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const DOCUMENTOS_OBRIGATORIOS = {
    contratacao: (tipoRegime: string) =>
      tipoRegime === 'CLT'
        ? [
            "Acordo de Compensacao","Acordo de Prorrogacao","Contrato de Experiencia",
            "Declaracao Encargos de IR","Ficha de Registro","LGPD",
            "Opcao de Desistencia de VT","Solicitacao de VT","Termo de Responsabilidade"
          ]
        : tipoRegime === 'PJ'
        ? ["Contrato de Prestacao de Servico"]
        : [],
    identificacao: ["RG","CPF","CTPS - Digital","E-Social","Comprovante de Residencia","Certidao de Nascimento ou Casamento","Certidao de Nascimento"],
    competencia: ["Diploma","Certificado de Curso"],
    seguranca: ["Treinamento de Seguranca"]
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
          const vencidos = docsFuncionario.filter(d =>
            d.vencimento && (new Date(d.vencimento).getTime() - hoje.getTime()) / (1000*60*60*24) <= 30
          ).length;

          const docsObrigatoriosExtra = docsFuncionario
            .filter(d => !d.nome_arquivo || d.nome_arquivo.trim().toLowerCase() === 'null')
            .map(d => d.nome_documento);

          const faltando = [
            ...DOCUMENTOS_OBRIGATORIOS.contratacao(func.tipo_regime),
            ...DOCUMENTOS_OBRIGATORIOS.identificacao,
            ...DOCUMENTOS_OBRIGATORIOS.competencia,
            ...DOCUMENTOS_OBRIGATORIOS.seguranca,
            ...docsObrigatoriosExtra
          ].filter(doc => !nomesDocsValidos.includes(doc));

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
            placeholder="Buscar colaborador..."
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
          activeTab=""
        />

        <div className="p-6 w-full max-w-[1100px] mx-auto">
          <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">
            Painel de Documentação de Colaboradores
          </h2>

          {/* Cards principais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card icon={UserCheck} title="Ativos" value={resumo.ativos} color="bg-blue-600" />
            <Card icon={AlertCircle} title="Afastados" value={resumo.afastados} color="bg-teal-600" />
            <Card icon={UserCheck} title="Desligados" value={resumo.desligados} color="bg-red-600" />
            <Card icon={ClipboardList} title="CLT" value={resumo.clt} color="bg-yellow-500" />
            <Card icon={ClipboardList} title="PJ" value={resumo.pj} color="bg-purple-600" />
            <Card icon={FileText} title="Docs Faltando" value={resumo.docsFaltando} color="bg-orange-500" />
          </div>

          {/* Ações Rápidas */}
          <div>
            <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Ações Rápidas</h2>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  label: 'Admissão',
                  path: '/dashboard/RH/admissao',
                  icon: UserPlus,
                },
                {
                  label: 'Visão Geral',
                  path: '/dashboard/RH/documentacaodoscolaboradores',
                  icon: ClipboardList,
                },
                {
                  label: 'Apontamentos',
                  path: '/dashboard/RH/apontamentos',
                  icon: Clock,
                },
                {
                  label: 'Folha de Ponto',
                  path: 'https://rhid.com.br/v2/#/login',
                  external: true,
                  icon: FileText,
                },
              ].map(({ label, path, icon: Icon, external }) => (
                <button
                  key={label}
                  onClick={() => external ? window.open(path, '_blank') : router.push(path)}
                  className="w-[110px] h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de colaboradores */}
          <div className="mt-8">
            <h3 className="text-md font-semibold text-[#5a0d0d] mb-2">Colaboradores</h3>
            <div className="overflow-hidden rounded-lg shadow-md border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Depto</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Regime</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vencidos</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Comentário</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faltando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ativos.map(colab => (
                    <React.Fragment key={colab.id}>
                      <tr
                        className="hover:bg-blue-50 transition cursor-pointer"
                        onClick={() => handleToggleRow(colab.id)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-800">{colab.nome}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{colab.cargo}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{colab.departamento}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{colab.tipo_regime}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">{colab.vencidos}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">{colab.comComentario}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-600">{colab.faltando}</td>
                      </tr>

                      {expandedRow === colab.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <p className="font-semibold text-gray-800 mb-2">Documentos Faltando:</p>
                            <ul className="list-disc ml-5 text-gray-700">
                              {colab.faltandoNomes.map((doc: string, i: number) => (
                                <li key={i}>{doc}</li>
                              ))}
                            </ul>
                            <button
                              className="mt-3 text-blue-600 underline text-sm"
                              onClick={() => router.push(`/dashboard/RH/documentacaodoscolaboradores/${colab.id}`)}
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, value, color }: any) {
  return (
    <div className={`${color} text-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center`}>
      <Icon className="w-6 h-6 mb-1" />
      <p className="text-xs font-medium">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/superbase';
import {
  ArrowLeft,
  Search,
  ClipboardList,
  FileText,
  Clock,
  UserPlus,
  FolderKanban,
  Users,
} from "lucide-react";

interface Documento {
  nome_documento: string;
  vencimento?: string | null;
  comentario?: string;
  valido?: boolean;
  nome_arquivo?: string;
}

interface Colaborador {
  id: number;
  nome: string;
  cargo: string;
  departamento: string;
  tipo_regime: string;
  situacao: string;
  comComentario: number;
  vencidos: number;
  faltando: number;
  documentosDetalhes: Documento[];
  faltandoNomes: string[];
  docsVencidos: Documento[];
  docsAVencer: Documento[];
   proximoPeriodoFerias: string; // nova coluna
}

export default function DocumentacaoColaboradores() {
  const { nome } = useUser();
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
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
    identificacao: (tipoRegime: string) => [
      "RG","CPF", ...(tipoRegime !== 'PJ' ? ["CTPS - Digital", "E-Social"] : []),
      "Comprovante de Residencia","Certidao de Nascimento ou Casamento","Caderneta de Vacinação",
    ],
    competencia: ["Certificado de Curso"],
    seguranca: ["Ficha de EPI","ASO","Ordem de Serviço"],
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const { data: funcionarios } = await supabase.from('funcionarios').select('*');
        const { data: documentos } = await supabase.from('documentoscolaboradores').select('*');
        const hoje = new Date();

interface Colaborador {
  id: number;
  nome: string;
  cargo: string;
  departamento: string;
  tipo_regime: string;
  situacao: string;
  comComentario: number;
  vencidos: number;
  faltando: number;
  documentosDetalhes: Documento[];
  faltandoNomes: string[];
  docsVencidos: Documento[];
  docsAVencer: Documento[];
  proximoPeriodoFerias: string; // nova coluna
}

const resultado: Colaborador[] = (funcionarios || []).map(func => {
  const docsFuncionario: Documento[] = (documentos || []).filter(d => d.funcionario_id === func.id);

  const nomesDocsValidos = docsFuncionario
    .filter(d => d.valido && d.nome_arquivo)
    .map(d => d.nome_documento);

  const comComentario = docsFuncionario.filter(d => d.comentario?.trim()).length;

  const docsVencidos = docsFuncionario.filter(d =>
    d.vencimento && new Date(d.vencimento) < hoje
  );

  const docsAVencer = docsFuncionario.filter(d => {
    if (!d.vencimento) return false;
    const dias = (new Date(d.vencimento).getTime() - hoje.getTime()) / (1000*60*60*24);
    return dias > 0 && dias <= 30;
  });

  const docsObrigatoriosExtra = docsFuncionario
    .filter(d => !d.nome_arquivo || d.nome_arquivo.trim().toLowerCase() === 'null')
    .map(d => d.nome_documento);

  const faltando = [
    ...DOCUMENTOS_OBRIGATORIOS.contratacao(func.tipo_regime),
    ...DOCUMENTOS_OBRIGATORIOS.identificacao(func.tipo_regime),
    ...DOCUMENTOS_OBRIGATORIOS.competencia,
    ...DOCUMENTOS_OBRIGATORIOS.seguranca,
    ...docsObrigatoriosExtra
  ].filter(doc => !nomesDocsValidos.includes(doc));

let proximoLimite: string; // sempre string

if (func.tipo_regime === "PJ") {
  proximoLimite = "-";
} else {
  let dataAdmissao = new Date(func.data_admissao);
  let limite = new Date(dataAdmissao);
  limite.setFullYear(limite.getFullYear() + 1);

  while (limite < hoje) {
    limite.setFullYear(limite.getFullYear() + 1);
  }

  proximoLimite = limite.toLocaleDateString('pt-BR'); // converte pra string
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
    documentosDetalhes: docsFuncionario,
    faltandoNomes: faltando,
    docsVencidos,
    docsAVencer,
     proximoPeriodoFerias: proximoLimite,
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
  const ativosOrdenados = [...ativos].sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
);

  const handleToggleRow = (id: number) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
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
          activeTab="Pessoal"
        />

        <div className="p-6 w-full max-w-[1400px] mx-auto">
          <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">
            Painel de Documentação de Colaboradores
          </h2>

          {/* Ações rápidas atualizadas */}
          <div>
            <h2 className="text-lg font-semibold text-[#5a0d0d] mb-4">Ações Rápidas</h2>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Admissão', path: '/dashboard/RH/admissao', icon: UserPlus },
                { label: 'Visão Geral', path: '/dashboard/RH/documentacaodoscolaboradores', icon: ClipboardList },
                { label: 'Apontamentos', path: '/dashboard/RH/apontamentos', icon: Clock },
                { label: 'Folha de Ponto', path: 'https://rhid.com.br/v2/#/login', external: true, icon: FileText },
                { label: 'Análise de Folha de Ponto', path: '/dashboard/RH/controledeponto', icon: FileText },
                { label: 'Alocar Pessoal', path: '/dashboard/RH/alocarpessoal', icon: Users },
                { label: 'Pasta dos Funcionários', path: '/dashboard/RH/pastafuncionarios', icon: FolderKanban },
              ].map(({ label, path, icon: Icon, external }) => (
                <button
                  key={label}
                  onClick={() => external ? window.open(path, '_blank') : router.push(path)}
                  className="w-[120px] h-[110px] flex flex-col items-center justify-center text-center border rounded-xl shadow bg-white text-[#5a0d0d] border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white transition-all"
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-blue-700 bg-blue-50 text-center">
  Data Limite de Férias
</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-red-700 bg-red-50 text-center">Vencidos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-700 bg-yellow-50 text-center">A Vencer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-orange-700 bg-orange-50 text-center">Faltando</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 text-center">Com Comentário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ativosOrdenados.map(colab => (
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
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 text-center">{colab.vencidos}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-yellow-600 text-center">{colab.docsAVencer.length}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600 text-center">{colab.faltando}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 text-center">{colab.comComentario}</td>
                  </tr>

                  {expandedRow === colab.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-6 py-5">
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
                            {colab.docsVencidos.length > 0 ? (
                              <ul className="list-disc ml-5 text-gray-700">
                                {colab.docsVencidos.map((d: Documento, i: number) => (
                                  <li key={i}>
                                    {`${d.nome_documento} - vencido em ${d.vencimento ? new Date(d.vencimento).toLocaleDateString('pt-BR') : 'sem data'}`}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400 text-sm">Nenhum documento vencido</p>
                            )}
                          </div>

                          {/* A vencer */}
                          <div>
                            <h4 className="font-semibold text-yellow-700 border-b border-yellow-300 mb-2 pb-1">
                              Documentos a Vencer (30 dias)
                            </h4>
                            {colab.docsAVencer.length > 0 ? (
                              <ul className="list-disc ml-5 text-gray-700">
                                {colab.docsAVencer.map((d: Documento, i: number) => (
                                  <li key={i}>
                                    {`${d.nome_documento} - vence em ${d.vencimento ? new Date(d.vencimento).toLocaleDateString('pt-BR') : 'sem data'}`}
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
                            {colab.faltandoNomes.length > 0 ? (
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


          </div>
        </div>
      </div>
    </div>
  );
}

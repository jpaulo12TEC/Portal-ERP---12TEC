'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { supabase } from '../../../../lib/superbase';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { FileText, Users, ClipboardCheck, FileCheck, CheckSquare, Flag } from 'lucide-react';
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { getAccessToken } from "@/lib/auth"; // ajuste o caminho
import { useUser } from '@/components/UserContext';


type SolicitacaoContrato = {
  id: string;
  id_solicitante: string;
  titulo: string;
  status: string;
  orcamento1: string | null;
  orcamento2: string | null;
  orcamento3: string | null;
  orcamento4: string | null;
  orcamento5: string | null;
  orcamento6: string | null;
  previsao_conclusao: string | null;
  fornecedor_sugerido: string | null;
  descricao: string | null;
  Fornecedorescolhido: string | null;
  motivacaodaescolha: string | null;

};

const ALLOWED_USER_ID = '0ec3a584-6807-44ba-afc6-ffdc41afb049'; // <-- Ajuste para o user.id que deve ver o botão

export default function AcompanharSolicitacoes() {
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('contratos');
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    // Estado para armazenar nomes dos solicitantes, chave é o id_solicitante
  const [solicitantesNomes, setSolicitantesNomes] = useState<Record<string, string>>({});

  const checklistItems = [
  { key: 'solicitado', label: 'Solicitado', icon: FileText },
  { key: 'Fornecedor selecionado', label: 'Fornecedor Selecionado', icon: Users },
  { key: 'contrato em elaboração', label: 'Contrato em Elaboração', icon: ClipboardCheck },
  { key: 'contrato aprovado', label: 'Contrato Aprovado', icon: FileCheck },
  { key: 'contrato iniciado', label: 'Contrato Iniciado', icon: CheckSquare },
  { key: 'serviço concluído', label: 'Serviço Concluído', icon: Flag },
];

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  useEffect(() => {
    async function fetchUserAndSolicitacoes() {
      setLoading(true);

      // Pega o usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
        setUserId(null);
      } else {
        setUserId(userData.user?.id || null);
      }

      // Busca solicitações incluindo os novos campos
      const { data, error } = await supabase
        .from('solicitacoes_contratos')
        .select(
          'id, id_solicitante, titulo,status,orcamento1,orcamento2,orcamento3,orcamento4,orcamento5,orcamento6,previsao_conclusao,fornecedor_sugerido,descricao,Fornecedorescolhido,motivacaodaescolha'
        )
        .order('data_solicitacao', { ascending: false });

      if (error) {
        alert('Erro ao carregar solicitações.');
        console.error(error);
      } else if (data) {
        setSolicitacoes(data);
      }

      setLoading(false);
    }

    fetchUserAndSolicitacoes();
  }, []);



const fetchSolicitacoes = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('solicitacoes_contratos')
    .select(
      'id, id_solicitante, titulo,status,orcamento1,orcamento2,orcamento3,orcamento4,orcamento5,orcamento6,previsao_conclusao,fornecedor_sugerido,descricao,Fornecedorescolhido,motivacaodaescolha'
    )
    .order('data_solicitacao', { ascending: false });

  if (error) {
    console.error(error);
    alert('Erro ao carregar solicitações.');
  } else if (data) {
    setSolicitacoes(data);
  }
  setLoading(false);
};


const fetchNomeSolicitante = async (id_solicitante: string) => {
  if (solicitantesNomes[id_solicitante]) {
    // Já tem no cache local
    return solicitantesNomes[id_solicitante];
  }

  console.log('fetchNomeSolicitante chamado para id:', id_solicitante);
  try {
    const res = await fetch(`/api/usuarios/${id_solicitante}`);
    if (!res.ok) {
      throw new Error('Erro na requisição');
    }
    const json = await res.json();
    const nome = json.nome || 'Nome não disponível';

    // Atualiza estado com o nome novo
    setSolicitantesNomes(prev => ({ ...prev, [id_solicitante]: nome }));

    return nome;
  } catch (error) {
    console.error('Erro ao buscar usuário solicitante:', error);
    return 'Erro ao buscar nome';
  }
};




    const toggleExpand = async (id: string) => {
    // Ao expandir, se estiver abrindo, busca o nome do solicitante
    if (expandedId !== id) {
      const sol = solicitacoes.find((s) => s.id === id);
      if (sol && sol.id_solicitante) {
        await fetchNomeSolicitante(sol.id_solicitante);
      }
      setExpandedId(id);
    } else {
      setExpandedId(null);
    }
  };



  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '-';
    const dt = new Date(dataStr);
    return dt.toLocaleDateString('pt-BR');
  };




  const STATUS_STEPS = [
  'solicitado',
  'fornecedor selecionado',
  'contrato em elaboração',
  'contrato aprovado',
  'contrato iniciado',
  'serviço concluído'
];





const handleIniciarCotacao = async (id: string) => {
  setLoadingActionId(id);

  // Pergunta o fornecedor escolhido
  const fornecedor = prompt('Informe o nome do fornecedor selecionado:');
  if (fornecedor === null) {
    setLoadingActionId(null); // Usuário cancelou
    return;
  }


  // Pergunta o motivo
  const motivo = prompt('Informe o motivo para selecionar este Fornecedor:');
  if (motivo === null) {
    setLoadingActionId(null); // Usuário cancelou
    return;
  }



  try {
    const { error } = await supabase
      .from('solicitacoes_contratos')
      .update({
        status: 'fornecedor selecionado',
        motivacaodaescolha: motivo,
        Fornecedorescolhido: fornecedor
      })
      .eq('id', id);

    if (error) {
      alert('Erro ao atualizar status da solicitação.');
      console.error(error);
    } else {
      alert('Status atualizado para "fornecedor selecionado".');
      setSolicitacoes((prev) =>
        prev.map((sol) =>
          sol.id === id
            ? { ...sol, status: 'fornecedor selecionado', motivacaodaescolha: motivo, Fornecedorescolhido: fornecedor }
            : sol
        )
      );
    }
  } catch (err) {
    alert('Erro inesperado ao atualizar status.');
    console.error(err);
  } finally {
    setLoadingActionId(null);
  }
};


const handleCancelarSolicitacao = async (id: string) => {
  
  const motivo = prompt("Informe o motivo para cancelar a solicitação:");
  if (!motivo) {
    alert("Ação cancelada. É necessário informar um motivo.");
    return;
  }

  setLoadingActionId(id);
  try {
    const { error } = await supabase
      .from('solicitacoes_contratos')
      .update({ status: 'solicitação cancelada', motivacaodaescolha: motivo })
      .eq('id', id);

    if (error) {
      alert('Erro ao cancelar a solicitação.');
      console.error(error);
    } else {
      alert('Solicitação cancelada com sucesso.');
      setSolicitacoes(prev =>
        prev.map(sol =>
          sol.id === id
            ? { ...sol, status: 'solicitação cancelada', motivacaodaescolha: motivo }
            : sol
        )
      );
    }
  } catch (err) {
    alert('Erro inesperado ao cancelar solicitação.');
    console.error(err);
  } finally {
    setLoadingActionId(null);
  }
};



const handleUploadOrcamento = async (id: string, numero: number, file: File | null) => {
  if (!file) return;
  
  const filePath = `orcamentos/${id}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('meu_bucket')
    .upload(filePath, file);

  if (uploadError) {
    alert('Erro ao enviar arquivo.');
    console.error(uploadError);
    return;
  }

  const publicUrl = supabase.storage.from('meu_bucket').getPublicUrl(filePath).data.publicUrl;

  const { error: updateError } = await supabase
    .from('solicitacoes_contratos')
    .update({ [`orcamento${numero}`]: publicUrl })
    .eq('id', id);

  if (updateError) {
    alert('Erro ao salvar orçamento no banco.');
    console.error(updateError);
  } else {
    alert(`Orçamento ${numero} adicionado com sucesso!`);
    // Atualiza estado local
    setSolicitacoes(prev =>
      prev.map(sol =>
        sol.id === id ? { ...sol, [`orcamento${numero}`]: publicUrl } : sol
      )
    );
  }
};






  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
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
            <span className="w-full text-left font-medium">
              Acompanhamento de solicitações de novos contratos
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main className="p-8 w-full max-w-[1100px] mx-auto overflow-y-auto space-y-8  rounded-2xl">
          {loading ? (
            <p className="text-center text-gray-500 italic">Carregando solicitações...</p>
          ) : solicitacoes.length === 0 ? (
            <p className="text-center text-gray-500 italic">Nenhuma solicitação encontrada.</p>
          ) : (
            <ul className="space-y-6">
              {solicitacoes.map(
                ({
                  id,
                   id_solicitante,
                  titulo,
                  status,
                  orcamento1,
                  orcamento2,
                  orcamento3,
                  orcamento4,
                  orcamento5,
                  orcamento6,
                  previsao_conclusao,
                  fornecedor_sugerido,
                  descricao,
                  motivacaodaescolha,
                  Fornecedorescolhido
                }) => (
                  <li
                    key={id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col justify-between transition-shadow hover:shadow-lg cursor-pointer"
                     onClick={(e) => {
                        // Se clicou em um elemento interativo, não alterna o expandido
                        const interactive = (e.target as HTMLElement).closest(
                          'input,button,a,select,textarea,label,[data-no-toggle]'
                        );
                        if (interactive) return;
                        toggleExpand(id);
                      }}
                    aria-expanded={expandedId === id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      // Evita que atalhos dentro de inputs/botões fechem o card
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleExpand(id);
                      }
                    }}
                  >
<header className="mb-10 flex justify-between items-center">
  <h2 className="text-2xl text-gray-900">{titulo}</h2>
  <h2 className="text-sm text-gray-600">
    <strong>Previsão de conclusão:</strong> {formatarData(previsao_conclusao)}
  </h2>
</header>


                        {status.toLowerCase() === 'solicitação cancelada' && (
    <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-md text-center">
      <h3 className="text-red-700 font-semibold text-sm">Solicitação Cancelada</h3>
      <p className="text-red-600 text-xs mt-1">
        Motivação: {motivacaodaescolha || 'Não informada'}
      </p>
    </div>
  )}
{!['solicitação cancelada', 'solicitado', 'serviço concluído'].includes(status.toLowerCase()) && (
  <div className="mt-2 p-2 bg-green-50 text-green-800 rounded-md text-center text-sm">
    <span className="font-semibold">
      Fornecedor Selecionado: {Fornecedorescolhido || '-'}
    </span>
    {motivacaodaescolha && (
      <p className="mt-1 text-xs text-green-700">
        Motivo: {motivacaodaescolha}
      </p>
    )}
  </div>
)}
<div className="grid grid-cols-6 gap-3 mt-4 mb-10">
  {checklistItems.map(({ key, label, icon: Icon }, index) => {
    // Determina se esta etapa e todas anteriores devem estar "checadas"
    const currentIndex = STATUS_STEPS.indexOf(status?.toLowerCase() || '');
    const checked = index <= currentIndex;

    return (
      <div
        key={key}
        className={`flex flex-col items-center justify-center text-center p-3 border rounded-md ${
          checked
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-gray-50 border-gray-200 text-gray-400'
        }`}
      >
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-xs font-medium">{label}</span>
        {checked && <CheckCircle className="w-4 h-4 mt-1 text-green-600" />}
      </div>
    );
  })}
</div>
                    

                    <section className="mt-2">
                      <h3 className="font-medium text-gray-700 mb-2">Orçamentos anexados:</h3>
                      <div className="flex flex-wrap gap-4">
                        {[orcamento1, orcamento2, orcamento3].filter(Boolean).length === 0 ? (
                          <span className="text-gray-400 italic">Nenhum orçamento anexado</span>
                        ) : (
                          [orcamento1, orcamento2, orcamento3, orcamento4, orcamento5, orcamento6].map((url, i) =>
                            url ? (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#5a0d0d] hover:underline font-medium"
                                title={`Abrir Orçamento ${i + 1}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Paperclip size={18} />
                                <span>Orçamento {i + 1}</span>
                              </a>
                            ) : null
                          )
                        )}
                      </div>
                    </section>
{expandedId === id && (
    <section
    className="mt-6 border-t border-gray-300 pt-4 text-gray-700"
    data-no-toggle // só para reforçar o seletor do passo 1
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
  >
    <p>
      <strong>Fornecedores sugeridos:</strong>{' '}
      {fornecedor_sugerido || '-'}
    </p>
    <p className="mt-2">
      <strong>Descrição:</strong>{' '}
      {descricao || 'Nenhuma descrição disponível.'}
    </p>
    <p className="mt-2">
      <strong>Solicitante:</strong>{' '}
      {solicitantesNomes[id_solicitante] ?? 'Carregando...'}
    </p>

{/* ====== BLOCO DE UPLOAD DE ORÇAMENTOS ====== */}
{status.toLowerCase() === 'solicitado' && (() => {
  
  const orcamentos = [
    orcamento1,
    orcamento2,
    orcamento3,
    orcamento4,
    orcamento5,
    orcamento6
  ];

  const camposVazios = orcamentos
    .map((valor, index) => ({ index: index + 1, valor }))
    .filter(o => !o.valor);

  const handleUploadIndividual = async (indice: number, arquivo: File) => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert("Token de acesso não encontrado.");
        return;
      }

      // Sanitiza nome
      const fileName = `orcamento${indice}_${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}${arquivo.name.slice(arquivo.name.lastIndexOf('.'))}`;

      // Envia para o OneDrive
      const url = await uploadFileToOneDrive(
        accessToken,
        arquivo,
        fileName,
        new Date().toISOString().slice(0, 10),
        "sem_fornecedor", // fornecedor fixo
        "orçamentos-contratos"
      );

      if (!url) {
        alert(`Erro ao enviar Orçamento ${indice}`);
        return;
      }

      // Atualiza no Supabase
      const coluna = `orcamento${indice}`;
      const { error } = await supabase
        .from("solicitacoes_contratos")
        .update({ [coluna]: url })
        .eq("id", id);

      if (error) throw error;

      alert(`✅ Orçamento ${indice} enviado com sucesso!`);
      fetchSolicitacoes();
    } catch (err) {
      console.error(err);
      alert(`Erro ao enviar Orçamento ${indice}`);
    }
  };

  

  return camposVazios.length > 0 && (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-600 mb-3">
        Adicionar Orçamentos
      </h4>

      <div className="flex flex-wrap gap-3">
        {camposVazios.map(campo => (
          <label
            key={campo.index}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300 text-sm font-medium transition-colors"
          >
            + Orçamento {campo.index}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) {
                  handleUploadIndividual(campo.index, arquivo);
                }
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
})()}



    {/* ========================================== */}

    {userId === ALLOWED_USER_ID && (
      <div className="mt-20 mb-10 flex flex-wrap gap-4 justify-end">
{status.toLowerCase() === 'solicitado' && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleIniciarCotacao(id);
    }}
    disabled={loadingActionId === id}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-shadow shadow-sm
      ${
        loadingActionId === id
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}
    aria-label="Iniciar cotação"
  >
    {loadingActionId === id ? (
      <svg
        className="animate-spin h-4 w-4 text-gray-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
    ) : (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Escolher Fornecedor
      </>
    )}
  </button>
)}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCancelarSolicitacao(id);
          }}
          disabled={loadingActionId === id}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-shadow shadow-sm
            ${
              loadingActionId === id
                ? 'bg-red-200 text-red-400 cursor-not-allowed'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          aria-label="Cancelar solicitação"
        >
          {loadingActionId === id ? (
            <svg
              className="animate-spin h-4 w-4 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar solicitação
            </>
          )}
        </button>
      </div>
    )}
  </section>
)}





                  </li>
                )
              )}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, ClipboardCheck, FileCheck2, BadgeCheck, Banknote, ArrowLeft, Search } from 'lucide-react';
import Sidebar from '../../../../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { useUser } from '@/components/UserContext';
import { supabase } from '../../../../../lib/superbase';
import { Calendar, UploadCloud,Download  } from 'lucide-react';
import { ExternalLink, Award  } from "lucide-react"



type Observacao = {
  descricao: string;
  autor: string;
  data: string;
  dataOriginal?: string;
};

type Checklist = {
  iniciado: boolean
  anexado: boolean
  acordado: boolean
  assinado: boolean
  pagamento: boolean
}

type Servico = {
  id: string
  id_criador: string
  created_at: Date
  status: string
  cotacao?: string
  cnpj_fornecedor: string
  objeto_contrato: string
  criado_em:string
  valor_unitario: number
  unidade_medida:string
  tipo_pagamento: string
  diasaposemissao: string
  periodicidade: string
  proximopagamento: Date
  dataencerramento: Date | null;
  semdataencerramento: boolean;
  controle: string
  diasdasemanacontrole?: string[];
  nrs: boolean
  contrato: string // FK para solicitacoes_contratos.id
  contrato_assinado?: string | null
  observacao?:string|null

  documento1: string
  documento1nome: string
  documento2: string
  documento2nome: string
  documento3: string
  documento3nome: string
  tipodecontrato: string  
  acordado: boolean  
  inclusao_para_pagamento: boolean
}

type Contrato = {
  id: string
  id_solicitante: string
  data_solicitacao: string
  titulo: string
  descricao: string
  fornecedor_sugerido: string
  orcamento1?: string
  orcamento2?: string
  orcamento3?: string
  orcamento4?: string
  orcamento5?: string
  orcamento6?: string
  status: string
  previsao_conclusao: string
  Fornecedorescolhido?: string
  motivacaodaescolha?: string
  orcamento_escolhido?: number

  checklist: Checklist
  servicos: Servico[] // todos os serviços do contrato
}


export default function ElaboracaoContrato() {
  const [fornecedorInfo, setFornecedorInfo] = useState<any>(null);

const [observacoesRender, setObservacoesRender] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const userIdPermitido = "0ec3a584-6807-44ba-afc6-ffdc41afb049"; // substitua pelo ID real

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const isEditable = user?.id === userIdPermitido;

  const { nome } = useUser(); // Esse nome será usado como autor da observação
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('contratos');
const [contratoSelecionado, setContratoSelecionado] = useState<Contrato>({
  id: "",
  id_solicitante: "",
  data_solicitacao: "",
  titulo: "",
  descricao: "",
  fornecedor_sugerido: "",
  orcamento1: "",
  orcamento2: "",
  orcamento3: "",
  orcamento4: "",
  orcamento5: "",
  orcamento6: "",
  status: "",
  previsao_conclusao: "",
  Fornecedorescolhido: "",
  motivacaodaescolha: "",
  orcamento_escolhido: 0,
  checklist: {
  iniciado: true,
  anexado: false,
  acordado: false,
  assinado: false,
  pagamento: false
},
  servicos: [] // ✅ array vazio no valor inicial
});
  const [novaObservacao, setNovaObservacao] = useState('');
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true)


const SOLICITACAO_INICIAL = {
  id: "",
  id_solicitante: "",
  data_solicitacao: "",
  titulo: "",
  descricao: "",
  fornecedor_sugerido: "",
  orcamento1: "",
  orcamento2: "",
  orcamento3: "",
  orcamento4: "",
  orcamento5: "",
  orcamento6: "",
  status: "",
  previsao_conclusao: "",
  Fornecedorescolhido: "",
  motivacaodaescolha: "",
  orcamento_escolhido: 0,
  checklist: {
  iniciado: true,
  anexado: false,
  acordado: false,
  assinado: false,
  pagamento: false
},
  servicos: [] // ✅ array vazio no valor inicial
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setArquivo(e.target.files[0]);
  };
  


  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };



  const abrirModal = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setContratoSelecionado(SOLICITACAO_INICIAL);
  };




useEffect(() => {
  const fetchContratos = async () => {
    setLoading(true)

    try {
      // 1️⃣ Buscar contratos
      const { data: contratosData, error: errorContratos } = await supabase
        .from("solicitacoes_contratos")
        .select("*")
        .order("data_solicitacao", { ascending: false })

      if (errorContratos) {
        console.error("Erro ao buscar contratos:", errorContratos.message)
        setContratos([])
        setLoading(false)
        return
      }

      if (!contratosData || contratosData.length === 0) {
        setContratos([])
        setLoading(false)
        return
      }

      // 2️⃣ Buscar serviços para cada contrato e montar checklist
      const contratosComChecklist: Contrato[] = await Promise.all(
        contratosData.map(async (contrato) => {
          const { data: servicos, error: errorServicos } = await supabase
            .from("contratos_servicos")
            .select("*")
            .eq("cotacao", contrato.id) // FK para solicitacoes_contratos.id
            
            

          if (errorServicos) {
            console.error(`Erro ao buscar serviços do contrato ${contrato.id}:`, errorServicos.message)
          }
          console.log("Serviços encontrados:", servicos)

          // Checklist baseado nos serviços
       
          const checklist: Checklist = {
            iniciado: true, // sempre true
            anexado: servicos?.some(s => !!s.cotacao) || false,
            acordado: servicos?.some(s => s.acordado === true) || false,
            assinado: servicos?.some(s => s.contrato_assinado && s.contrato_assinado.trim() !== "") || false,
            pagamento: servicos?.some(s => s.inclusao_para_pagamento === true) || false,
          }

          return {
            ...contrato,
            checklist,
            servicos: servicos || [], // ✅ garante que os serviços fiquem disponíveis no JSX
          }
        })
      )

      setContratos(contratosComChecklist)
    } catch (error) {
      console.error("Erro inesperado ao buscar contratos:", error)
      setContratos([])
    } finally {
      setLoading(false)
    }
  }

  fetchContratos()
}, [])


useEffect(() => {
  const fetchFornecedor = async () => {
    if (!contratoSelecionado?.servicos?.[0]?.cnpj_fornecedor) return;

    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .eq("cnpj", contratoSelecionado.servicos[0].cnpj_fornecedor)
      .single();

    if (error) {
      console.error("Erro ao buscar fornecedor:", error.message);
      setFornecedorInfo(null);
    } else {
      setFornecedorInfo(data);
    }
  };

  fetchFornecedor();
}, [contratoSelecionado?.servicos?.[0]?.cnpj_fornecedor]);










  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, criado_em, ...dadosUpdate } = contratoSelecionado.servicos[0];

      const { error } = await supabase
        .from("contratos_servicos")
        .update(dadosUpdate)
        .eq("id", id);

      if (error) throw error;

      console.log("Alterações salvas ✅", dadosUpdate);
        // Atualiza estado local
  setContratos((prev) =>
    prev.map((c) =>
      c.id === contratoSelecionado.id ? { ...c, ...contratoSelecionado } : c
    )
  );
      fecharModal();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao salvar:", err.message);
      } else {
        console.error("Erro desconhecido:", err);
      }
    } finally {
      setLoading(false);
    }
  };


  // retorna array de mensagens com { userId, nome, fotoUrl, mensagem, data }
// Retorna array de mensagens com { userId, nome, fotoUrl, mensagem, data }
const parseObservacoes = async (observacaoStr: string) => {
  if (!observacaoStr) return [];

  const mensagens = observacaoStr.split(";"); // separa por mensagem

  const resultados = await Promise.all(
    mensagens.map(async (msg) => {
      const [userId, mensagem, data] = msg.split("|||");

      if (!userId || !mensagem) return null; // ignora mensagens inválidas

      // Busca info do usuário no Supabase
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("nome,fotocaminho")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error.message);
      }

      // Garante uma URL de imagem válida
      let fotoUrl = profile?.fotocaminho
        ? supabase.storage.from("fotoperfil").getPublicUrl(profile.fotocaminho).data.publicUrl
        : "/img.png"; // fallback para imagem padrão

      return {
        userId,
        nome: profile?.nome ?? "Desconhecido",
        fotoUrl,
        mensagem,
        data,
      };
    })
  );

  // Remove valores nulos caso tenha alguma mensagem inválida
  return resultados.filter((r) => r !== null);
};



// 2️⃣ Carrega as observações sempre que o contratoSelecionado mudar
useEffect(() => {
  const carregarObservacoes = async () => {
    if (contratoSelecionado?.servicos[0]?.observacao) {
      const obs = await parseObservacoes(
        contratoSelecionado.servicos[0].observacao
      );
      setObservacoesRender(obs);
    } else {
      setObservacoesRender([]);
    }
  };

  carregarObservacoes();
}, [contratoSelecionado]);


const handleNovaObservacao = async () => {
  if (!novaObservacao.trim()) return;

  try {
    // Pega o user atual
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "anon";

    // Cria a string com ID, mensagem e data
    const dataAtual = new Date().toISOString(); // formato ISO, ex: 2025-08-27T09:15:00.000Z
    const novaObsStr = `${userId}|||${novaObservacao.trim()}|||${dataAtual}`;

    // Atualiza localmente o estado do contrato
    setContratoSelecionado((prev) => {
      if (!prev) return prev;

      const servicosAtualizados = [...prev.servicos];
      const servico0 = { ...servicosAtualizados[0] };

      // Concatena com observações anteriores, se existirem
      if (servico0.observacao && servico0.observacao.length > 0) {
        servico0.observacao += `;${novaObsStr}`;
      } else {
        servico0.observacao = novaObsStr;
      }

      servicosAtualizados[0] = servico0;

      return { ...prev, servicos: servicosAtualizados };
    });

    // Envia para o Supabase
    const servico0 = contratoSelecionado.servicos[0];
    const { id } = servico0;

    const { error } = await supabase
      .from("contratos_servicos")
      .update({ observacao: contratoSelecionado.servicos[0].observacao + (contratoSelecionado.servicos[0].observacao ? `;${novaObsStr}` : novaObsStr) })
      .eq("id", id);

    if (error) throw error;

    // Limpa o input
    setNovaObservacao("");

  } catch (err) {
    console.error("Erro ao enviar observação:", err);
  }
};
















  const checklistItems = [
    { key: 'iniciado', label: 'Contrato Iniciado', icon: FileText },
    { key: 'anexado', label: 'Contrato Anexado', icon: ClipboardCheck },
    { key: 'acordado', label: 'Condições Acordadas', icon: FileCheck2 },
    { key: 'assinado', label: 'Contrato Aceito', icon: BadgeCheck },
    { key: 'pagamento', label: 'Inclusão p/ Pagamento', icon: Banknote },
  ];

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} `}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md h-[50px]">
        <div className="flex items-center space-x-4 w-full">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3">
            <button className="w-full text-left hover:text-gray-300">Contratos</button>
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
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-[#5a0d0d] mb-6">Elaboração e Ajustes</h1>

<div className="space-y-6">
  {contratos.map((contrato) => (
    <div
      key={contrato.id}
      onClick={() => abrirModal(contrato)}
      className="p-5 border border-gray-200 rounded-xl shadow bg-white hover:shadow-md transition-all cursor-pointer"
    >
      {/* Informações do contrato */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#5a0d0d]">{contrato.titulo}</h2>
        <p className="text-sm text-gray-600">{contrato.descricao}</p>
        {contrato.Fornecedorescolhido && (
          <p className="text-sm text-gray-600 mt-1">
            Fornecedor escolhido: <span className="font-medium">{contrato.Fornecedorescolhido}</span>
          </p>
        )}
      </div>

      {/* Serviços do contrato */}
  {/* Serviço do contrato */}
  {contrato.servicos && contrato.servicos.length > 0 && (
    <div className="mb-4">
      <p className="text-sm text-gray-600">
        CNPJ: <span className="font-medium">{contrato.servicos[0].cnpj_fornecedor}</span>
      </p>
      <p className="text-sm text-gray-600">
        Objeto: <span className="font-medium">{contrato.servicos[0].objeto_contrato}</span>
      </p>
      <p className="text-sm text-gray-600">
        Valor: <span className="font-medium">R$ {contrato.servicos[0].valor_unitario.toFixed(2)}</span>
      </p>
    </div>
  )}

      {/* Checklist com ícones */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {checklistItems.map(({ key, label, icon: Icon }) => {
          const checked = contrato.checklist?.[key as keyof typeof contrato.checklist] || false;
          return (
            <div
              key={key}
              className={`flex flex-col items-center justify-center text-center p-3 border rounded-md ${
                checked
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
              {checked && <CheckCircle className="w-4 h-4 mt-1 text-green-600" />}
            </div>
          );
        })}
      </div>
    
  

              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={isModalOpen} onClose={fecharModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg shadow-lg  w-8/10 p-0 flex overflow-hidden max-h-[90vh]">
        {/* Formulário - lado esquerdo */}
        <div className="w-[70%] p-6 overflow-y-auto">
    <Dialog.Title className="text-lg font-bold text-[#5a0d0d] mb-4">Editar Contrato</Dialog.Title>
    
  {contratoSelecionado && (
    <div className="space-y-4">
           {/* Cotação */}
     <div>
        <label className="block font-medium text-sm text-gray-700">Nome da cotação</label>
        <input
          type="text"
          disabled={true}
          value={contratoSelecionado.titulo}
          onChange={e =>
            setContratoSelecionado({ ...contratoSelecionado, titulo: e.target.value })
          }
          className="w-full border rounded px-3 font-bold bg-yellow-50 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Lista de Orçamentos */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Orçamentos disponíveis</h3>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {contratoSelecionado &&
    [contratoSelecionado.orcamento1,
     contratoSelecionado.orcamento2,
     contratoSelecionado.orcamento3,
     contratoSelecionado.orcamento4,
     contratoSelecionado.orcamento5,
     contratoSelecionado.orcamento6]
      .filter(Boolean) // remove undefined/null
      .map((orc, index) => (
        <a
          key={index}
          href={orc}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition hover:bg-gray-50 group"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
            <span className="text-sm font-medium text-gray-800">
              Orçamento {index + 1}
            </span>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
        </a>
      ))}
</div>

      </div>

      {/* Fornecedor vencedor e Motivação */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-blue-700">Fornecedor Vencedor</h4>
        </div>
        <p className="text-sm text-gray-800 mb-3">{contratoSelecionado.Fornecedorescolhido}</p>

        <div>
          <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Motivação</h5>
          <p className="text-sm text-gray-700">{contratoSelecionado.motivacaodaescolha}</p>
        </div>
      </div>
      



  
<section className="p-6 bg-white rounded-xl shadow-md space-y-6">
  <h3 className="text-lg font-semibold text-gray-700">Fornecedor escolhido:</h3>
  {/* CNPJ editável */}
  <div className="flex flex-col col-span-1">
    <label className="block font-semibold text-sm text-gray-700 mb-2">
      CNPJ ou CPF do Fornecedor
    </label>
    <Input
      value={contratoSelecionado.servicos[0]?.cnpj_fornecedor || ""}
      disabled={!isEditable}
      onChange={e => {
        if (!contratoSelecionado?.servicos?.length) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          cnpj_fornecedor: e.target.value,
        }; 

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
      placeholder="Digite o CNPJ ou CPF"
      className="w-full py-3 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition outline-none"
    />
  </div>

  {/* Demais campos auto preenchidos */}
<fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <legend className="sr-only">Informações do Fornecedor</legend>
  {[
    { label: "Nome do Fornecedor", value: fornecedorInfo?.nome_fantasia || "", span: "col-span-3" },
    { label: "Status do Fornecedor", value: fornecedorInfo?.status || "", span: "col-span-1" },
    { label: "Tipo de Fornecedor", value: fornecedorInfo?.tipo_fornecedor || "", span: "col-span-1" },
    { label: "Natureza Jurídica", value: fornecedorInfo?.natureza_juridica || "", span: "col-span-1" },
    { label: "Categoria", value: fornecedorInfo?.categoria || "", span: "col-span-3" },
    { label: "Und. de Fornecimento", value: fornecedorInfo?.unidade_fornecimento || "", span: "col-span-1" },
    { label: "Contato", value: fornecedorInfo?.responsavel_comercial || "", span: "col-span-1" },
    { label: "Número do Contato", value: fornecedorInfo?.telefone_principal || "", span: "col-span-1" },
    { label: "E-mail", value: fornecedorInfo?.email || "", span: "col-span-3" },
    {
      label: "Endereço",
      value: [
        fornecedorInfo?.endereco,
        fornecedorInfo?.numero,
        fornecedorInfo?.complemento,
        fornecedorInfo?.bairro,
        fornecedorInfo?.cidade_uf,
        fornecedorInfo?.cep,
        fornecedorInfo?.pais,
      ]
        .filter(Boolean)
        .join(", ") || "",
      span: "col-span-3"
    },
  ].map((field, index) => (
    <div key={index} className={`flex flex-col ${field.span}`}>
      <label className="block font-medium text-sm text-gray-600 mb-1">
        {field.label}
      </label>
      <Input
        value={field.value}
        disabled={true}
        className="w-full py-3 px-4 bg-gray-100 cursor-not-allowed whitespace-nowrap overflow-x-auto rounded-md border border-gray-200"
      />
    </div>
  ))}
</fieldset>
</section>



      {/* Objeto do Contrato */}
       <h3 className="text-lg font-semibold mt-5 text-gray-700">Termos do Contrato:</h3>
<div className="mt-2">
  <label className="block font-medium text-sm text-gray-700 mb-1">Objeto do Contrato</label>
  <textarea
    value={contratoSelecionado.servicos?.[0]?.objeto_contrato || ""}
    disabled={!isEditable}
    onChange={e => {
      if (!contratoSelecionado?.servicos || contratoSelecionado.servicos.length === 0) return;

      const updatedServico = {
        ...contratoSelecionado.servicos[0],
        objeto_contrato: e.target.value,
      };

      setContratoSelecionado({
        ...contratoSelecionado,
        servicos: [updatedServico],
      });
    }}
    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    rows={4}
    placeholder="Descreva os termos do contrato aqui..."
  />
</div>

{/* Valor e Unidade de Medida em uma linha */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
  {/* Valor do Contrato */}
  <div>
    <label className="block font-medium text-sm text-gray-700 mb-1">
      Valor do Contrato (R$)
    </label>
    <input
      type="number"
      step="0.01"
      value={contratoSelecionado.servicos?.[0]?.valor_unitario || ""}
      disabled={!isEditable}
      onChange={e => {
        if (!contratoSelecionado?.servicos || contratoSelecionado.servicos.length === 0) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          valor_unitario: parseFloat(e.target.value),
        };

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      placeholder="0,00"
    />
  </div>

  {/* Unidade de Medida */}
  <div>
    <label className="block font-medium text-sm text-gray-700 mb-1">
      Unidade de Medida
    </label>
    <input
      type="text"
      value={contratoSelecionado.servicos?.[0]?.unidade_medida || ""}
      onChange={e => {
        if (!contratoSelecionado?.servicos || contratoSelecionado.servicos.length === 0) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          unidade_medida: e.target.value,
        };

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      placeholder="Ex: kg, m², unidade"
    />
  </div>
</div>




{/* Tipo de pagamento */}
<div>
  <label className="block font-medium text-sm text-gray-700 mb-1">Tipo de Pagamento</label>
  <div className="flex items-center gap-6">

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pagamentoTipo"
        value="fixo"
        disabled={!isEditable}
        checked={contratoSelecionado.servicos?.[0]?.tipo_pagamento === 'fixo'}
        onChange={() => {
          if (!contratoSelecionado?.servicos?.length) return;

          const updatedServico = {
            ...contratoSelecionado.servicos[0],
            tipo_pagamento: 'fixo',
          };

          setContratoSelecionado({
            ...contratoSelecionado,
            servicos: [updatedServico],
          });
        }}
      />
      <span>Fixo por período</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pagamentoTipo"
        value="nota"
        disabled={!isEditable}
        checked={contratoSelecionado.servicos?.[0]?.tipo_pagamento === 'nota'}
        onChange={() => {
          if (!contratoSelecionado?.servicos?.length) return;

          const updatedServico = {
            ...contratoSelecionado.servicos[0],
            tipo_pagamento: 'nota',
          };

          setContratoSelecionado({
            ...contratoSelecionado,
            servicos: [updatedServico],
          });
        }}
      />
      <span>Após emissão de Nota Fiscal</span>
    </label>

  </div>
</div>

{/* Campos dinâmicos pagamento */}
{contratoSelecionado.servicos?.[0]?.tipo_pagamento === 'fixo' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* Periodicidade */}
    <div>
      <label className="block font-medium text-sm text-gray-700">
        Periodicidade de Pagamento
      </label>
      <select
        value={contratoSelecionado.servicos[0]?.periodicidade || ""}
        disabled={!isEditable}
        onChange={(e) => {
          if (!contratoSelecionado?.servicos?.length) return;

          const updatedServico = {
            ...contratoSelecionado.servicos[0],
            periodicidade: e.target.value,
          };

          setContratoSelecionado({
            ...contratoSelecionado,
            servicos: [updatedServico],
          });
        }}
        className="w-full border rounded px-3 py-2"
        required
      >
        <option value="">Selecione</option>
        <option>Único</option>
        <option>Diário</option>
        <option>Semanal</option>
        <option>Quinzenal</option>
        <option>Mensal</option>
        <option>Bimestral</option>
        <option>Trimestral</option>
        <option>Semestral</option>
      </select>
    </div>

    {/* Próximo pagamento */}
    <div>
      <label className="block font-medium text-sm text-gray-700">Próximo Pagamento</label>
      <input
        type="date"
          value={
  contratoSelecionado.servicos?.[0]?.proximopagamento
    ? new Date(contratoSelecionado.servicos[0].proximopagamento)
        .toISOString()
        .split("T")[0] // só YYYY-MM-DD
    : ""
}
disabled={!isEditable}
        onChange={(e) => {
          if (!contratoSelecionado?.servicos?.length) return;

          const updatedServico = {
            ...contratoSelecionado.servicos[0],
             proximopagamento: new Date(e.target.value), // converte string para Date
          };

          setContratoSelecionado({
            ...contratoSelecionado,
            servicos: [updatedServico],
          });
        }}
        className="w-full border rounded px-3 py-2"
        required
      />
    </div>

  </div>
)}

{contratoSelecionado.servicos?.[0]?.tipo_pagamento === 'nota' && (
  <div>
    <label className="block font-medium text-sm text-gray-700">
      Dias para pagamento após emissão da Nota Fiscal
    </label>
    <input
      type="number"
      min={0}
      value={contratoSelecionado.servicos[0]?.diasaposemissao || ""}
      disabled={!isEditable}
      onChange={(e) => {
        if (!contratoSelecionado?.servicos?.length) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          diasaposemissao: e.target.value,
        };

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
      className="w-full border rounded px-3 py-2"
      required
    />
  </div>
)}



{/* Encerramento */}
<div>
  <label className="block font-medium text-sm text-gray-700">Data de Encerramento</label>
  <div className="flex items-center space-x-2">
    <input
      type="date"
      value={
        contratoSelecionado.servicos?.[0]?.dataencerramento
          ? new Date(contratoSelecionado.servicos[0].dataencerramento)
              .toISOString()
              .split("T")[0]
          : ""
      }
        disabled={
    !isEditable || 
    contratoSelecionado.servicos?.[0]?.semdataencerramento || 
    contratoSelecionado.servicos?.[0]?.dataencerramento === null
  }
      onChange={(e) => {
        if (!contratoSelecionado?.servicos?.length) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          dataencerramento: e.target.value ? new Date(e.target.value) : null,
        };

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
      className="w-full border rounded px-3 py-2"
      // desabilita input apenas se checkbox estiver marcado
  
    />

    <label className="inline-flex items-center space-x-2">
      <input
        type="checkbox"
        // Checkbox marcado automaticamente se dataencerramento for null
        checked={contratoSelecionado.servicos?.[0]?.dataencerramento === null}
        onChange={(e) => {
          if (!contratoSelecionado?.servicos?.length) return;

          const checked = e.target.checked;

          const updatedServico = {
            ...contratoSelecionado.servicos[0],
            semdataencerramento: checked,          // salva checkbox
            dataencerramento: checked ? null : contratoSelecionado.servicos[0].dataencerramento,
          };

          setContratoSelecionado({
            ...contratoSelecionado,
            servicos: [updatedServico],
          });
        }}
      />
      <span>Sem data de encerramento</span>
    </label>
  </div>
</div>






{/* Controle */}
<div>
  <label className="block font-medium text-sm text-gray-700">Controle</label>
  <select
    value={contratoSelecionado.servicos?.[0]?.controle || ""}
    disabled={!isEditable}
    onChange={(e) => {
      if (!contratoSelecionado?.servicos?.length) return;

      const updatedServico = {
        ...contratoSelecionado.servicos[0],
        controle: e.target.value,
      };

      setContratoSelecionado({
        ...contratoSelecionado,
        servicos: [updatedServico],
      });
    }}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">Selecione</option>
    <option>Definir dias da semana</option>
    <option>Semanal</option>
    <option>Quinzenal</option>
    <option>Mensal</option>
    <option>Bimestral</option>
    <option>Semestral</option>
  </select>
</div>

{contratoSelecionado.servicos?.[0]?.controle === "Definir dias da semana" && (
  <div className="flex flex-wrap gap-2">
    {diasSemana.map((dia) => (
      <label key={dia} className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={
            contratoSelecionado.servicos?.[0]?.diasdasemanacontrole?.includes(dia) ||
            false
          }
          disabled={!isEditable}
          onChange={() => {
            if (!contratoSelecionado?.servicos?.length) return;

            const servicoAtual = contratoSelecionado.servicos[0];
            const diasControle = servicoAtual.diasdasemanacontrole || [];

            const updatedServico = {
              ...servicoAtual,
              diasdasemanacontrole: diasControle.includes(dia)
                ? diasControle.filter((d) => d !== dia)
                : [...diasControle, dia],
            };

            setContratoSelecionado({
              ...contratoSelecionado,
              servicos: [updatedServico],
            });
          }}
        />
        <span>{dia}</span>
      </label>
    ))}
  </div>
)}

{/* Tipo de contrato */}
<div>
  <label className="block font-medium text-sm text-gray-700">Tipo de Contrato</label>
  <select
    value={contratoSelecionado.servicos?.[0]?.tipodecontrato || ""}
    disabled={!isEditable}
    onChange={(e) => {
      if (!contratoSelecionado?.servicos?.length) return;

      const updatedServico = {
        ...contratoSelecionado.servicos[0],
        tipodecontrato: e.target.value,
      };

      setContratoSelecionado({
        ...contratoSelecionado,
        servicos: [updatedServico],
      });
    }}
    className="w-full border rounded px-3 py-2"
  >
                <option value="">Selecione</option>
                <option>Por demanda</option>
                <option>Mensal</option>
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Diário</option>
                <option>Fixo</option>
                <option>Outro</option>
  </select>
</div>

{/* NR's necessárias */}
<div>
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={contratoSelecionado.servicos?.[0]?.nrs || false}
      disabled={!isEditable}
      onChange={(e) => {
        if (!contratoSelecionado?.servicos?.length) return;

        const updatedServico = {
          ...contratoSelecionado.servicos[0],
          nrs: e.target.checked, // <-- ajuste aqui
        };

        setContratoSelecionado({
          ...contratoSelecionado,
          servicos: [updatedServico],
        });
      }}
    />
    <span>Será necessário NR(s) para realizar o serviço?</span>
  </label>
</div>


{/* Upload / Download do contrato assinado */}
<div className="mb-4">
  <label className="block font-medium text-sm text-gray-700 mb-1">
    Contrato Assinado
  </label>

  {contratoSelecionado.servicos?.[0]?.contrato_assinado ? (
    <div className="flex items-center gap-3">
      {/* Link para baixar o contrato existente */}
      <a
        href={contratoSelecionado.servicos[0].contrato_assinado}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded border transition"
      >
        <Download size={18} />
        <span className="text-sm font-medium">Contrato assinado disponível</span>
      </a>

      {/* Botão para anexar novo arquivo */}
{user?.id === "0ec3a584-6807-44ba-afc6-ffdc41afb049" && (
  <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border transition">
    <UploadCloud size={18} />
    <span className="text-sm">Atualizar contrato</span>
    <input
      type="file"
      onChange={handleFileChange}
      className="hidden"
    />
  </label>
)}

      {/* Nome do arquivo selecionado */}
      {arquivo && <span className="text-sm text-gray-600">{arquivo.name}</span>}
    </div>
  ) : (
    <div className="flex items-center gap-3">
      {/* Somente upload se não existir contrato */}
      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border transition">
        <UploadCloud size={18} />
        <span className="text-sm">Selecionar arquivo</span>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Nome do arquivo selecionado */}
      {arquivo && <span className="text-sm text-gray-600">{arquivo.name}</span>}
    </div>
  )}
</div>



<div className="space-y-4">
  <h3 className="text-sm font-semibold text-gray-700">Documentos do Contrato</h3>

  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
    {/* Contrato principal */}
    <li className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          <span className="text-sm font-medium text-gray-800">Contrato</span>
        </div>

        {contratoSelecionado.servicos?.[0]?.contrato && (
          <a
            href={contratoSelecionado.servicos[0].contrato}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Abrir <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Upload do contrato */}
      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border w-fit">
        <UploadCloud size={18} />
        <span className="text-sm">
          {contratoSelecionado.servicos?.[0]?.contrato ? "Trocar contrato" : "Anexar contrato"}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files?.[0]) return;
            const file = e.target.files[0];
            // upload e atualizar contratoSelecionado.servicos[0].contrato
          }}
        />
      </label>
    </li>

    {/* Documento 1 */}
    <li className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          <input
            type="text"
            placeholder="Nome do documento 1"
            value={contratoSelecionado.servicos?.[0]?.documento1nome || ""}
             disabled={!isEditable}
            onChange={(e) => {
              const updatedServico = {
                ...contratoSelecionado.servicos[0],
                documento1nome: e.target.value,
              };
              setContratoSelecionado({
                ...contratoSelecionado,
                servicos: [updatedServico],
              });
            }}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        {contratoSelecionado.servicos?.[0]?.documento1 && (
          <a
            href={contratoSelecionado.servicos[0].documento1}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Abrir <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border w-fit">
        <UploadCloud size={18} />
        <span className="text-sm">
          {contratoSelecionado.servicos?.[0]?.documento1 ? "Trocar arquivo" : "Anexar arquivo"}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files?.[0]) return;
            const file = e.target.files[0];
            // upload e atualizar contratoSelecionado.servicos[0].documento1
          }}
        />
      </label>
    </li>

    {/* Documento 2 */}
    <li className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          <input
            type="text"
            placeholder="Nome do documento 2"
            value={contratoSelecionado.servicos?.[0]?.documento2nome || ""}
            disabled={!isEditable}
            onChange={(e) => {
              const updatedServico = {
                ...contratoSelecionado.servicos[0],
                documento2nome: e.target.value,
              };
              setContratoSelecionado({
                ...contratoSelecionado,
                servicos: [updatedServico],
              });
            }}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        {contratoSelecionado.servicos?.[0]?.documento2 && (
          <a
            href={contratoSelecionado.servicos[0].documento2}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Abrir <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border w-fit">
        <UploadCloud size={18} />
        <span className="text-sm">
          {contratoSelecionado.servicos?.[0]?.documento2 ? "Trocar arquivo" : "Anexar arquivo"}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files?.[0]) return;
            const file = e.target.files[0];
            // upload e atualizar contratoSelecionado.servicos[0].documento2
          }}
        />
      </label>
    </li>

    {/* Documento 3 */}
    <li className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
          <input
            type="text"
            placeholder="Nome do documento 3"
            value={contratoSelecionado.servicos?.[0]?.documento3nome || ""}
            disabled={!isEditable}
            onChange={(e) => {
              const updatedServico = {
                ...contratoSelecionado.servicos[0],
                documento3nome: e.target.value,
              };
              setContratoSelecionado({
                ...contratoSelecionado,
                servicos: [updatedServico],
              });
            }}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        {contratoSelecionado.servicos?.[0]?.documento3 && (
          <a
            href={contratoSelecionado.servicos[0].documento3}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Abrir <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border w-fit">
        <UploadCloud size={18} />
        <span className="text-sm">
          {contratoSelecionado.servicos?.[0]?.documento3 ? "Trocar arquivo" : "Anexar arquivo"}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files?.[0]) return;
            const file = e.target.files[0];
            // upload e atualizar contratoSelecionado.servicos[0].documento3
          }}
        />
      </label>
    </li>
  </ul>
</div>






      {/* Ações */}
 <div className="flex justify-end gap-2 pt-4">
      <button
        onClick={fecharModal}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className={`px-6 py-3 rounded-xl font-medium transition-all ${
          loading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white inline-block mr-2"
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
            Salvando...
          </>
        ) : (
          "Salvar Alterações"
        )}
      </button>
    </div>
    </div>
  )}
  </div>

  {/* Observações - lado direito */}
  <div className="w-[30%] bg-gray-50 border-l border-gray-200 p-4 flex flex-col">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">Observações</h3>
    
<div className="flex-1 overflow-y-auto space-y-4 pr-2">
  {observacoesRender.length > 0 ? (
    observacoesRender.map((obs, index) => (
      <div key={index} className="flex items-start space-x-3">
        <div className="flex flex-col items-center">
          {obs.fotoUrl ? (
            <img
               src={obs.fotoUrl || '/img.png'}
              className="w-8 h-8 rounded-full object-cover"
              alt={obs.nome}
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {obs.nome?.[0] ?? "?"}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-1 text-center max-w-[60px] truncate">
            {obs.nome ?? "Desconhecido"}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-full">
          <p className="text-sm text-gray-800 mb-1">{obs.mensagem ?? ""}</p>
          <span className="text-xs text-gray-400">
            {new Date(obs.data).toLocaleString()}
          </span>
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500">Nenhuma observação disponível.</p>
  )}
</div>


    {/* Caixa para nova observação */}
    <div className="pt-4 flex gap-2 items-center">
      <input
        type="text"
        placeholder="Digite uma nova observação..."
        className="flex-1 border rounded-lg px-4 py-2 text-sm"
        value={novaObservacao}
        onChange={(e) => setNovaObservacao(e.target.value)}
      />
      <button
        onClick={() => handleNovaObservacao()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
      >
        Enviar
      </button>
    </div>
  </div>
</Dialog.Panel>

        </div>
      </Dialog>
    </div>
  );
}



{/* --- Componentes reutilizáveis --- */}
function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border rounded px-3 py-2 ${className || ""}`}
      {...props}
    />
  );
}



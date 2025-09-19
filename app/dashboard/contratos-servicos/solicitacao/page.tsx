'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { ArrowLeft, Search, Paperclip, FileText, X } from "lucide-react";
import { supabase } from '../../../../lib/superbase';
import { useUser } from '@/components/UserContext';


export default function SolicitarContrato() {
    const [loading, setLoading] = useState(false);
    const { nome } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('contratos');
    const [menuActive, setMenuActive] = useState(false);
    const [apelido, setApelido] = useState('');
    const [descricao, setDescricao] = useState('');
    const [fornecedor, setFornecedor] = useState('');
    const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<Fornecedor[]>([]);
    const [arquivos, setArquivos] = useState<(File | null)[]>([null, null, null]);
    const [fornecedoresOrcamento, setFornecedoresOrcamento] = useState<string[]>(['', '', '']);
    const [fornecedoresCadastrados, setFornecedoresCadastrados] = useState<Fornecedor[]>([]);

type Fornecedor = {
  nome: string;
  cadastrado: boolean;
};
  
const resultados = fornecedor
  ? fornecedoresCadastrados.filter(f =>
      f.nome.toLowerCase().includes(fornecedor.toLowerCase())
    )
  : [];

    function handleFornecedorChange(index: number, nome: string) {
    const novosFornecedores = [...fornecedoresOrcamento];
    novosFornecedores[index] = nome;
    setFornecedoresOrcamento(novosFornecedores);
  }

  const handleAdicionar = (nome: string, cadastrado: boolean) => {
    if (!fornecedoresSelecionados.find((f) => f.nome === nome)) {
      setFornecedoresSelecionados([
        ...fornecedoresSelecionados,
        { nome, cadastrado }
      ]);
    }
    setFornecedor("");
  };

  const handleRemover = (nome: string) => {
    setFornecedoresSelecionados(
      fornecedoresSelecionados.filter((f) => f.nome !== nome)
    );
  };


useEffect(() => {
  const fetchFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('nome_fantasia');

    if (error) {
      console.error('Erro ao buscar fornecedores:', error.message);
    } else if (data) {
      const fornecedores: Fornecedor[] = (data as { nome_fantasia: string }[]).map(f => ({
        nome: f.nome_fantasia,
        cadastrado: true // todos os buscados do Supabase são cadastrados
      }));
      setFornecedoresCadastrados(fornecedores);
    }
  };

  fetchFornecedores();
}, []);



const dataHoje = new Date();
const dataPrevisao = new Date(dataHoje);
dataPrevisao.setDate(dataHoje.getDate() + 7); // adiciona 7 dias

// Formate para string ISO (só a parte da data, yyyy-mm-dd)
const previsaoConclusaoStr = dataPrevisao.toISOString().slice(0, 10);



// (Orçamentos) ----------------------------------------------------------------------============-------=========--------------

async function handleEnviarSolicitacao() {
  // 1️⃣ Verifica campos obrigatórios principais
  if (!apelido?.trim()) {
    alert("O campo 'Título' é obrigatório.");
    return;
  }
  if (!descricao?.trim()) {
    alert("O campo 'Descrição' é obrigatório.");
    return;
  }

  // 2️⃣ Verifica fornecedores dos orçamentos
  for (let i = 0; i < arquivos.length; i++) {
    const fornecedorAtual = fornecedoresOrcamento[i]?.trim();
    if (arquivos[i] && !fornecedorAtual) {
      alert(`Por favor, informe o fornecedor para o Orçamento ${i + 1}.`);
      return;
    }
  }

  // 3️⃣ Pega usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Usuário não autenticado!");
    return;
  }

  setIsSaving(true);
  setLoading(true);

  const urls: (string | null)[] = [null, null, null];

  // Sanitiza apelido para nome de arquivo
  const apelidoSanitizado = apelido
    .toUpperCase()
    .replace(/[\\/:*?"<>|]/g, '_');

  try {
    // Percorre cada arquivo de orçamento
    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      if (!arquivo) continue;

      const fileName = `${apelidoSanitizado}_orcamento${i + 1}_${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}${arquivo.name.slice(arquivo.name.lastIndexOf('.'))}`;

      const fornecedorAtual = fornecedoresOrcamento[i]?.trim() || "sem_fornecedor";

      console.log(`🟡 Enviando Orçamento ${i + 1} via API backend...`);

      // Chamada à rota backend
      const formDataAPI = new FormData();
      formDataAPI.append("file", arquivo);
      formDataAPI.append("fileName", fileName);
      formDataAPI.append("dataCompra", new Date().toISOString().slice(0, 10));
      formDataAPI.append("fornecedor", fornecedorAtual);
      formDataAPI.append("tipo", "orçamentos-contratos");

      const res = await fetch("/api/onedrive/upload", { method: "POST", body: formDataAPI });
      const data = await res.json();
      const url = data.file?.url || null;

      if (!url) {
        console.warn(`⚠️ Orçamento ${i + 1} não retornou URL`);
      } else {
        console.log(`✅ Orçamento ${i + 1} enviado com sucesso:`, url);
      }

      urls[i] = url;
    }

    // Salva a solicitação no Supabase
    const { error } = await supabase
      .from('solicitacoes_contratos')
      .insert([{
        id_solicitante: user.id,
        titulo: apelido,
        descricao: descricao,
        fornecedor_sugerido: [
          ...fornecedoresSelecionados.map(f => f.nome),
          ...fornecedoresOrcamento.filter(f => f && f.trim() !== "")
        ].join(', '),
        orcamento1: urls[0] || "",
        orcamento2: urls[1] || "",
        orcamento3: urls[2] || "",
        status: "Solicitado",
        previsao_conclusao: previsaoConclusaoStr
      }]);

    if (error) throw error;

    alert("Solicitação enviada com sucesso!");
    router.push('/dashboard/contratos-servicos/acompanhar-solicitacao');

  } catch (err) {
    console.error("❌ Erro geral:", err);
    alert("Erro ao enviar solicitação.");
  } finally {
    setIsSaving(false);
    setLoading(false);
  }
}








  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };





  const handleFileChange = (index: number, file: File | null) => {
    const novosArquivos = [...arquivos];
    novosArquivos[index] = file;
    setArquivos(novosArquivos);
  };





  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
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
              Solicitar Novo Contrato
            </span>
          </div>
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

        <div className="p-6 w-full max-w-[1100px] mx-auto space-y-6">

                    {/* Título */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Título
            </label>
            <textarea
              rows={1}
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="Coloque um nome que seja fácil de localizar depois"
              className="w-full border border-gray-300 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>
          {/* Descrição */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Descreva o que deseja contratar
            </label>
            <textarea
              rows={6}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite todos os detalhes do serviço/produto que deseja contratar..."
              className="w-full border border-gray-300 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Buscar Fornecedor */}
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Sugerir Fornecedor
      </label>
      <div className="relative">
        <input
          type="text"
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
          placeholder="Digite o nome do fornecedor..."
          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
        />
        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
      </div>

      {/* Lista de sugestões */}
      {fornecedor && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          {resultados.length > 0 ? (
            resultados.map((f, i) => (
  <div
    key={i}
    onClick={() => handleAdicionar(f.nome, f.cadastrado)}
    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
  >
    {f.nome}
    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      Cadastrado
    </span>
  </div>
))
          ) : (
            <div
              onClick={() => handleAdicionar(fornecedor, false)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
            >
              {fornecedor}
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Novo
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lista de fornecedores adicionados */}
      {fornecedoresSelecionados.length > 0 && (
        <div className="mt-4 space-y-2">
          {fornecedoresSelecionados.map((f, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            >
              <span>{f.nome}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    f.cadastrado
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {f.cadastrado ? "Fornecedor Cadastrado" : "Fornecedor Novo"}
                </span>
                <X
                  size={16}
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                  onClick={() => handleRemover(f.nome)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

          {/* Lista de Serviços */}
          <div
            onClick={() => router.push('/dashboard/contratos-servicos/servicos-cadastrados')}
            className="bg-white rounded-2xl shadow p-6 border border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
          >
            <div>
              <h4 className="text-sm font-semibold text-gray-700">
                Visualizar todos os serviços cadastrados
              </h4>
              <p className="text-xs text-gray-500">
                Clique aqui para ver serviços que podem servir de referência
              </p>
            </div>
            <FileText className="text-[#5a0d0d]" size={20} />
          </div>

          {/* Upload Orçamentos */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Anexar até 3 Orçamentos (opcional)
            </label>

            <div className="space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#5a0d0d] text-white rounded-lg cursor-pointer hover:bg-[#7a1a1a] transition-all">
                    <Paperclip size={18} />
                    Selecionar Arquivo {index + 1}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(index, e.target.files ? e.target.files[0] : null)
                      }
                    />
                  </label>
                  {arquivos[index] && (
                    <span className="text-sm text-gray-600 truncate max-w-[250px]">
                      {arquivos[index]?.name}
                    </span>
                  )}


                            {/* Caixa de texto para o nome do fornecedor */}
          <input
            type="text"
            placeholder="Nome do fornecedor"
            value={fornecedoresOrcamento[index]}
            onChange={(e) => handleFornecedorChange(index, e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[200px]"
          />



                </div>
              ))}
            </div>
          </div>

          {/* Botão Enviar */}
          <div className="flex justify-end">
 <button
      onClick={handleEnviarSolicitacao}
      disabled={loading}
      className={`px-6 py-3 rounded-xl font-medium transition-all ${
        loading
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white'
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
          Enviando...
        </>
      ) : (
        'Enviar Solicitação'
      )}
    </button>
          </div>
        </div>
      </div>
    </div>
  );
}
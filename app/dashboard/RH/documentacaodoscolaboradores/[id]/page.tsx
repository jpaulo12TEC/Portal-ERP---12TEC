"use client";
import { useParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/superbase';
import { Search, PlusCircle, ArrowLeft } from "lucide-react";
import { useUser } from '@/components/UserContext';
import Sidebar from '../../../../../components/Sidebar';
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, X } from "lucide-react";


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
    "Certidao de Nascimento",
  ],
  competencia: ["Diploma", "Certificado de Curso"],
  seguranca: ["Treinamento de Seguranca"],
};
type DocumentoPersonalizado = {
  nome: string;
  categoria: string;
  atualizado_por: string;
};
interface Funcionario {
  id: string;
  foto: string;
  fotoUrl?: string;
  tipo_regime: string;
  nome_completo: string;
  cargo: string;
  data_admissao: Date;
  processo: string;
  departamento: string;
  filial: string;
  observacoes: string;
  abreviatura: string;
  cpf:string
}

interface ComprovanteFuncionario {
  id: string;
  funcionario_id: string;
  nome_documento: string;
  mes_referencia: string | null;
  referente_a: string | null;
  valido: boolean;
  nome_arquivo: string;
}

interface Documento {
  nome_documento: string;
  Visualizar_menu?: string;
  postado_por?: string;
  vencimento?: string;
  comentario?: string;
  tipo_documento: string
  valido: boolean
  atualizado_por: string
  id: string
  nome_arquivo: string
}

type ModalProps = {
  documento: Documento | null;
  onClose: () => void;
};


export default function DocumentacaoColaborador() {

const [nomeDocumentoComprovantes, setNomeDocumentoComprovantes] = useState("");
const [mesReferencia, setMesReferencia] = useState("");
const [referenteA, setReferenteA] = useState("");
const [mostrarModalComprovantes, setMostrarModalComprovantes] = useState(false);
const [arquivocomprovantes, setArquivoComprovante] = useState<File | null>(null);
const [abaAtivaPorSelecao, setAbaAtivaPorSelecao] = useState<string | null>(null);
const [idComprovanteSelecionado, setIDDocumento] = useState("");
const [nomeArquivos, setNomeArquivo] = useState("");

const [nomeDocumentoDesabilitado, setNomeDocumentoDesabilitado] = useState(false);
const [updateOrNot, setupdateOrNot] = useState(false);

const [activeTabLocal, setActiveTabLocal] = useState("documentacao"); // controla aba ativa
const [documentoSelecionado, setDocumentoSelecionado] = useState('')
const [nomePersonalizado, setNomePersonalizado] = useState('')
const [arquivo, setArquivo] = useState<File | null>(null);
const [vencimento, setVencimento] = useState('')
const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
const [docSelecionado, setDocSelecionado] = useState<any>(null); // ou tipa melhor se tiver
const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
const user = useUser();
const [modoSelecao, setModoSelecao] = useState(false);
  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState('');
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vencimentoinserirsubstituir, setVencimentoInserirSubstituir] = useState("");
  const [arquivoinserirsubstituir, setArquivoInserirSubstituir] = useState<File | null>(null);
  const router = useRouter();
  const { id } = useParams();
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);


const [documentospersonalizados, setDocumentospersonalizados] = useState<DocumentoPersonalizado[]>([]);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categorias = [
    "Identificação",
    "RH",
    "Competência",
    "Contratação",
    "Segurança",
  ];

const handleCheckboxChange = (docId: string, isChecked: boolean, aba: string) => {
  setSelectedDocs((prev) => {
    const updated = new Set(prev);
    isChecked ? updated.add(docId) : updated.delete(docId);
    return updated;
  });

  // Aqui você define a constante dinâmica
  setAbaAtivaPorSelecao(aba);
};


const handleDownloadSelectedDocs = async () => {
  if (!funcionario || selectedDocs.size === 0) return;

  type DocumentoEnviar = { id: string; nome_arquivo: string }; // URL do SharePoint

  const generateCodeVerifier = (length = 64) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  try {
    const tabela = abaAtivaPorSelecao === "documentacaogeral"
      ? "documentoscolaboradores"
      : "comprovantesfuncionarios";

    const { data, error } = await supabase
      .from(tabela)
      .select("id, nome_arquivo")
      .in("id", Array.from(selectedDocs));

    if (error) throw error;
    const docs = data as DocumentoEnviar[];

    // Salva pendentes e página atual
    localStorage.setItem('pendingDownloads', JSON.stringify(docs.map(d => d.nome_arquivo)));
    localStorage.setItem('currentPage', window.location.pathname + window.location.search);

    const downloadWithToken = async (url: string) => {
      const apiUrl = `/api/onedrive/download?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);

      if (response.status === 401) {
        // Token ausente → redireciona pro login
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        document.cookie = `code_verifier=${codeVerifier}; path=/; SameSite=Strict; ${location.protocol === 'https:' ? 'secure' : ''}`;

        const loginUrl = `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.NEXT_PUBLIC_AZURE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/callback')}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}&response_mode=query&scope=User.Read Files.ReadWrite.All offline_access&code_challenge=${codeChallenge}&code_challenge_method=S256`;
        window.location.href = loginUrl;
        return false; // interrompe
      }

      if (!response.ok) throw new Error(`Falha ao baixar ${url}`);

      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const parts = url.split('/');
      a.download = decodeURIComponent(parts[parts.length - 1]) || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    };

    for (const url of docs.map(d => d.nome_arquivo)) {
      const ok = await downloadWithToken(url);
      if (!ok) break;
    }

  } catch (err) {
    console.error(err);
    alert("Erro ao baixar os documentos.");
  }
};

// **No load da página, tenta baixar pendentes automaticamente**
window.addEventListener('load', async () => {
  const pendingDownloads = JSON.parse(localStorage.getItem('pendingDownloads') || '[]') as string[];
  if (pendingDownloads.length > 0) {
    const currentPage = localStorage.getItem('currentPage') || '/';
    // limpa antes de começar
    localStorage.removeItem('pendingDownloads');
    localStorage.removeItem('currentPage');

    for (const url of pendingDownloads) {
      try {
        const res = await fetch(`/api/onedrive/download?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`Falha ao baixar ${url}`);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const parts = url.split('/');
        a.download = decodeURIComponent(parts[parts.length - 1]) || 'documento.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error(err);
      }
    }

    // volta para página original (opcional, mas já deve estar na mesma)
    if (window.location.pathname + window.location.search !== currentPage) {
      window.history.replaceState(null, '', currentPage);
    }
  }
});


// Após login bem-sucedido, usar isso na página carregada:
const processPendingDownloads = async () => {
  const pending = localStorage.getItem('pendingDownloads');
  if (!pending) return;

  const urls: string[] = JSON.parse(pending);
  localStorage.removeItem('pendingDownloads');

  for (const url of urls) {
    try {
      const apiUrl = `/api/onedrive/download?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      if (!res.ok) continue;

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const parts = url.split('/');
      a.download = decodeURIComponent(parts[parts.length - 1]) || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Erro no download pós-login:", err);
    }
  }
};









const fetchDocumentos = async () => {
  try {
    // 1. Buscar nomes já salvos para esse funcionário
const { data: docsSalvos, error: errorSalvos } = await supabase
  .from('documentoscolaboradores')
  .select('id, nome_documento, valido')
  .eq('funcionario_id', id);

    if (errorSalvos) throw errorSalvos;

   const nomesJaSalvos = docsSalvos
  .filter(doc => doc.valido) // Apenas se valido for true
  .map(doc => doc.nome_documento);

    // 2. Buscar todos os personalizados e filtrar os que não estão salvos
    const { data: personalizados, error: errorPersonalizados } = await supabase
      .from('documentos_personalizados')
      .select('nome_documento, categoria, atualizado_por'); // Incluindo categoria na busca

    if (errorPersonalizados) throw errorPersonalizados;

    const documentosFiltrados = personalizados.filter(doc => 
      !nomesJaSalvos.includes(doc.nome_documento)
    );

   setDocumentospersonalizados(documentosFiltrados.map(doc => ({
  nome: doc.nome_documento,
  categoria: doc.categoria,
  atualizado_por: doc.atualizado_por
})));
  } catch (err) {
    console.error('Erro ao buscar documentos personalizados filtrados:', err);
  }
};


const handleAbrirModal = (docInfo: Documento | undefined) => {
  if (!docInfo) return;
  setDocSelecionado(docInfo);
  setMostrarModal(true);
};


const renderDocumentos = (categoria: string, listaObrigatorios: string[]) => {
  const docsAdicionais = documentos.filter(
    (d) => d.tipo_documento === categoria && d.valido
  );

  const mapaAdicionais = new Map<string, Documento>();
  docsAdicionais.forEach((doc) => {
    mapaAdicionais.set(doc.nome_documento, doc);
  });

  const nomesObrigatorios = new Set(listaObrigatorios);

  const todosNomes = [
    ...listaObrigatorios,
    ...docsAdicionais
      .map((d) => d.nome_documento)
      .filter((nome) => !nomesObrigatorios.has(nome)),
  ];

  return (
    <div className="p-6 bg-white mb-5">
      <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-2 mt-10">
        Documentos de {categoria}
      </h3>
      <table className="w-full table-auto text-sm text-gray-700 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600 border-b border-gray-300">
            {modoSelecao && (
            <th className="py-2 px-0 text-center">Selecionar</th>
)}
            <th className="py-2 px-4">Nome do documento</th>
            <th className="py-2 px-4 text-center">Disponível</th>
            <th className="py-2 px-4 text-center">Ver no mural</th>
            <th className="py-2 px-4 text-center">Postado por</th>
            <th className="py-2 px-4 text-center">Vencimento</th>
            <th className="py-2 px-4 text-center">Comentário</th>
            <th className="py-2 px-4 text-center">Ações</th>

          </tr>
        </thead>
        <tbody>
          {todosNomes.map((nome) => {
            const docInfo = mapaAdicionais.get(nome);
            
            const disponivel = docInfo ? "Sim" : "Não";
             const idDocumento = docInfo?.id; // Pega o ID do documento se existir
              const isSelecionado = idDocumento && selectedDocs.has(idDocumento); // 💡
            return (
                 <tr
      key={nome}
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        isSelecionado ? "bg-blue-200" : ""
      }`}
    >
                {modoSelecao && (
  <td className="py-2 px-4 text-center">
    {disponivel === "Sim" && idDocumento && (
      <input
        type="checkbox"
        checked={selectedDocs.has(idDocumento)}
        onChange={(e) =>
          handleCheckboxChange(idDocumento, e.target.checked, "documentacaogeral")
        }
      />
    )}
  </td>
)}
                <td className="py-2 px-4" onClick={() => handleAbrirModal(docInfo)}>{nome}</td>
                <td
                  className={`py-2 px-4 text-center font-semibold ${
                    disponivel === "Sim"
                      ? "text-green-700 bg-green-100 rounded"
                      : "text-red-700 bg-red-100 rounded"
                  }`}
                >
                  {disponivel}
                </td>
                <td className="py-2 px-4 text-center">
                  {docInfo?.Visualizar_menu != null
                    ? docInfo.Visualizar_menu
                      ? "Sim"
                      : "Não"
                    : "-"}
                </td>
                <td className="py-2 px-4 text-center">{docInfo?.atualizado_por ?? "-"}</td>
                <td className="py-2 px-4 text-center">{docInfo?.vencimento ?? "-"}</td>
                <td className="py-2 px-4 text-center">{docInfo?.comentario ?? "-"}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-center transition-all"
                    onClick={() => {
                      if (docInfo) {
                        setDocSelecionado(docInfo);
                      } else {
                        setDocSelecionado({
                          nome_documento: nome,
                          categoria: categoria,
                          
                        });
                      }
                      setMostrarModal(true);
                    }}
                  >
                    {docInfo ? "Substituir" : "Inserir"}
                  </button>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const handleSalvarInserirSubstituir = async () => {
  console.log("🚀 Iniciando handleSalvarInserirSubstituir...");
  if (!arquivoinserirsubstituir) {
    alert("Selecione um arquivo antes de continuar.");
    return;
  }

  if (!funcionario) {
    alert("Dados do funcionário não carregados.");
    return;
  }

  try {
    console.log("Arquivo:", arquivoinserirsubstituir);
    console.log("Vencimento:", vencimentoinserirsubstituir);

    const dataAtual = new Date();
    const dataFormatada = `${dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-')}_${dataAtual.toLocaleTimeString('pt-BR')}`;
    const nomeArquivo = `${docSelecionado?.nome_documento} - ${funcionario.abreviatura} - ${dataFormatada}`;
    const nomeArquivoLimpo = limparString(nomeArquivo);
    const nomePasta = limparString(`${funcionario.cpf}-${funcionario.nome_completo}`);
    const categoria = docSelecionado?.categoria || activeTabLocal; // pega a categoria do documento ou da aba
    const caminhoUpload = `Documentos de ${categoria}`;

    // 🔥 Upload via API OneDrive
    console.log("🌐 Preparando FormData para upload via API OneDrive...");
    const formPayload = new FormData();
    formPayload.append("file", arquivoinserirsubstituir);
    formPayload.append("fileName", nomeArquivoLimpo);
    formPayload.append("dataCompra", new Date().toISOString().slice(0, 10));
    formPayload.append("fornecedor", funcionario.nome_completo);
    formPayload.append("tipo", "funcionarios");
    formPayload.append("caminho", caminhoUpload);

    console.log("📦 Enviando requisição para /api/onedrive/upload...");
    const res = await fetch("/api/onedrive/upload", {
      method: "POST",
      body: formPayload,
    });

    const json = await res.json();
    console.log("📦 JSON retornado do OneDrive:", json);

    if (!json?.success || !json.file?.url) {
      console.error("❌ Erro no upload da foto via API:", json);
      alert("Erro ao enviar o arquivo para o OneDrive.");
      return;
    }

    const arquivoUrl = json.file.url;
    console.log("✅ Upload concluído! URL do arquivo:", arquivoUrl);

    if (docSelecionado && docSelecionado.id) {
      console.log("🧠 Atualizando documento existente...");
      const dadosAtualizacao = {
        nome_arquivo: arquivoUrl,        
        atualizado_por: nome,
        ultima_atualizacao: new Date().toISOString(),
        vencimento: vencimentoinserirsubstituir || null,
      };

      const { data, error: updateError } = await supabase
        .from("documentoscolaboradores")
        .update(dadosAtualizacao)
        .eq("id", docSelecionado.id)
        .select();

      console.log("📊 Resultado do update:", { data, updateError });
      if (updateError) {
        console.error("❌ Erro ao atualizar documento:", updateError);
        alert("Erro ao substituir o documento.");
        return;
      }

      alert("Documento substituído com sucesso!");
    } else {
      console.log("📥 Inserindo novo documento...");
      const dadosDocumento = {
        funcionario_id: funcionario.id,
        nome_colaborador: funcionario.nome_completo,
        tipo_documento: docSelecionado?.categoria,
        nome_documento: docSelecionado?.nome_documento,
        vencimento: vencimentoinserirsubstituir || null,
        comentario: "",
        postado_por: nome,
        created_at: new Date().toISOString(),
        valido: true,
        Visualizar_menu: true,
        nome_arquivo: arquivoUrl,
        atualizado_por: nome,
        ultima_atualizacao: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from("documentoscolaboradores")
        .insert([dadosDocumento])
        .select();

      console.log("📊 Resultado da inserção:", { data, insertError });
      if (insertError) {
        console.error("❌ Erro ao salvar novo documento:", insertError);
        alert("Erro ao salvar o documento.");
        return;
      }

      alert("Documento salvo com sucesso!");
    }

    // Resetar estado
    setMostrarModal(false);
    setVencimentoInserirSubstituir("");
    setArquivoInserirSubstituir(null);

  } catch (err) {
    console.error("💥 Erro inesperado:", err);
    alert("Ocorreu um erro inesperado.");
  }
};






  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivoInserirSubstituir(e.target.files[0]);
    }
  };


    const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivoComprovante(e.target.files[0]);
    }
  };


  // Renderização condicional do conteúdo abaixo da barra de botões
  function renderContent() {
    switch (activeTabLocal) {
      case "documentacao":
        return (
          <>
          
<div className="flex justify-start mb-4">
  <button
    onClick={() => {
      if (modoSelecao && selectedDocs.size > 0) {
        handleDownloadSelectedDocs();
      } else {
        setModoSelecao((prev) => !prev);
      }
    }}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-md border transition-colors duration-300
      focus:outline-none focus:ring-2 focus:ring-gray-300
      ${
        modoSelecao
          ? selectedDocs.size > 0
            ? "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"
            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }
      cursor-pointer
    `}
  >
    {modoSelecao ? (
      selectedDocs.size > 0 ? (
        <>
          <Download size={16} className="stroke-gray-600" />
          <span className="text-sm font-medium">Baixar Selecionados</span>
        </>
      ) : (
        <>
          <X size={16} className="stroke-gray-400" />
          <span className="text-sm font-medium">Cancelar Seleção</span>
        </>
      )
    ) : (
      <>
        <Check size={16} className="stroke-gray-600" />
        <span className="text-sm font-medium">Selecionar</span>
      </>
    )}
  </button>
</div>
            {renderDocumentos('Contratação', DOCUMENTOS_OBRIGATORIOS.contratacao(funcionario?.tipo_regime || "CLT"))}
            {renderDocumentos('Identificação', DOCUMENTOS_OBRIGATORIOS.identificacao)}
            {renderDocumentos('Competência', DOCUMENTOS_OBRIGATORIOS.competencia)}
                  {/* Nova categoria RH */}
            {renderDocumentos('RH', [])} {/* Nenhum documento obrigatório */}
            {renderDocumentos('Segurança', DOCUMENTOS_OBRIGATORIOS.seguranca)}

             {/* Botão */}
      <div className="mt-10 flex justify-start px-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2 mb-20 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white text-sm font-semibold rounded-full shadow-md transition-all"
        >
          <PlusCircle size={18} />
          Adicionar Documento Avulso
        </button>
      </div>
          </>
        );
      case "contracheques":
  return (
    <>
    <div className="flex justify-start mb-4">
  <button
    onClick={() => {
      if (modoSelecao && selectedDocs.size > 0) {
        handleDownloadSelectedDocs();
      } else {
        setModoSelecao((prev) => !prev);
      }
    }}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-md border transition-colors duration-300
      focus:outline-none focus:ring-2 focus:ring-gray-300
      ${
        modoSelecao
          ? selectedDocs.size > 0
            ? "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"
            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }
      cursor-pointer
    `}
  >
    {modoSelecao ? (
      selectedDocs.size > 0 ? (
        <>
          <Download size={16} className="stroke-gray-600" />
          <span className="text-sm font-medium">Baixar Selecionados</span>
        </>
      ) : (
        <>
          <X size={16} className="stroke-gray-400" />
          <span className="text-sm font-medium">Cancelar Seleção</span>
        </>
      )
    ) : (
      <>
        <Check size={16} className="stroke-gray-600" />
        <span className="text-sm font-medium">Selecionar</span>
      </>
    )}
  </button>
</div>
      <div className="flex justify-start mb-4">
        {/* Você pode adicionar aqui a lógica de Seleção se quiser */}
      </div>
      {renderContracheques()}
      {renderDemaisComprovantes()}

       {/* Botão */}
      <div className="mt-10 flex justify-start px-4">
<button
  onClick={() => {
    setMostrarModalComprovantes(true);
    setNomeDocumentoDesabilitado(false); // desativa o campo
    setupdateOrNot(false)
  }}
  className="flex items-center gap-2 px-5 py-2 mb-20 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white text-sm font-semibold rounded-full shadow-md transition-all"
>
  <PlusCircle size={18} />
  Adicionar Comprovantes
</button>
      </div>
    </>
  );
      case "informacoes":
        return <p>Conteúdo de informações completas ainda será criado...</p>;
      case "treinamentos":
        return <p>Conteúdo de treinamentos ainda será criado...</p>;
      default:
        return null;
    }
  }

const [anosAbertos, setAnosAbertos] = useState<Record<string, boolean>>({});
const toggleAno = (ano: string) => {
  setAnosAbertos(prev => ({ ...prev, [ano]: !prev[ano] }));
};


const mesesMap: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};



// --- logo acima do componente ou no início dele
interface Contracheques {
  id: string;
  funcionario_id: string;
  nome_documento: string;
  mes_referencia: string;      // AAAA-MM
  valido: boolean;
  nome_arquivo: string;
  referente_a:string
}

const [contracheques, setContracheques] = useState<Contracheques[]>([]);

// Busca sempre que mudar o funcionário
// Busca sempre que mudar o funcionário
useEffect(() => {
  if (!funcionario?.id) return;

  (async () => {
    const { data, error } = await supabase
      .from("comprovantesfuncionarios")
      .select("id, funcionario_id, nome_documento, mes_referencia, valido, nome_arquivo, referente_a")
      .eq("funcionario_id", funcionario.id);

    if (error) {
      console.error("Erro ao buscar comprovantes:", error.message);
      return;
    }

    console.log("📄 Comprovantes recebidos do Supabase:", data);
    setContracheques(data ?? []);
  })();
}, [funcionario?.id]);


const renderContracheques = () => {
  if (!funcionario?.data_admissao) return null;

  const admissao = new Date(funcionario.data_admissao);
  const hoje = new Date();
  const dadosPorAno: Record<string, string[]> = {};

  // --- gera meses desde a admissão ---
  let cursor = new Date(admissao.getFullYear(), admissao.getMonth(), 1);

  while (cursor <= hoje) {
    const mesRef = new Date(cursor);
    const dataExibicao = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 5);

    if (hoje >= dataExibicao) {
      const nomeMes = mesRef.toLocaleString("pt-BR", { month: "long", year: "numeric" });
      const ano = mesRef.getFullYear().toString();

      if (!dadosPorAno[ano]) dadosPorAno[ano] = [];
      dadosPorAno[ano].push(capitalize(nomeMes));   // ex.: “Março de 2025”
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // --- renderização ---
  return (
    <div className="p-6 bg-white mb-5">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2 mt-10">
        Contracheques e Folhas de Ponto
      </h3>

      {Object.entries(dadosPorAno)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))        // ano mais recente primeiro
        .map(([ano, meses]) => (
          <div key={ano} className="mb-4">
            {/* botão para abrir/fechar o ano */}
            <button className="w-full text-left font-bold text-lg text-blue-800 mb-1 hover:underline"
                    onClick={() => toggleAno(ano)}>
              {anosAbertos[ano] ? "▼" : "▶"} {ano}
            </button>

            {/* tabela somente se o ano estiver expandido */}
            {anosAbertos[ano] && (
              <table className="w-full table-auto text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 border-b border-gray-300">
                    {modoSelecao && <th className="py-2 px-4 w-30 text-center">Selecionar</th>}
                    <th className="py-2 px-4">Mês</th>
                    <th className="py-2 px-4">Tipo</th>
                    <th className="py-2 px-4 text-center">Disponível</th>
                    <th className="py-2 px-4 text-center">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {meses.flatMap((mesPtBr) => {
                    const tipos = ["Contracheque", "Folha de Ponto"];

                    return tipos.map((tipo) => {
                      /* converte “Março de 2025” → “2025-03” */
                      const [mesNome, anoRef] = mesPtBr.toLowerCase().split(" de ");
                      const mesNumero = mesesMap[mesNome];
                      const mesReferencia = `${anoRef}-${String(mesNumero).padStart(2, "0")}`;

                      /* procura na lista trazida do Supabase */
const doc = contracheques.find((c) => {
  const tipoAtual = tipo;
  
  // Extrai e limpa o nome do documento vindo do banco
  const nomeDoc = c.nome_documento?.trim();

  // Constrói a referência do mês no formato AAAA-MM
  const mesRef = c.mes_referencia;

  // Faz o log para você entender o que está sendo comparado
  console.log("Comparando:", {
    nomeDoc,
    tipoAtual,
    mesRef,
    esperadoMesRef: mesReferencia,
    valido: c.valido,
  });

  return (
    nomeDoc === tipoAtual &&
    mesRef === mesReferencia &&
    c.valido
  );
});

                      const disponivel = !!doc;
                      const idDocumento = doc?.id;
                      const isSelecionado = !!(idDocumento && selectedDocs.has(idDocumento));

                      return (
                        <tr key={`${mesReferencia}-${tipo}`}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              isSelecionado ? "bg-blue-200" : ""
                            }`}>

                          {modoSelecao && (
                            <td className="py-2 px-4 text-center">
                              {disponivel && idDocumento && (
                                <input
                                  type="checkbox"
                                  checked={isSelecionado}
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      idDocumento,
                                      e.target.checked,
                                      tipo === "Contracheque" ? "contracheques" : "folhasdeponto"
                                    )
                                  }
                                />
                              )}
                            </td>
                          )}

                          <td className="py-2 px-4">{mesPtBr}</td>
                          <td className="py-2 px-4">{tipo}</td>

                          <td className={`py-2 px-4 text-center font-semibold ${
                              disponivel ? "text-green-700 bg-green-100 rounded"
                                         : "text-red-700 bg-red-100 rounded"
                            }`}>
                            {disponivel ? "Sim" : "Não"}
                          </td>

                          <td className="py-2 px-4 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-all"
                              onClick={() => {
                                setDocSelecionado(
                                  doc || { nome_documento: mesPtBr, categoria: tipo }
                                );
                                if (doc) {
                                setNomeDocumentoComprovantes(tipo || "");
                                setMesReferencia(doc?.mes_referencia || "");                                                                
                                setReferenteA(doc?.referente_a || "");
                                setIDDocumento(doc?.id || "");
                                setNomeArquivo(doc?.nome_arquivo || "");
                                console.log("doc.mes_referencia:", doc?.mes_referencia);
                                setupdateOrNot(true)
                              } else {
                                setNomeDocumentoComprovantes(tipo);
                                
                              if (tipo === "Contracheque") {
                                  setReferenteA("Pagamento mensal da remuneração do colaborador");
                                }
                                if (tipo === "Folha de Ponto") {
                                  setReferenteA("Comprovante de comparecimento e assiduidade do colaborador");
                                };


                                setMesReferencia(mesReferencia);
                                setupdateOrNot(false)
                              }
                                  // Desabilitar o campo se for abrir como "substituir"
                                setNomeDocumentoDesabilitado(true);


                                
                                setMostrarModalComprovantes(true);
                              }}>
                              {disponivel ? "Substituir" : "Inserir"}
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </div>
  );
};




const renderDemaisComprovantes = () => {
  if (!comprovantesFunc?.length) return null;

const tiposExcluidos = ["Contracheque", "Folha de Ponto"];
const demaisDocs = comprovantesFunc.filter(
  (doc) => !tiposExcluidos.includes(doc.nome_documento)
);

  if (demaisDocs.length === 0) return null;



  return (
    <div className="p-6 bg-white mb-5">
      <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-2 mt-10">
        Demais Comprovantes
      </h3>
      <table className="w-full table-auto text-sm text-gray-700 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600 border-b border-gray-300">
            {modoSelecao && (
              <th className="py-2 px-0 text-center">Selecionar</th>
            )}
            <th className="py-2 px-4">Nome do Documento</th>
            <th className="py-2 px-4">Mês de Referência</th>
            <th className="py-2 px-4 text-center">Disponível</th>
            <th className="py-2 px-4">Referente a</th>
            <th className="py-2 px-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {demaisDocs.map((doc) => {
            const isSelecionado = selectedDocs.has(doc.id);

            return (
              <tr
                key={doc.id}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  isSelecionado ? "bg-blue-200" : ""
                }`}
              >
                {modoSelecao && (
                  <td className="py-2 px-4 text-center">
                    {doc.valido && (
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={(e) =>
                          handleCheckboxChange(doc.id, e.target.checked, "demaisComprovantes")
                        }
                      />
                    )}
                  </td>
                )}
                <td className="py-2 px-4">{doc.nome_documento}</td>
                <td className="py-2 px-4">
                  {doc.mes_referencia ? capitalize(doc.mes_referencia) : "-"}
                </td>
                <td
                  className={`py-2 px-4 text-center font-semibold ${
                    doc.valido
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100"
                  } rounded`}
                >
                  {doc.valido ? "Sim" : "Não"}
                </td>
                <td className="py-2 px-4">{doc.referente_a || "-"}</td>
                <td className="py-2 px-4 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-all"
                              onClick={() => {
                                setDocSelecionado(doc);
                                if (doc) {
                                setNomeDocumentoComprovantes(doc.nome_documento || "");
                                setMesReferencia(doc?.mes_referencia || "");
                                setReferenteA(doc?.referente_a || "");
                                setIDDocumento(doc?.id || "");
                                setNomeArquivo(doc?.nome_arquivo || "");
                                console.log("doc.mes_referencia:", doc?.mes_referencia);
                              } else {
                                setNomeDocumentoComprovantes("");
                                setMesReferencia(mesReferencia);
                              }
                                  // Desabilitar o campo se for abrir como "substituir"
                                setNomeDocumentoDesabilitado(true);
                                setupdateOrNot(true)
                                setMostrarModalComprovantes(true);
                              }}>
                              {"Substituir"}
                            </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


const carregarComprovantesFuncionario = async (funcionarioId: string) => {
  try {
    const { data, error } = await supabase
      .from("comprovantesfuncionarios")
      .select("*")
      .eq("funcionario_id" , funcionarioId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao buscar comprovantes:", error.message);
      return [];
    }

    if (!data) {
      console.warn("Nenhum dado retornado pela consulta.");
      return [];
    }

    return data;
  } catch (err) {
    console.error("Erro inesperado ao buscar comprovantes:", err);
    return [];
  }
};


const [comprovantesFunc, setComprovantesFunc] = useState<ComprovanteFuncionario[]>([]);



useEffect(() => {
  console.log("useEffect disparado, funcionario.id:", funcionario?.id);
  if (!funcionario?.id) return;

  const carregar = async () => {
    console.log("carregando comprovantes para funcionário:", funcionario.id);
    const docs = await carregarComprovantesFuncionario(funcionario.id);
    console.log("comprovantes carregados:", docs);
    setComprovantesFunc(docs);
  };

  carregar();
}, [funcionario?.id]);




function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}



const handleSalvarComprovantes = async () => {
  if (!arquivocomprovantes || !funcionario?.id) {
    alert("Selecione um arquivo e certifique-se que o funcionário está definido.");
    return;
  }

  const modoSalvamento = updateOrNot ? "update" : "novo"; 
  console.log("Modo de salvamento:", modoSalvamento);

  try {
    const dataAtual = new Date();
    const dataFormatada = `${dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-')}_${dataAtual.toLocaleTimeString('pt-BR')}`;
    const nomeArquivo = `${nomeDocumentoComprovantes} - ${funcionario.abreviatura} - ${dataFormatada}`;
    const nomeArquivoLimpo = limparString(nomeArquivo);
    const nomePasta = limparString(`${funcionario.cpf}-${funcionario.nome_completo}`);

    // Caminho completo no formato "Documentação de &categoria"
    const caminhoUpload = `Documentação de Comprovantes/${nomePasta}/${nomeArquivoLimpo}`;
    console.log("📂 Caminho para upload via API:", caminhoUpload);

    // ✅ UPLOAD VIA API
    const formPayload = new FormData();
    formPayload.append("file", arquivocomprovantes);
    formPayload.append("fileName", nomeArquivoLimpo);
    formPayload.append("caminho", "Contracheques e Folhas de Ponto");
    formPayload.append("fornecedor", funcionario.nome_completo || "Funcionário");
    formPayload.append("tipo", "funcionarios");
    formPayload.append("dataCompra", new Date().toISOString().slice(0, 10));

    const res = await fetch("/api/onedrive/upload", {
      method: "POST",
      body: formPayload,
    });

    const json = await res.json();
    if (!json?.success || !json.file?.url) {
      console.error("❌ Erro no upload da API:", json);
      alert("Erro ao enviar o arquivo.");
      return;
    }

    const novaUrl = json.file.url;
    console.log("✅ Upload realizado com sucesso! URL:", novaUrl);

    // Inserção ou atualização no banco
    if (modoSalvamento === "novo") {
      const { error: insertError } = await supabase
        .from("comprovantesfuncionarios")
        .insert([{
          funcionario_id: funcionario.id,
          nome_documento: nomeDocumentoComprovantes,
          mes_referencia: mesReferencia,
          referente_a: referenteA,
          nome_arquivo: novaUrl,          
        }]);

      if (insertError) {
        console.error("Erro ao salvar no banco:", insertError.message);
        alert("Erro ao salvar informações no banco.");
        return;
      }
    } else if (modoSalvamento === "update") {
      const { error: updateError } = await supabase
        .from("comprovantesfuncionarios")
        .update({
          nome_documento: nomeDocumentoComprovantes,
          mes_referencia: mesReferencia,
          referente_a: referenteA,
          nome_arquivo: novaUrl,
         
        })
        .eq("id", idComprovanteSelecionado);

      if (updateError) {
        console.error("Erro ao atualizar no banco:", updateError.message);
        alert("Erro ao atualizar o banco de dados.");
        return;
      }
    }

    // Finalização
    setIDDocumento("");
    setNomeArquivo("");
    setNomeDocumentoComprovantes("");
    setMesReferencia("");
    setReferenteA("");
    setArquivo(null);
    setMostrarModalComprovantes(false);
    alert("Comprovante salvo com sucesso!");

    const novos = await carregarComprovantesFuncionario(funcionario.id);
    setComprovantesFunc(novos);

  } catch (err) {
    console.error("Erro inesperado:", err);
    alert("Erro inesperado ao salvar o comprovante.");
  }
};







const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('🚀 Iniciando handleUpload...');
  setUploading(true);

  try {
    const file = event.target.files?.[0];
    console.log('📁 Arquivo selecionado:', file?.name);

    if (!file) {
      console.warn('⚠️ Nenhum arquivo foi selecionado.');
      alert('Nenhum arquivo selecionado.');
      setUploading(false);
      return;
    }

    if (!funcionario) {
      console.warn('⚠️ Funcionário não definido:', funcionario);
      alert('Funcionário não encontrado.');
      setUploading(false);
      return;
    }

    console.log('🆔 ID do funcionário antes do upload:', funcionario.id);
    if (!funcionario.id || typeof funcionario.id !== 'string') {
      alert('ID do funcionário não está definido ou não é UUID válido!');
      setUploading(false);
      return;
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `foto_funcionario_${timestamp}.${fileExtension}`;
    console.log('🧩 Nome do arquivo gerado:', fileName);

    // 🔥 Upload via rota API (OneDrive)
    console.log('🌐 Preparando FormData para envio...');
    const formPayload = new FormData();
    formPayload.append('file', file);
    formPayload.append('fileName', fileName);
    formPayload.append('dataCompra', new Date().toISOString().slice(0, 10));
    formPayload.append('fornecedor', funcionario.nome_completo || 'Funcionário');
    formPayload.append('tipo', 'funcionarios');
    formPayload.append('caminho', 'Documentos de Identificação');

    console.log('📦 Enviando requisição para /api/onedrive/upload...');
    const res = await fetch('/api/onedrive/upload', {
      method: 'POST',
      body: formPayload,
    });

    console.log('📬 Resposta recebida da API:', res.status, res.statusText);
    const json = await res.json();
    console.log('📦 JSON retornado:', json);

    if (!json?.success || !json.file?.url) {
      console.error('❌ Erro no upload da foto via API:', json);
      alert('Erro ao fazer upload da imagem. Verifique e tente novamente.');
      setUploading(false);
      return;
    }

    const novaUrl = json.file.url;
    console.log('✅ Upload bem-sucedido! URL recebida:', novaUrl);
    setFotoUrl(novaUrl);

    console.log('🔍 Testando se o registro do funcionário existe antes do update...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', funcionario.id);

    console.log('📊 Resultado do fetch:', { fetchData, fetchError });
    if (fetchError || !fetchData || fetchData.length === 0) {
      console.error('❌ Funcionário não encontrado no banco com este ID.');
      alert('Funcionário não encontrado no banco com este ID.');
      setUploading(false);
      return;
    }

    console.log('🧠 Atualizando URL da foto no Supabase...');
    const { data: updateData, error: updateError } = await supabase
      .from('funcionarios')
      .update({ foto: novaUrl })
      .eq('id', funcionario.id)
      .select();

    console.log('📊 Resultado da atualização no Supabase:', { updateData, updateError });

    if (updateError) {
      console.error('❌ Erro ao atualizar URL da foto no Supabase:', updateError);
      alert('Foto enviada, mas houve erro ao atualizar no banco.');
      setUploading(false);
      return;
    }

    console.log('🎉 Foto atualizada com sucesso no banco!');
    alert('Foto atualizada com sucesso!');
  } catch (error) {
    console.error('💥 Erro inesperado ao enviar a foto via API:', error);
    alert('Erro inesperado no upload da foto.');
  } finally {
    console.log('🏁 Finalizando handleUpload...');
    setUploading(false);
  }
};




  function limparString(str: string): string {
  return str
    .normalize("NFD")                     // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")     // Remove diacríticos
    .replace(/[^a-zA-Z0-9-_\/\.]/g, "_") // Substitui espaços e especiais por "_"
}

  useEffect(() => {
    fetchDocumentos(); // Chama a função quando o componente é carregado
  }, []);


useEffect(() => {
  const fetchDocumentosadicionais = async () => {
    const { data, error } = await supabase
  .from('documentoscolaboradores')
  .select('*')
  .eq('funcionario_id', id)
  .eq('valido', true);

    if (error) {
      console.error('Erro ao buscar documentos:', error);
    } else {
      setDocumentos(data);
    }
  };

  fetchDocumentosadicionais();
}, [id]);



  useEffect(() => {
    async function fetchDados() {
      const { data: func, error: funcError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', id)
        .single();

      if (funcError) {
        console.error("Erro ao buscar funcionario:", funcError);
        return;
      }

if (func?.foto) {
  // Verifica se o valor é uma URL completa (por exemplo, do OneDrive)
  const isExternalUrl = /^https?:\/\//i.test(func.foto);

  if (isExternalUrl) {
    // É uma URL externa, usa direto
    func.fotoUrl = func.foto;
  } else {
    // É um arquivo no Supabase Storage, precisa gerar URL assinada
    const { data, error } = await supabase.storage
      .from('fotofuncionarios')
      .createSignedUrl(func.foto, 60);

    if (data?.signedUrl) {
      func.fotoUrl = data.signedUrl;
    } else {
      console.error("Erro ao gerar URL da foto:", error);
    }
  }
}



      const { data: docs, error: docsError } = await supabase
        .from('documentoscolaboradores')
        .select('*')
        .eq('funcionario_id', id);

      if (docsError) {
        console.error("Erro ao buscar documentos:", docsError);
        return;
      }

      setFuncionario(func);
      setFotoUrl(func?.fotoUrl || '');
      setDocumentos(docs || []);
    }

    fetchDados();
  }, [id]);



const handleSalvarDocumento = async () => {
  try {
    if (!funcionario) {
      alert("Dados do funcionário não carregados.");
      return;
    }

    // VALIDAÇÕES INICIAIS
    if (!documentoSelecionado && !nomePersonalizado.trim()) {
      alert("Você deve selecionar um documento ou digitar um nome personalizado.");
      return;
    }

    if (documentoSelecionado && nomePersonalizado.trim()) {
      alert("Escolha apenas um: documento da lista OU nome personalizado.");
      return;
    }

    if (!categoriaSelecionada) {
      alert("Você deve selecionar uma categoria.");
      return;
    }

    if (!arquivo) {
      alert("Você deve anexar um documento.");
      return;
    }

    if (Array.isArray(arquivo)) {
      alert("Você deve anexar apenas um documento.");
      return;
    }

    // DADOS PARA INSERÇÃO
    const nomeDocumento = documentoSelecionado || nomePersonalizado.trim();
    const dataAtual = new Date();
    const dataFormatada = `${dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-')}_${dataAtual.toLocaleTimeString('pt-BR')}`;
    const nomeArquivo = `${nomeDocumento} - ${funcionario.abreviatura} - ${dataFormatada}`;
    const nomeArquivoLimpo = limparString(nomeArquivo);
    const nomePasta = limparString(`${funcionario.cpf}-${funcionario.nome_completo}`);

    // ✅ Caminho padrão via API
    const caminhoUpload = `Documentos de ${categoriaSelecionada}`;
    console.log("📂 Caminho para upload:", caminhoUpload);

    // UPLOAD VIA API
    const formPayload = new FormData();
    formPayload.append("file", arquivo);
    formPayload.append("fileName", nomeArquivoLimpo);
    formPayload.append("caminho", caminhoUpload);
    formPayload.append("fornecedor", funcionario.nome_completo || "Funcionário");
    formPayload.append("tipo", "funcionarios");
    formPayload.append("dataCompra", new Date().toISOString().slice(0, 10));


    const res = await fetch("/api/onedrive/upload", {
      method: "POST",
      body: formPayload,
    });

    const json = await res.json();
    if (!json?.success || !json.file?.url) {
      console.error("❌ Erro no upload da API:", json);
      alert("Erro ao enviar o arquivo.");
      return;
    }

    const novaUrl = json.file.url;
    console.log("✅ Upload realizado com sucesso! URL:", novaUrl);

    // INSERIR NO BANCO
    const { error: insertError } = await supabase
      .from('documentoscolaboradores')
      .insert([
        {
          funcionario_id: id,
          nome_colaborador: funcionario.nome_completo,
          tipo_documento: categoriaSelecionada,
          nome_documento: nomeDocumento,
          vencimento: vencimento || null,
          comentario: null,
          postado_por: nome,
          created_at: dataAtual.toISOString(),
          valido: true,
          Visualizar_menu: true,
          nome_arquivo: novaUrl,
          atualizado_por: nome,
         
        },
      ]);

    if (insertError) throw insertError;

    // LÓGICA DE DOCUMENTO PERSONALIZADO (sem alterações)
    const DOCUMENTOS_OBRIGATORIOS = {
      contratacao: (tipoRegime:string) => {
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
        "Certidao de Nascimento",
      ],
      competencia: ["Diploma", "Certificado de Curso"],
      seguranca: ["Treinamento de Seguranca"],
    };

    const ehDocumentoNovo = !documentoSelecionado && nomePersonalizado.trim();
    if (ehDocumentoNovo) {
      const obrigatorios = [
        ...DOCUMENTOS_OBRIGATORIOS.identificacao,
        ...DOCUMENTOS_OBRIGATORIOS.competencia,
        ...DOCUMENTOS_OBRIGATORIOS.seguranca,
        ...DOCUMENTOS_OBRIGATORIOS.contratacao(funcionario.tipo_regime),
      ];

      const { data: docsExistentes, error: fetchError } = await supabase
        .from('documentos_personalizados')
        .select('nome_documento');

      if (!fetchError && docsExistentes) {
        const documentosExistentes = docsExistentes.map(doc => doc.nome_documento);
        const jaExiste = documentosExistentes.includes(nomePersonalizado.trim());
        const ehObrigatorio = obrigatorios.includes(nomePersonalizado.trim());

        if (!jaExiste && !ehObrigatorio) {
          const { error: insertPersonalizadoError } = await supabase
            .from('documentos_personalizados')
            .insert([{
              nome_documento: nomePersonalizado.trim(),
              categoria: categoriaSelecionada,
              criado_por: user.id,
              data_criacao: new Date().toISOString(),
              atualizado_por: user.id,
              ultima_atualizacao: new Date().toISOString(),
            }]);

          if (insertPersonalizadoError) {
            console.error("Erro ao inserir documento personalizado:", insertPersonalizadoError);
          } else {
            console.log("Documento personalizado salvo com sucesso.");
          }
        }
      } else {
        console.error("Erro ao buscar documentos personalizados:", fetchError);
      }
    }

    alert('Documento salvo com sucesso!');
    setShowModal(false);
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar o documento');
  }
};




  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(tab);
    router.push(`/dashboard/${tab}`);
  };



  if (!funcionario) return <p>Carregando...</p>;

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-sm" : ""}`}>
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button onClick={() => window.history.back()} className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <span className="text-sm">
              Visao Geral do colaborador:&nbsp;&nbsp;&nbsp;
              <strong>{funcionario?.nome_completo}</strong>
            </span>
          </div>
        </div>
        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black" />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>
        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex flex-1">
         <Sidebar onNavClickAction={handleNavClick} className="h-full" menuActive={menuActive} setMenuActive={setMenuActive} activeTab={activeTab} />

        <div className="p-6 w-full">
          <div className="flex gap-8 p-6 bg-white shadow-md b mt-6 w-full ">
            <div className="flex flex-col items-center w-1/3">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={`Foto de ${funcionario?.nome_completo}`}
                  className="w-[220px] h-[220px] object-cover rounded-lg border shadow"
                />
              ) : (
                <div className="w-[220px] h-[220px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 border">
                  Sem foto
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                hidden
              />
    <button
          className="mt-4 px-4 py-2 bg-[#5a0d0d] text-white rounded-full hover:bg-[#7a1a1a] transition-all duration-300 shadow-sm text-sm"
          onClick={() => {
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
}}
          disabled={uploading}
        >
          {uploading ? 'Enviando...' : funcionario?.fotoUrl ? 'Substituir Foto' : 'Adicionar Foto'}
        </button>
            </div>
{/* Informações do funcionário */}
<div className="flex-1 space-y-3 text-gray-800 w-2/3 ">
    <h2 className="text-xl font-semibold mb-2 border-b pb-1">Informações do Colaborador</h2>
    <p><span className="font-medium">Nome:</span> <strong>{funcionario.abreviatura}</strong></p>
    <p><span className="font-medium">Cargo:</span> {funcionario.cargo}</p>
    <p><span className="font-medium">Data de Admissão:</span>{' '}  {funcionario.data_admissao ? new Date(funcionario.data_admissao).toLocaleDateString('pt-BR') : '-'}</p>
    <p><span className="font-medium">Processo:</span> {funcionario.processo}</p>
    <p><span className="font-medium">Departamento:</span> {funcionario.departamento}</p>
    <p><span className="font-medium">Filial:</span> {funcionario.filial}</p>
    <p><span className="font-medium">Observações:</span> {funcionario.observacoes || '—'}</p>
  </div>



          </div>

          {/* Barra de botões horizontal (menu de abas) */}
          <div className="flex border-b border-gray-200 space-x-2 bg-gray-50 px-4 py-2 pb-2 pt-6 rounded-t-lg">
  {[
    { key: "documentacao", label: "Documentação Geral" },
    { key: "contracheques", label: "Contracheques e Folhas de Ponto" },    
    { key: "informacoes", label: "Informações Completas" },
    { key: "treinamentos", label: "Treinamentos" },
  ].map((tab) => (
    <button
      key={tab.key}
      onClick={() => setActiveTabLocal(tab.key)}
      className={`relative px-8 py-4 text-sm font-bold transition-all rounded-t-md
        ${
          activeTabLocal === tab.key
            ? "bg-white text-gray-900 shadow-sm border border-gray-300 border-b-transparent"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-2"
        }`}
    >
      {tab.label}
      {activeTabLocal === tab.key && (
        <div className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-indigo-500 transition-all" />
      )}
    </button>
  ))}
        </div>

          {/* Conteúdo dos documentos (renderizado conforme aba) */}
          <div className="bg-white shadow-md rounded-lg border border-gray-200 ">
            {renderContent()}
          </div>



{/* Modal */}
<AnimatePresence>
        {showModal && (
          <>
            {/* Overlay com blur */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div
                className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl relative z-50"
                onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  Adicionar Documento Avulso
                </h2>

                {/* Lista de documentos */}
                <div className="mb-4">
                   <label className="block text-sm font-medium mb-1">
        Selecione um Documento
      </label>
<select
  value={documentoSelecionado}
  onChange={(e) => {
    const value = e.target.value;
    setDocumentoSelecionado(value);

    const documento = documentospersonalizados.find(doc => doc.nome === value);
    if (documento) {
      setCategoriaSelecionada(documento.categoria);
    }

    if (value !== "") {
      setNomePersonalizado("");
    }
  }}
  disabled={nomePersonalizado !== ""}
  className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
>
  <option value="">-- Selecione --</option>
  {documentospersonalizados.map((doc, index) => (
    <option key={index} value={doc.nome}>
      {doc.nome}
    </option>
  ))}
</select>

                </div>

                {/* Nome personalizado */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Nome Personalizado
                  </label>
                 <input
  value={nomePersonalizado}
  onChange={(e) => {
    const value = e.target.value;
    setNomePersonalizado(value);
    if (value !== "") {
      setDocumentoSelecionado(""); // limpa o select
    }
  }}
  disabled={documentoSelecionado !== ""}
  type="text"
  placeholder="Digite o nome do documento"
  className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
/>
                </div>

                {/* Categoria */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Categoria do Documento
                  </label>
<select
  value={categoriaSelecionada}
  onChange={(e) => setCategoriaSelecionada(e.target.value)}
  disabled={documentoSelecionado !== ""} // Desabilita quando vem da lista
  className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
>
  <option value="">-- Selecione --</option>
  {categorias.map((categoria) => (
    <option key={categoria} value={categoria}>
      {categoria}
    </option>
  ))}
</select>
                </div>

                {/* Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Anexar Documento
                  </label>
                  <input  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  }}
                    type="file"
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
                  />
                </div>

                {/* Vencimento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    Data de Vencimento (opcional)
                  </label>
                  <input value={vencimento} onChange={(e) => setVencimento(e.target.value)}
                    type="date"
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
                  />
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button onClick={handleSalvarDocumento} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white">
                    Salvar Documento
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
</AnimatePresence>

<AnimatePresence>
  {mostrarModal && (
    <>
      {/* Overlay com blur e escurecimento */}
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setMostrarModal(false)}
      />

      {/* Modal principal */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div
          className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {docSelecionado && docSelecionado.id ? "Substituir Documento" : "Inserir Documento"}
          </h2>

          {/* Campo de vencimento */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Vencimento (opcional)</label>
            <input
              type="date"
              value={vencimentoinserirsubstituir}
              onChange={(e) => setVencimentoInserirSubstituir(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Selecionar Arquivo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Selecionar Arquivo</label>
            <input
              type="file"
              onChange={handleArquivoChange}
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setMostrarModal(false)}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarInserirSubstituir}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {docSelecionado && docSelecionado.id ?  "Substituir" : "Salvar"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

<AnimatePresence>
  {mostrarModalComprovantes && (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setMostrarModalComprovantes(false)}
      />

      {/* Modal principal */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div
          className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            {docSelecionado && docSelecionado.id
              ? "Substituir Documento"
              : "Inserir Documento"}
          </h2>

          {/* Nome do Documento */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nome do Documento</label>
            <input
              type="text"
              value={nomeDocumentoComprovantes}
              onChange={(e) => setNomeDocumentoComprovantes(e.target.value)}
               disabled={nomeDocumentoDesabilitado}
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Mês de Referência */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mês de Referência</label>
            <input
              type="month"
              value={mesReferencia}
              disabled={nomeDocumentoDesabilitado}
              onChange={(e) => setMesReferencia(e.target.value)}
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Referente a */}
{!nomeDocumentoDesabilitado && (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Referente a</label>
    <input
      type="text"
      value={referenteA}
      onChange={(e) => setReferenteA(e.target.value)}
      className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
    />
  </div>
)}

          {/* Arquivo */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Selecionar Arquivo</label>
            <input
              type="file"
              onChange={handleComprovanteChange}
              className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5a0d0d]"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setMostrarModalComprovantes(false)}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarComprovantes}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {docSelecionado && docSelecionado.id ? "Substituir" : "Salvar"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>


        </div>
      </div>
    </div>
  );
}
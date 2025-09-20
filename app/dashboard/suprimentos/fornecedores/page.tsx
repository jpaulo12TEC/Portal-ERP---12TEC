'use client';

import { supabase } from '@/lib/superbase';


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Users, Plus, Star } from "lucide-react";
import Sidebar from '@/components/Sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* Tipos */
type Fornecedor = {
  cnpj: string;
  nome: string;
  categoria: string;
  tipo: string;
  local: string;
  ultimaCompra: string;
  avaliacao: number;
  situacao?: "Iniciado" | "Completo";
};


interface FornecedorFormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipoFornecedor: string;
  naturezaJuridica: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidadeUF: string;
  cep: string;
  pais: string;
  telefonePrincipal: string;
  responsavelComercial: string;
  tipoProdutoServico: string;
  categoria: string;
  descricao: string;
  unidadeFornecimento: string;
  precoEstimado?: string;
  prazoEntrega?: string;
  email?: string;
  website?: string;
  responsavelTecnico?: string;
  responsavelTecnicocontato?: string;
  contato1Nome?: string;
  contato1Telefone?: string;
  contato2Nome?: string;
  contato2Telefone?: string;
  situacao?: string;
  avaliacao?: string | number;

  fichaCadastral?: File[];
  comprovantecapacidadetecnica?: File[];
  cartaoCnpj?: File[];
  certidaoNegativa?: File[];
  contratoSocial?: File[];
  alvara?: File[];
  outrosDocumentos?: File[];
  arquivosProdutos?: FileList | File[];
}





interface SupplierFormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricao: string;
  tipoFornecedor: string;
  naturezaJuridica: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidadeUF: string;
  cep: string;
  pais: string;
  telefonePrincipal: string;
  responsavelComercial: string;
  email: string;
  website: string;
  responsavelTecnico: string;
  responsavelTecnicocontato: string;
  contato1Nome: string;
  contato1Telefone: string;
  contato2Nome: string;
  contato2Telefone: string;
  tipoProdutoServico: string;
  categoria: string;
  descricao: string;
  unidadeFornecimento: string;
  precoEstimado: string;
  prazoEntrega: string;
  arquivosProdutos?: FileList | null;
  comprovantecapacidadetecnica?: FileList | null;
  fichaCadastral?: FileList | null;
  cartaoCnpj?: FileList | null;
  certidaoNegativa?: FileList | null;
  contratoSocial?: FileList | null;
  alvara?: FileList | null;
  outrosDocumentos?: FileList | null;
  ultimaCompra?: string;
  avaliacao?: number | string;
  situacao?: "Iniciado" | "Completo";
  [key: string]: any;
}

/* Componentes auxiliares simples (mantidos) */
const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white p-4 shadow-sm">
    <h4 className="text-sm font-medium text-[#333] mb-3">{title}</h4>
    <div>{children}</div>
  </section>
);

const Input: React.FC<{
  name: string;
  value?: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}> = ({ name, value = '', onChange, placeholder = '', type = 'text' }) => (
  <input
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    className="w-full border border-gray-200 rounded px-3 py-2"
  />
);

const Select: React.FC<{
  name: string;
  value?: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  options: string[];
}> = ({ name, value = '', onChange, label, options }) => (
  <select name={name} value={value} onChange={onChange} className="w-full border border-gray-200 rounded px-3 py-2">
    <option value="">{label ?? 'Selecione'}</option>
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

const FileUpload: React.FC<{
  label: string;
  name: string;
  onFilesChange: (files: FileList | null) => void;
  multiple?: boolean;
}> = ({ label, name, onFilesChange, multiple = false }) => (
  <label className="flex flex-col">
    <span className="text-sm mb-1">{label}</span>
    <input
      name={name}
      type="file"
      multiple={multiple}
      onChange={(e) => onFilesChange(e.target.files)}
      className="w-full"
    />
  </label>
);

/* Página principal */
export default function FornecedoresPage() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialForm: SupplierFormData = {
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricao: '',
    tipoFornecedor: '',
    naturezaJuridica: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidadeUF: '',
    cep: '',
    pais: '',
    telefonePrincipal: '',
    responsavelComercial: '',
    email: '',
    website: '',
    responsavelTecnico: '',
    responsavelTecnicocontato: '',
    contato1Nome: '',
    contato1Telefone: '',
    contato2Nome: '',
    contato2Telefone: '',
    tipoProdutoServico: '',
    categoria: '',
    descricao: '',
    unidadeFornecimento: '',
    precoEstimado: '',
    prazoEntrega: '',
    arquivosProdutos: null,
    comprovantecapacidadetecnica: null,
    fichaCadastral: null,
    cartaoCnpj: null,
    certidaoNegativa: null,
    contratoSocial: null,
    alvara: null,
    outrosDocumentos: null,
    ultimaCompra: '',
    avaliacao: 0,
    situacao: 'Iniciado'
  };

  const [formData, setFormData] = useState<SupplierFormData>(initialForm);
  // índice do fornecedor sendo editado (null = novo)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  function handleFileChange(name: string, files: FileList | null) {
    setFormData((p) => ({ ...p, [name]: files }));
  }

  function formatCnpjCpf(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      // CPF
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      // CNPJ
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
  }

  function handleChangecnpj(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const masked = formatCnpjCpf(raw);
    setFormData((p) => ({ ...p, cnpj: masked }));
  }

  const dashboardData = [
    { categoria: "TI", valor: 150000 },
    { categoria: "Construção", valor: 95000 },
    { categoria: "Serviços Gerais", valor: 70000 },
  ];

  // abrir modal para novo fornecedor
  function openNewModal() {
    setEditingIndex(null);
    setFormData(initialForm);
    setModalOpen(true);
  }

  // abrir modal para editar fornecedor existente
  function openEditModal(index: number) {
    const f = fornecedores[index];
    setEditingIndex(index);
    setFormData({
      ...initialForm,
      razaoSocial: f.nome,
      nomeFantasia: f.nome,
      cnpj: f.cnpj,
      categoria: f.categoria,
      tipoProdutoServico: f.tipo,
      cidadeUF: f.local,
      ultimaCompra: f.ultimaCompra,
      avaliacao: f.avaliacao,
      situacao: f.situacao ?? 'Iniciado'
    });
    setModalOpen(true);
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Usuário não autenticado!");
    return;
  }

  // Campos obrigatórios
  const obrigatorios: { campo: string; label: string }[] = [
    { campo: "razaoSocial", label: "Razão Social" },
    { campo: "nomeFantasia", label: "Nome Fantasia" },
    { campo: "cnpj", label: "CNPJ" },
    { campo: "tipoFornecedor", label: "Tipo de Fornecedor" },
    { campo: "naturezaJuridica", label: "Natureza Jurídica" },
    { campo: "endereco", label: "Endereço" },
    { campo: "numero", label: "Número" },    
    { campo: "bairro", label: "Bairro" },
    { campo: "cidadeUF", label: "Cidade / UF" },
    { campo: "cep", label: "CEP" },
    { campo: "pais", label: "País" },
    { campo: "telefonePrincipal", label: "Telefone Principal" },
    { campo: "responsavelComercial", label: "Responsável Comercial" },
    { campo: "tipoProdutoServico", label: "Tipo Produto / Serviço" },
    { campo: "categoria", label: "Categoria" },
    { campo: "descricao", label: "Descrição" },
    { campo: "unidadeFornecimento", label: "Unidade de Fornecimento" }
  ];

  const camposVazios = obrigatorios
    .filter(item => {
      const key = item.campo as keyof typeof formData;
      return !formData[key] || formData[key].toString().trim() === "";
    })
    .map(item => item.label);

  if (camposVazios.length > 0) {
    alert(
      `Por favor, preencha os seguintes campos obrigatórios:\n- ${camposVazios.join("\n- ")}`
    );
    return;
  }

  setLoading(true);
  const razaoSocial = formData.razaoSocial

  try {
    // Função auxiliar para upload via rota API
const uploadDocAPI = async (file?: File, key?: string) => {
  if (!file) return null;

  const cleanLabel = key?.replace(/[^a-zA-Z0-9]/g, "_") || "Arquivo";
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,"0")}${String(today.getMonth()+1).padStart(2,"0")}${today.getFullYear()}`;
  const fileName = `${cleanLabel}_${dateStr}.${file.name.split('.').pop()}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("fornecedor", razaoSocial);
  formData.append("tipo", "cadastro-fornecedor");

  // ✅ Adiciona dataCompra para não quebrar backend
  const dataCompraStr = `${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}/${today.getFullYear()}`;
  formData.append("dataCompra", dataCompraStr);

  const res = await fetch("/api/onedrive/upload", {
    method: "POST",
    body: formData
  });
  const uploaded = await res.json();
  if (!uploaded?.success) throw new Error(uploaded?.error || "Erro ao enviar documento");
  return uploaded.file.url || null;
};

    // Upload dos arquivos
    const fichaCadastralUrl = formData.fichaCadastral ? await uploadDocAPI(formData.fichaCadastral[0], "fichaCadastral") : null;
    const comprovantecapacidadetecnicaUrl = formData.comprovantecapacidadetecnica ? await uploadDocAPI(formData.comprovantecapacidadetecnica[0], "comprovantecapacidadetecnica") : null;
    const cartaoCnpjUrl = formData.cartaoCnpj ? await uploadDocAPI(formData.cartaoCnpj[0], "cartaoCnpj") : null;
    const certidaoNegativaUrl = formData.certidaoNegativa ? await uploadDocAPI(formData.certidaoNegativa[0], "certidaoNegativa") : null;
    const contratoSocialUrl = formData.contratoSocial ? await uploadDocAPI(formData.contratoSocial[0], "contratoSocial") : null;
    const alvaraUrl = formData.alvara ? await uploadDocAPI(formData.alvara[0], "alvara") : null;
    const outrosDocumentosUrl = formData.outrosDocumentos ? await uploadDocAPI(formData.outrosDocumentos[0], "outrosDocumentos") : null;

    // Upload arquivos de produtos
    const arquivosProdutosUrls: string[] = [];
    if (formData.arquivosProdutos) {
      for (const arquivo of Array.from(formData.arquivosProdutos)) {
        const url = await uploadDocAPI(arquivo, "arquivosProdutos");
        if (url) arquivosProdutosUrls.push(url);
      }
    }

    // Inserir no Supabase
    const { error } = await supabase.from("fornecedores").insert([{
      id_cadastrador: user.id,
      razao_social: formData.razaoSocial,
      nome_fantasia: formData.nomeFantasia,
      cnpj: formData.cnpj,
      inscricao: formData.inscricao,
      tipo_fornecedor: formData.tipoFornecedor,
      natureza_juridica: formData.naturezaJuridica,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade_uf: formData.cidadeUF,
      cep: formData.cep,
      pais: formData.pais,
      telefone_principal: formData.telefonePrincipal,
      email: formData.email,
      website: formData.website,
      responsavel_comercial: formData.responsavelComercial,
      responsavel_tecnico: formData.responsavelTecnico,
      responsavel_tecnicocontato: formData.responsavelTecnicocontato,
      contato1_nome: formData.contato1Nome,
      contato1_telefone: formData.contato1Telefone,
      contato2_nome: formData.contato2Nome,
      contato2_telefone: formData.contato2Telefone,
      tipo_produto_servico: formData.tipoProdutoServico,
      categoria: formData.categoria,
      descricao: formData.descricao,
      unidade_fornecimento: formData.unidadeFornecimento,
      preco_estimado: formData.precoEstimado.trim() === "" ? null : parseFloat(formData.precoEstimado),
      prazo_entrega: formData.prazoEntrega,
      arquivos_produtos_url: arquivosProdutosUrls,
      comprovantecapacidadetecnica_url: comprovantecapacidadetecnicaUrl,
      ficha_cadastral_url: fichaCadastralUrl,
      cartao_cnpj_url: cartaoCnpjUrl,
      certidao_negativa_url: certidaoNegativaUrl,
      contrato_social_url: contratoSocialUrl,
      alvara_url: alvaraUrl,
      outros_documentos_url: outrosDocumentosUrl,
      situacao_cadastro: formData.situacao || "Iniciado",
      avaliacao: Number(formData.avaliacao) || 0,
    }]);

    if (error) throw error;

    setLoading(false);
    alert("Fornecedor cadastrado com sucesso!");
    router.push("/dashboard/suprimentos/fornecedores");
  } catch (err) {
    console.error(err);
    setLoading(false);
    alert("Erro ao cadastrar fornecedor.");
  }
}



  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#111827] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-200">
              Departamento de Compras
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-[420px] ml-6 mr-6">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full h-[36px] w-full bg-white border-none focus:ring-2 focus:ring-gray-300 text-black"
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
          activeTab={'Suprimentos'}
        />

        {/* Conteúdo principal */}
        <div className="p-6 w-[85%] mx-auto space-y-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Gestão de Fornecedores
          </h3>

          {/* Dashboard + Ação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-start">
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm mb-2">Top Fornecedores por Valor</h4>
                    <div className="text-xs text-gray-500">Últimos 12 meses</div>
                  </div>
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData}>
                        <XAxis dataKey="categoria" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="valor" fill="#374151" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center">
              {/* Botão com imagem + label */}
              <div className="w-full">
                <Card>
                  <CardContent className="p-6 flex items-center justify-center">
                    <button
                      onClick={openNewModal}
                      className="flex items-center gap-3 px-4 py-3 border rounded-md hover:shadow-md transition-shadow"
                      aria-label="Novo Fornecedor"
                    >
                      {/* substitua /novo-cadastro-icon.png por sua imagem */}
                      <img src="/novo-cadastro-icon.png" alt="novo" className="w-8 h-8" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
                      <div className="text-left">
                        <div className="font-medium">Novo Fornecedor</div>
                        <div className="text-xs text-gray-500">Adicionar cadastro</div>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Tabela de fornecedores (cabeçalho minimalista, sem arredondamento) */}
          <div className="overflow-x-auto border shadow">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">CNPJ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Local</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Última Compra</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Situação</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f, i) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                    onClick={() => openEditModal(i)}
                    title="Clique para editar"
                  >
                    <td className="px-4 py-3">{f.cnpj}</td>
                    <td className="px-4 py-3">{f.nome}</td>
                    <td className="px-4 py-3">{f.categoria}</td>
                    <td className="px-4 py-3">{f.tipo}</td>
                    <td className="px-4 py-3">{f.local}</td>
                    <td className="px-4 py-3">
                      <a href={f.ultimaCompra} target="_blank" rel="noreferrer" className="text-gray-600 hover:underline">
                        Ver Compra
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${f.situacao === 'Completo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {f.situacao ?? 'Iniciado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className={`w-4 h-4 ${idx < f.avaliacao ? "text-yellow-400" : "text-gray-300"}`} />
                      ))}
                    </td>
                  </tr>
                ))}
                {fornecedores.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">
                      Nenhum fornecedor cadastrado — clique em "Novo Fornecedor" para adicionar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro (mantive estrutura, adicionei Situacao e suporte edição) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Editar Cadastro de Fornecedor' : 'Novo Cadastro de Fornecedor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Dados Gerais do Fornecedor">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} placeholder="Razão Social" />
                  <Input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} placeholder="Nome Fantasia" />
                  <Input name="inscricao" value={formData.inscricao} onChange={handleChange} placeholder="Inscrição Estadual / Municipal" />
                  <Select name="tipoFornecedor" value={formData.tipoFornecedor} onChange={handleChange} label="Tipo de Fornecedor" options={['Pessoa Jurídica', 'Pessoa Física']} />
                  <Select name="naturezaJuridica" value={formData.naturezaJuridica} onChange={handleChange} label="Natureza Jurídica" options={['MEI', 'LTDA', 'EIRELI', 'ME']} />
                  <Input name="cnpj" value={formData.cnpj} onChange={handleChangecnpj} placeholder="CPF ou CNPJ" />
                  <Input name="ultimaCompra" value={formData.ultimaCompra} onChange={handleChange} placeholder="URL da Última Compra (opcional)" type="url" />
                  <label className="flex flex-col">
                    <span className="text-sm mb-1">Avaliação (0-5)</span>
                    <select name="avaliacao" value={String(formData.avaliacao)} onChange={handleChange} className="border rounded px-3 py-2">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>

                  <label className="flex flex-col">
                    <span className="text-sm mb-1">Situação do Cadastro</span>
                    <select name="situacao" value={formData.situacao} onChange={handleChange} className="border rounded px-3 py-2">
                      <option value="Iniciado">Iniciado</option>
                      <option value="Completo">Completo</option>
                    </select>
                  </label>
                </div>
              </Section>

              <Section title="Endereço e Localização">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Endereço" />
                  <Input name="numero" value={formData.numero} onChange={handleChange} placeholder="Número" />
                  <Input name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Complemento" />
                  <Input name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Bairro" />
                  <Input name="cidadeUF" value={formData.cidadeUF} onChange={handleChange} placeholder="Cidade / UF" />
                  <Input name="cep" value={formData.cep} onChange={handleChange} placeholder="CEP" />
                  <Input name="pais" value={formData.pais} onChange={handleChange} placeholder="País" />
                </div>
              </Section>

              <Section title="Contatos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="telefonePrincipal" value={formData.telefonePrincipal} onChange={handleChange} placeholder="Telefone Fixo / Celular" />
                  <Input name="responsavelComercial" value={formData.responsavelComercial} onChange={handleChange} placeholder="Responsável Comercial" />
                  <Input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="E-mail" />
                  <Input name="website" value={formData.website} onChange={handleChange} placeholder="Website" />
                  <Input name="responsavelTecnico" value={formData.responsavelTecnico} onChange={handleChange} placeholder="Responsável Técnico (se aplicável)" />
                  <Input name="responsavelTecnicocontato" value={formData.responsavelTecnicocontato} onChange={handleChange} placeholder="Contato Responsável (Telefone)" />
                  <Input name="contato1Nome" value={formData.contato1Nome} onChange={handleChange} placeholder="Contato 1 - Nome" />
                  <Input name="contato1Telefone" value={formData.contato1Telefone} onChange={handleChange} placeholder="Contato 1 - Telefone" />
                  <Input name="contato2Nome" value={formData.contato2Nome} onChange={handleChange} placeholder="Contato 2 - Nome" />
                  <Input name="contato2Telefone" value={formData.contato2Telefone} onChange={handleChange} placeholder="Contato 2 - Telefone" />
                </div>
              </Section>

              <Section title="Produtos / Serviços Ofertados">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select name="tipoProdutoServico" value={formData.tipoProdutoServico} onChange={handleChange} label="Tipo" options={['Produto', 'Serviço']} />
                  <Input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Categoria" />
                  <Input name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descrição" />
                  <Input name="unidadeFornecimento" value={formData.unidadeFornecimento} onChange={handleChange} placeholder="Unidade de fornecimento" />
                  <Input name="precoEstimado" value={formData.precoEstimado} onChange={handleChange} placeholder="Preço estimado (opcional)" />
                  <Input name="prazoEntrega" value={formData.prazoEntrega} onChange={handleChange} placeholder="Prazo médio de entrega" />
                  <FileUpload label="Catálogo ou Ficha Técnica (opcional)" name="arquivosProdutos" onFilesChange={(files) => handleFileChange('arquivosProdutos', files)} multiple />
                </div>
              </Section>

              <Section title="Documentação">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload label="Comprovante de Capacidade Técnica" name="comprovantecapacidadetecnica" onFilesChange={(files) => handleFileChange('comprovantecapacidadetecnica', files)} />
                  <FileUpload label="Ficha Cadastral do Fornecedor" name="fichaCadastral" onFilesChange={(files) => handleFileChange('fichaCadastral', files)} />
                  <FileUpload label="Cartão CNPJ" name="cartaoCnpj" onFilesChange={(files) => handleFileChange('cartaoCnpj', files)} />
                  <FileUpload label="Certidões Negativas" name="certidaoNegativa" onFilesChange={(files) => handleFileChange('certidaoNegativa', files)} />
                  <FileUpload label="Contrato Social / Estatuto" name="contratoSocial" onFilesChange={(files) => handleFileChange('contratoSocial', files)} />
                  <FileUpload label="Alvará de Funcionamento" name="alvara" onFilesChange={(files) => handleFileChange('alvara', files)} />
                  <FileUpload label="Outros Documentos" name="outrosDocumentos" onFilesChange={(files) => handleFileChange('outrosDocumentos', files)} />
                </div>
              </Section>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingIndex(null);
                }}
                className="mr-3 px-4 py-2 rounded border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded font-medium transition-all ${loading ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              >
                {loading ? 'Enviando...' : (editingIndex !== null ? 'Atualizar Cadastro' : 'Salvar Cadastro')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

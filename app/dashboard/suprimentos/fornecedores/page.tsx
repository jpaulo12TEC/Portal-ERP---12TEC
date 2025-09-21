'use client';

import { supabase } from '@/lib/superbase';
import $ from "jquery"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Users, Plus, Star } from "lucide-react";
import Sidebar from '@/components/Sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent,  } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';


interface DashboardItem {
  fornecedor: string;
  compras: number;
  valor: number;
  quantidade: number;
}

type Metric = "valor" | "quantidade" | "compras";

/* Tipos (simplificados para foco no funcionamento) */
interface FornecedorResumo {
  id?: number;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  categoria?: string;
  tipo_produto_servico?: string;
  cidade_uf?: string;
  ultimaCompraData?: string | null;
  ultimaCompraUrl?: string | null;
  avaliacao?: number;
  situacao_cadastro?: 'Iniciado' | 'Completo' | string;
}

interface SupplierFormData {
  // campos usados no formulário (pode ser estendido)
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricao?: string;
  tipoFornecedor?: string;
  naturezaJuridica?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidadeUF?: string;
  cep?: string;
  pais?: string;
  telefonePrincipal?: string;
  responsavelComercial?: string;
  email?: string;
  website?: string;
  responsavelTecnico?: string;
  responsavelTecnicocontato?: string;
  contato1Nome?: string;
  contato1Telefone?: string;
  contato2Nome?: string;
  contato2Telefone?: string;
  tipoProdutoServico?: string;
  categoria?: string;
  descricao?: string;
  unidadeFornecimento?: string;
  precoEstimado?: string;
  prazoEntrega?: string;
  arquivos_produtos_url?: string[] | null;
  comprovantecapacidadetecnica_url?: string | null;
  ficha_cadastral_url?: string | null;
  cartao_cnpj_url?: string | null;
  certidao_negativa_url?: string | null;
  contrato_social_url?: string | null;
  alvara_url?: string | null;
  outros_documentos_url?: string | null;
  ultimaCompra?: string | null;
  avaliacao?: number | string;
  situacao?: "Iniciado" | "Completo" | string;
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
  readOnly?: boolean;
}> = ({ name, value = '', onChange, placeholder = '', type = 'text', readOnly = false }) => (
  <input
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    type={type}
    readOnly={readOnly}
    className={`w-full border border-gray-200 rounded px-3 py-2 ${readOnly ? 'bg-gray-50' : ''}`}
  />
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
const Select: React.FC<{
  name: string;
  value?: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  options: string[];
  readOnly?: boolean;
}> = ({ name, value = '', onChange, label, options, readOnly = false }) => (
  <select name={name} value={value} onChange={onChange} className={`w-full border border-gray-200 rounded px-3 py-2 ${readOnly ? 'bg-gray-50' : ''}`}>
    <option value="">{label ?? 'Selecione'}</option>
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

const FileLink: React.FC<{ url?: string | null; label?: string }> = ({ url, label = 'Download' }) => {
  if (!url) return <span className="text-sm text-gray-400">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="underline text-sm">
      {label}
    </a>
  );
};

export default function FornecedoresPage() {
   const [dashboardData, setDashboardData] = useState<DashboardItem[]>([]);
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("valor");


  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / seleção
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<FornecedorResumo | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({});

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
    arquivos_produtos_url: [],
    comprovantecapacidadetecnica_url: null,
    ficha_cadastral_url: null,
    cartao_cnpj_url: null,
    certidao_negativa_url: null,
    contrato_social_url: null,
    alvara_url: null,
    outros_documentos_url: null,
    ultimaCompra: null,
    avaliacao: 0,
    situacao: 'Iniciado'
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  /* ====== Buscar fornecedores + última compra (completo) ====== */
  async function fetchFornecedores() {
    try {
      // pegamos todos os campos da tabela fornecedores
      const { data: fornecedoresData, error } = await supabase
        .from('fornecedores')
        .select('*');

      if (error) throw error;
      if (!fornecedoresData) return;

      // Para performance, buscamos a última compra por cnpj em paralelo
      const withUltimaCompra: FornecedorResumo[] = await Promise.all(
        fornecedoresData.map(async (f: any) => {
          // busca a última compra (se existir) na tabela de gerenciamento de compras
          const { data: compra, error: compraErr } = await supabase
            .from('gerenciamento_compras')
            .select('nf_url, nf, data')
            .eq('cnpj', f.cnpj)
            .order('data', { ascending: false })
            .limit(1)
            .single();

          // alguns sistemas salvam o link direto em campo NF ou nf_url. Ajuste conforme sua base.
          const ultimaUrl = compra?.nf_url ?? compra?.nf ?? null;

          return {
            id: f.id,
            cnpj: f.cnpj,
            razao_social: f.razao_social,
            nome_fantasia: f.nome_fantasia,
            categoria: f.categoria,
            tipo_produto_servico: f.tipo_produto_servico,
            cidade_uf: f.cidade_uf,
            ultimaCompraData: compra?.data ?? null,
            ultimaCompraUrl: ultimaUrl,
            avaliacao: f.avaliacao ?? 0,
            situacao_cadastro: f.situacao_cadastro ?? 'Iniciado',
          };
        })
      );

      setFornecedores(withUltimaCompra);
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
    }
  }

  /* ===== Abrir opções ao clicar na linha: visualizar ou editar ===== */
  function onRowClick(f: FornecedorResumo) {
    setSelectedFornecedor(f);
    setOptionsModalOpen(true);
  }

  async function openViewSelected() {
    if (!selectedFornecedor) return;
    setOptionsModalOpen(false);
    setLoading(true);

    try {
      // buscar registro completo do fornecedor
      const { data: full, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('cnpj', selectedFornecedor.cnpj)
        .single();

      if (error) throw error;

      // também buscar a última compra para exibir informações detalhadas
      const { data: compra } = await supabase
        .from('gerenciamento_compras')
        .select('nf_url, nf, data, valor, observacoes')
        .eq('cnpj', selectedFornecedor.cnpj)
        .order('data', { ascending: false })
        .limit(1)
        .single();

      const ultimaUrl = compra?.nf_url ?? compra?.nf ?? null;

      // montar formData somente para exibir (readOnly)
      const viewData: SupplierFormData = {
        ...full,
        ultimaCompra: ultimaUrl,
        ultimaCompraData: compra?.data ?? null,
      };

      setFormData(viewData);
      setViewModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do fornecedor. Veja console.');
    } finally {
      setLoading(false);
    }
  }

  async function openEditSelected() {
    if (!selectedFornecedor) return;
    setOptionsModalOpen(false);
    setLoading(true);
    try {
      const { data: full, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('cnpj', selectedFornecedor.cnpj)
        .single();

      if (error) throw error;

      setFormData({ ...full });
      setEditModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados para edição.');
    } finally {
      setLoading(false);
    }
  }

  /* ===== Manipulação formulário (edição) ===== */
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  function handleFileChange(name: string, files: FileList | null) {
    setFormData((p) => ({ ...p, [name]: files }));
  }

  function formatCnpjCpf(value: string = '') {
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

  /* ===== Submissão de edição (update) ===== */
async function handleUpdate(e?: React.FormEvent) {
  if (e) e.preventDefault();
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }

    const razaoSocial = formData.razaoSocial ?? formData.razao_social ?? "";
    const cnpj = formData.cnpj;

    // ===== Função auxiliar para upload de arquivos =====
    const uploadDocAPI = async (file?: File, key?: string) => {
      if (!file) return null;

      const cleanLabel = key?.replace(/[^a-zA-Z0-9]/g, "_") || "Arquivo";
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${dd}${mm}${yyyy}`;
      const fileName = `${cleanLabel}_${dateStr}.${file.name.split(".").pop()}`;
      const dataCompraStr = `${yyyy}-${mm}-${dd}`;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("fileName", fileName);
      fd.append("fornecedor", razaoSocial);
      fd.append("tipo", "cadastro-fornecedor");
      fd.append("dataCompra", dataCompraStr);

      const res = await fetch("/api/onedrive/upload", { method: "POST", body: fd });
      const uploaded = await res.json();
      if (!uploaded?.success) throw new Error(uploaded?.error || "Erro ao enviar documento");

      return uploaded.file;
    };

    // ===== Upload de arquivos =====
    const fichaCadastral = formData.fichaCadastral?.[0] ? await uploadDocAPI(formData.fichaCadastral[0], "fichaCadastral") : null;
    const comprovantecapacidadetecnica = formData.comprovantecapacidadetecnica?.[0] ? await uploadDocAPI(formData.comprovantecapacidadetecnica[0], "comprovantecapacidadetecnica") : null;
    const cartaoCnpj = formData.cartaoCnpj?.[0] ? await uploadDocAPI(formData.cartaoCnpj[0], "cartaoCnpj") : null;
    const certidaoNegativa = formData.certidaoNegativa?.[0] ? await uploadDocAPI(formData.certidaoNegativa[0], "certidaoNegativa") : null;
    const contratoSocial = formData.contratoSocial?.[0] ? await uploadDocAPI(formData.contratoSocial[0], "contratoSocial") : null;
    const alvara = formData.alvara?.[0] ? await uploadDocAPI(formData.alvara[0], "alvara") : null;
    const outrosDocumentos = formData.outrosDocumentos?.[0] ? await uploadDocAPI(formData.outrosDocumentos[0], "outrosDocumentos") : null;

const arquivosProdutosUrls: string[] = [];

if (formData.arquivosProdutos) {
  const arquivos = Array.from(formData.arquivosProdutos) as File[];
  for (const arquivo of arquivos) {
    const up = await uploadDocAPI(arquivo, "arquivosProdutos");
    if (up?.url) arquivosProdutosUrls.push(up.url);
  }
}


    // ===== Buscar fornecedor atual =====
    const { data: fornecedorAtual, error: fetchErr } = await supabase
      .from("fornecedores")
      .select("*")
      .eq("cnpj", cnpj)
      .single();
    if (fetchErr) throw fetchErr;

    // ===== Mover arquivos antigos via API, se existirem =====
    const moverAntigoAPI = async (itemId?: string) => {
      if (!itemId) return; // não existe, nada a mover
      try {
        await fetch("/api/onedrive/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileIdOrUrl: itemId,
            subFolderName: "Nao Vigentes",
          }),
        });
      } catch (err) {
        console.warn("Falha ao mover arquivo antigo (não fatal):", err);
      }
    };

    // Só move se tiver um novo arquivo sendo enviado
    if (fichaCadastral) await moverAntigoAPI(fornecedorAtual?.ficha_cadastral_item_id);
    if (comprovantecapacidadetecnica) await moverAntigoAPI(fornecedorAtual?.comprovantecapacidadetecnica_item_id);
    if (cartaoCnpj) await moverAntigoAPI(fornecedorAtual?.cartao_cnpj_item_id);
    if (certidaoNegativa) await moverAntigoAPI(fornecedorAtual?.certidao_negativa_item_id);
    if (contratoSocial) await moverAntigoAPI(fornecedorAtual?.contrato_social_item_id);
    if (alvara) await moverAntigoAPI(fornecedorAtual?.alvara_item_id);
    if (outrosDocumentos) await moverAntigoAPI(fornecedorAtual?.outros_documentos_item_id);

    // ===== Objeto de atualização =====
    const updateObj: any = {
      razao_social: razaoSocial,
      nome_fantasia: formData.nomeFantasia ?? formData.nome_fantasia ?? null,
      cnpj,
      inscricao: formData.inscricao ?? null,
      tipo_fornecedor: formData.tipoFornecedor ?? formData.tipo_fornecedor ?? null,
      natureza_juridica: formData.naturezaJuridica ?? formData.natureza_juridica ?? null,
      endereco: formData.endereco ?? null,
      numero: formData.numero ?? null,
      complemento: formData.complemento ?? null,
      bairro: formData.bairro ?? null,
      cidade_uf: formData.cidadeUF ?? formData.cidade_uf ?? null,
      cep: formData.cep ?? null,
      pais: formData.pais ?? null,
      telefone_principal: formData.telefonePrincipal ?? formData.telefone_principal ?? null,
      email: formData.email ?? null,
      website: formData.website ?? null,
      responsavel_comercial: formData.responsavelComercial ?? null,
      responsavel_tecnico: formData.responsavelTecnico ?? null,
      responsavel_tecnicocontato: formData.responsavelTecnicocontato ?? null,
      contato1_nome: formData.contato1Nome ?? null,
      contato1_telefone: formData.contato1Telefone ?? null,
      contato2_nome: formData.contato2Nome ?? null,
      contato2_telefone: formData.contato2Telefone ?? null,
      tipo_produto_servico: formData.tipoProdutoServico ?? null,
      categoria: formData.categoria ?? null,
      descricao: formData.descricao ?? null,
      unidade_fornecimento: formData.unidadeFornecimento ?? null,
      preco_estimado: formData.precoEstimado ? Number(formData.precoEstimado) : null,
      prazo_entrega: formData.prazoEntrega ?? null,
      arquivos_produtos_url: arquivosProdutosUrls.length ? arquivosProdutosUrls : fornecedorAtual?.arquivos_produtos_url,
      ficha_cadastral_url: fichaCadastral?.url ?? fornecedorAtual?.ficha_cadastral_url,
      ficha_cadastral_item_id: fichaCadastral?.id ?? fornecedorAtual?.ficha_cadastral_item_id,
      comprovantecapacidadetecnica_url: comprovantecapacidadetecnica?.url ?? fornecedorAtual?.comprovantecapacidadetecnica_url,
      comprovantecapacidadetecnica_item_id: comprovantecapacidadetecnica?.id ?? fornecedorAtual?.comprovantecapacidadetecnica_item_id,
      cartao_cnpj_url: cartaoCnpj?.url ?? fornecedorAtual?.cartao_cnpj_url,
      cartao_cnpj_item_id: cartaoCnpj?.id ?? fornecedorAtual?.cartao_cnpj_item_id,
      certidao_negativa_url: certidaoNegativa?.url ?? fornecedorAtual?.certidao_negativa_url,
      certidao_negativa_item_id: certidaoNegativa?.id ?? fornecedorAtual?.certidao_negativa_item_id,
      contrato_social_url: contratoSocial?.url ?? fornecedorAtual?.contrato_social_url,
      contrato_social_item_id: contratoSocial?.id ?? fornecedorAtual?.contrato_social_item_id,
      alvara_url: alvara?.url ?? fornecedorAtual?.alvara_url,
      alvara_item_id: alvara?.id ?? fornecedorAtual?.alvara_item_id,
      outros_documentos_url: outrosDocumentos?.url ?? fornecedorAtual?.outros_documentos_url,
      outros_documentos_item_id: outrosDocumentos?.id ?? fornecedorAtual?.outros_documentos_item_id,
      situacao_cadastro: formData.situacao ?? formData.situacao_cadastro ?? "Iniciado",
      avaliacao: formData.avaliacao ? Number(formData.avaliacao) : fornecedorAtual?.avaliacao ?? 0,
    };

    const { error } = await supabase.from("fornecedores").update(updateObj).eq("cnpj", cnpj);
    if (error) throw error;

    setEditModalOpen(false);
    await fetchFornecedores();
    alert("Atualização realizada com sucesso.");
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar fornecedor.");
  } finally {
    setLoading(false);
  }
}

 


  function openNewModal() {
    setFormData(initialForm);
    setEditModalOpen(true);
  }









 const fetchDashboardData = async () => {
    const inicio = dataInicio ? new Date(dataInicio).toISOString() : undefined;
    const fim = dataFim ? new Date(dataFim).toISOString() : undefined;

    let query = supabase
      .from("gerenciamento_compras")
      .select("cnpj_cpf, fornecedor, quantidade_produtos, valor_liquido, data_compra");

    if (inicio) query = query.gte("data_compra", inicio);
    if (fim) query = query.lte("data_compra", fim);

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      return;
    }

    // Agrupar por fornecedor
    const agrupado: Record<string, DashboardItem> = {};
    data?.forEach((item: any) => {
      const key = item.fornecedor || item.cnpj_cpf;
      if (!agrupado[key]) {
        agrupado[key] = {
          fornecedor: key,
          compras: 0,
          valor: 0,
          quantidade: 0,
        };
      }
      agrupado[key].compras += 1;
      agrupado[key].valor += Number(item.valor_liquido ?? 0);
      agrupado[key].quantidade += Number(item.quantidade_produtos ?? 0);
    });

    const finalData = Object.values(agrupado)
      .sort((a, b) => b[selectedMetric] - a[selectedMetric])
      .slice(0, 7); // pegar apenas top 7

    setDashboardData(finalData);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dataInicio, dataFim, selectedMetric]);

  const getBarColor = (metric: Metric) => {
    switch (metric) {
      case "valor":
        return "#3b82f6"; // azul
      case "quantidade":
        return "#10b981"; // verde
      case "compras":
        return "#f59e0b"; // laranja
    }
  };



  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => router.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Catálogo de Produtos
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
 {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Data Início</label>
          <Input name="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Data Fim</label>
          <Input name="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={fetchDashboardData}
        >
          Filtrar
        </button>

        {/* Alternar Métrica */}
        <div className="flex gap-2">
          {(["valor", "quantidade", "compras"] as Metric[]).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded text-white ${
                selectedMetric === metric
                  ? "bg-gray-800"
                  : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              {metric === "valor" ? "Valor Líquido" : metric === "quantidade" ? "Qtd Produtos" : "Compras"}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">
                  Top Fornecedores por{" "}
                  {selectedMetric === "valor"
                    ? "Valor Líquido"
                    : selectedMetric === "quantidade"
                    ? "Quantidade Produtos"
                    : "Compras"}
                </h4>
                <div className="text-xs text-gray-500">
                  {dataInicio && dataFim ? `${dataInicio} → ${dataFim}` : "Últimos 12 meses"}
                </div>
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fornecedor" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={selectedMetric} name={selectedMetric} fill={getBarColor(selectedMetric)} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards resumidos */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <h5 className="text-xs text-gray-500">Total Compras</h5>
              <p className="text-xl font-semibold">{dashboardData.reduce((acc, cur) => acc + cur.compras, 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h5 className="text-xs text-gray-500">Total Produtos</h5>
              <p className="text-xl font-semibold">{dashboardData.reduce((acc, cur) => acc + cur.quantidade, 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h5 className="text-xs text-gray-500">Valor Total</h5>
              <p className="text-xl font-semibold">
                R$ {dashboardData.reduce((acc, cur) => acc + cur.valor, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
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

          {/* Tabela de fornecedores */}
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
                    onClick={() => onRowClick(f)}
                    title="Clique para opções"
                  >
                    <td className="px-4 py-3">{f.cnpj}</td>
                    <td className="px-4 py-3">{f.razao_social}</td>
                    <td className="px-4 py-3">{f.categoria}</td>
                    <td className="px-4 py-3">{f.tipo_produto_servico}</td>
                    <td className="px-4 py-3">{f.cidade_uf}</td>
                    <td className="px-4 py-3">
                      {f.ultimaCompraUrl ? (
                        <a href={f.ultimaCompraUrl} target="_blank" rel="noreferrer" className="text-gray-600 hover:underline">Ver Compra</a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${f.situacao_cadastro === 'Completo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {f.situacao_cadastro ?? 'Iniciado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className={`w-4 h-4 ${idx < (f.avaliacao ?? 0) ? "text-yellow-400" : "text-gray-300"}`} />
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

      {/* Modal: opções (Visualizar / Editar) */}
      <Dialog open={optionsModalOpen} onOpenChange={setOptionsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opções</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="mb-4">O que deseja fazer com o fornecedor <strong>{selectedFornecedor?.razao_social ?? selectedFornecedor?.cnpj}</strong>?</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openViewSelected}>Visualizar</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={openEditSelected}>Editar</button>
              <button className="px-4 py-2 border rounded" onClick={() => setOptionsModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Visualizar (read-only) */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Fornecedor</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Dados Gerais">
                <div className="grid grid-cols-1 gap-3">
                  <div><strong>Razão Social:</strong> {formData.razao_social ?? formData.razaoSocial}</div>
                  <div><strong>Nome Fantasia:</strong> {formData.nome_fantasia ?? formData.nomeFantasia}</div>
                  <div><strong>CNPJ:</strong> {formData.cnpj}</div>
                  <div><strong>Tipo / Categoria:</strong> {formData.tipo_produto_servico ?? formData.tipoProdutoServico} — {formData.categoria}</div>
                </div>
              </Section>

              <Section title="Contatos">
                <div className="grid grid-cols-1 gap-3">
                  <div><strong>Telefone:</strong> {formData.telefone_principal ?? formData.telefonePrincipal}</div>
                  <div><strong>E-mail:</strong> {formData.email}</div>
                  <div><strong>Responsável Comercial:</strong> {formData.responsavel_comercial ?? formData.responsavelComercial}</div>
                </div>
              </Section>

              <Section title="Última Compra / Nota Fiscal">
                <div className="grid grid-cols-1 gap-3">
                  <div><strong>Data:</strong> {formData.ultimaCompraData ?? formData.ultimaCompra_date ?? '—'}</div>
                  <div><strong>Arquivo / URL:</strong> <FileLink url={formData.ultimaCompra ?? formData.ultimaCompraUrl ?? null} label={formData.ultimaCompra ?? 'Abrir Nota'} /></div>
                </div>
              </Section>

              <Section title="Documentos (download)">
                <div className="grid grid-cols-1 gap-2">
                  <div><strong>Ficha cadastral:</strong> <FileLink url={formData.ficha_cadastral_url ?? formData.fichaCadastralUrl ?? null} /></div>
                  <div><strong>Comprovante capacidade técnica:</strong> <FileLink url={formData.comprovantecapacidadetecnica_url ?? null} /></div>
                  <div><strong>Cartão CNPJ:</strong> <FileLink url={formData.cartao_cnpj_url ?? null} /></div>
                  <div><strong>Certidões:</strong> <FileLink url={formData.certidao_negativa_url ?? null} /></div>
                  <div><strong>Contrato social:</strong> <FileLink url={formData.contrato_social_url ?? null} /></div>
                  <div><strong>Alvará:</strong> <FileLink url={formData.alvara_url ?? null} /></div>
                  <div><strong>Outros:</strong> <FileLink url={formData.outros_documentos_url ?? null} /></div>
                </div>
              </Section>

            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 border rounded" onClick={() => setViewModalOpen(false)}>Fechar</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded ml-3" onClick={() => { setViewModalOpen(false); setEditModalOpen(true); }}>Editar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar / Novo (reaproveita o mesmo formulário) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData?.cnpj ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Dados Gerais do Fornecedor">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="razaoSocial" value={formData.razao_social ?? formData.razaoSocial ?? ''} onChange={handleChange as any} placeholder="Razão Social" />
                  <Input name="nomeFantasia" value={formData.nome_fantasia ?? formData.nomeFantasia ?? ''} onChange={handleChange as any} placeholder="Nome Fantasia" />
                  <Input name="inscricao" value={formData.inscricao ?? ''} onChange={handleChange as any} placeholder="Inscrição Estadual / Municipal" />
                  <Select name="tipoFornecedor" value={formData.tipo_fornecedor ?? formData.tipoFornecedor ?? ''} onChange={handleChange as any} label="Tipo de Fornecedor" options={['Pessoa Jurídica', 'Pessoa Física']} />
                  <Select name="naturezaJuridica" value={formData.natureza_juridica ?? formData.naturezaJuridica ?? ''} onChange={handleChange as any} label="Natureza Jurídica" options={['MEI', 'LTDA', 'EIRELI', 'ME']} />
                  <Input name="cnpj" value={formData.cnpj ?? ''} onChange={handleChangecnpj as any} placeholder="CPF ou CNPJ" />
                  <Input name="ultimaCompra" value={formData.ultimaCompra ?? ''} onChange={handleChange as any} placeholder="URL da Última Compra (opcional)" type="url" />

                  <label className="flex flex-col">
                    <span className="text-sm mb-1">Avaliação (0-5)</span>
                    <select name="avaliacao" value={String(formData.avaliacao ?? 0)} onChange={handleChange as any} className="border rounded px-3 py-2">
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
                    <select name="situacao" value={formData.situacao ?? formData.situacao_cadastro ?? 'Iniciado'} onChange={handleChange as any} className="border rounded px-3 py-2">
                      <option value="Iniciado">Iniciado</option>
                      <option value="Completo">Completo</option>
                    </select>
                  </label>
                </div>
              </Section>

              <Section title="Endereço e Localização">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="endereco" value={formData.endereco ?? formData.endereco} onChange={handleChange as any} placeholder="Endereço" />
                  <Input name="numero" value={formData.numero ?? formData.numero} onChange={handleChange as any} placeholder="Número" />
                  <Input name="complemento" value={formData.complemento ?? formData.complemento} onChange={handleChange as any} placeholder="Complemento" />
                  <Input name="bairro" value={formData.bairro ?? formData.bairro} onChange={handleChange as any} placeholder="Bairro" />
                  <Input name="cidadeUF" value={formData.cidade_uf ?? formData.cidadeUF ?? ''} onChange={handleChange as any} placeholder="Cidade / UF" />
                  <Input name="cep" value={formData.cep ?? ''} onChange={handleChange as any} placeholder="CEP" />
                  <Input name="pais" value={formData.pais ?? ''} onChange={handleChange as any} placeholder="País" />
                </div>
              </Section>

              <Section title="Contatos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="telefonePrincipal" value={formData.telefone_principal ?? formData.telefonePrincipal ?? ''} onChange={handleChange as any} placeholder="Telefone Fixo / Celular" />
                  <Input name="responsavelComercial" value={formData.responsavel_comercial ?? formData.responsavelComercial ?? ''} onChange={handleChange as any} placeholder="Responsável Comercial" />
                  <Input name="email" value={formData.email ?? ''} onChange={handleChange as any} type="email" placeholder="E-mail" />
                  <Input name="website" value={formData.website ?? ''} onChange={handleChange as any} placeholder="Website" />
                  <Input name="responsavelTecnico" value={formData.responsavel_tecnico ?? formData.responsavelTecnico ?? ''} onChange={handleChange as any} placeholder="Responsável Técnico (se aplicável)" />
                  <Input name="responsavelTecnicocontato" value={formData.responsavel_tecnicocontato ?? formData.responsavelTecnicocontato ?? ''} onChange={handleChange as any} placeholder="Contato Responsável (Telefone)" />
                  <Input name="contato1Nome" value={formData.contato1_nome ?? formData.contato1Nome ?? ''} onChange={handleChange as any} placeholder="Contato 1 - Nome" />
                  <Input name="contato1Telefone" value={formData.contato1_telefone ?? formData.contato1Telefone ?? ''} onChange={handleChange as any} placeholder="Contato 1 - Telefone" />
                  <Input name="contato2Nome" value={formData.contato2_nome ?? formData.contato2Nome ?? ''} onChange={handleChange as any} placeholder="Contato 2 - Nome" />
                  <Input name="contato2Telefone" value={formData.contato2_telefone ?? formData.contato2Telefone ?? ''} onChange={handleChange as any} placeholder="Contato 2 - Telefone" />
                </div>
              </Section>

              <Section title="Produtos / Serviços Ofertados">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select name="tipoProdutoServico" value={formData.tipo_produto_servico ?? formData.tipoProdutoServico ?? ''} onChange={handleChange as any} label="Tipo" options={['Produto', 'Serviço']} />
                  <Input name="categoria" value={formData.categoria ?? ''} onChange={handleChange as any} placeholder="Categoria" />
                  <Input name="descricao" value={formData.descricao ?? ''} onChange={handleChange as any} placeholder="Descrição" />
                  <Input name="unidadeFornecimento" value={formData.unidade_fornecimento ?? formData.unidadeFornecimento ?? ''} onChange={handleChange as any} placeholder="Unidade de fornecimento" />
                  <Input name="precoEstimado" value={formData.preco_estimado ?? formData.precoEstimado ?? ''} onChange={handleChange as any} placeholder="Preço estimado (opcional)" />
                  <Input name="prazoEntrega" value={formData.prazo_entrega ?? formData.prazoEntrega ?? ''} onChange={handleChange as any} placeholder="Prazo médio de entrega" />
                {/* Catálogo ou Ficha Técnica (opcional) */}
<div className="flex flex-col gap-2">
  <FileUpload
    label="Catálogo ou Ficha Técnica (opcional)"
    name="arquivosProdutos"
    multiple
    onFilesChange={(files) => handleFileChange('arquivosProdutos', files)}
  />

  {/* Visualização dos arquivos já salvos (se houver) */}
  {Array.isArray(formData.arquivos_produtos_url) &&
    formData.arquivos_produtos_url.length > 0 && (
      <div className="flex flex-col gap-1">
        {formData.arquivos_produtos_url.map((url: string, idx: number) => (
          <FileLink key={idx} url={url} />
        ))}
      </div>
  )}
</div>
                </div>
              </Section>

             <Section title="Documentação">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Comprovante Capacidade Técnica */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Comprovante de Capacidade Técnica"
        name="comprovantecapacidadetecnica"
        onFilesChange={(files) => handleFileChange('comprovantecapacidadetecnica', files)}
      />
      {formData.comprovantecapacidadetecnica_url && (
        <FileLink url={formData.comprovantecapacidadetecnica_url} />
      )}
    </div>

    {/* Ficha Cadastral */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Ficha Cadastral do Fornecedor"
        name="fichaCadastral"
        onFilesChange={(files) => handleFileChange('fichaCadastral', files)}
      />
      {formData.ficha_cadastral_url && (
        <FileLink url={formData.ficha_cadastral_url} />
      )}
    </div>

    {/* Cartão CNPJ */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Cartão CNPJ"
        name="cartaoCnpj"
        onFilesChange={(files) => handleFileChange('cartaoCnpj', files)}
      />
      {formData.cartao_cnpj_url && (
        <FileLink url={formData.cartao_cnpj_url} />
      )}
    </div>

    {/* Certidões Negativas */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Certidões Negativas"
        name="certidaoNegativa"
        onFilesChange={(files) => handleFileChange('certidaoNegativa', files)}
      />
      {formData.certidao_negativa_url && (
        <FileLink url={formData.certidao_negativa_url} />
      )}
    </div>

    {/* Contrato Social */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Contrato Social / Estatuto"
        name="contratoSocial"
        onFilesChange={(files) => handleFileChange('contratoSocial', files)}
      />
      {formData.contrato_social_url && (
        <FileLink url={formData.contrato_social_url} />
      )}
    </div>

    {/* Alvará */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Alvará de Funcionamento"
        name="alvara"
        onFilesChange={(files) => handleFileChange('alvara', files)}
      />
      {formData.alvara_url && (
        <FileLink url={formData.alvara_url} />
      )}
    </div>

    {/* Outros Documentos */}
    <div className="flex flex-col gap-2">
      <FileUpload
        label="Outros Documentos"
        name="outrosDocumentos"
        onFilesChange={(files) => handleFileChange('outrosDocumentos', files)}
      />
      {formData.outros_documentos_url && (
        <FileLink url={formData.outros_documentos_url} />
      )}
    </div>
  </div>
</Section>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
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
                {loading ? 'Enviando...' : (formData?.cnpj ? 'Atualizar Cadastro' : 'Salvar Cadastro')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../../../../../../components/Sidebar';
import { Separator } from '../../../../../../components/ui/separator';
import { getAccessToken } from "@/lib/auth"; // ajuste o caminho
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { supabase } from '../../../../../../lib/superbase';


export default function CadastrarFornecedor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('contratos');

  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricao: "",
    tipoFornecedor: "",
    naturezaJuridica: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidadeUF: "",
    cep: "",
    pais: "",
    telefonePrincipal: "",
    email: "",
    website: "",
    responsavelComercial: "",
    responsavelTecnico: "",
    responsavelTecnicocontato: "",
    contato1Nome: "",
    contato1Telefone: "",
    contato2Nome: "",
    contato2Telefone: "",
    tipoProdutoServico: "",
    categoria: "",
    descricao: "",
    unidadeFornecimento: "",
    precoEstimado: "",
    prazoEntrega: "",


    arquivosProdutos: [] as File[],
    comprovantecapacidadetecnica: [] as File[],    
    fichaCadastral: [] as File[],
    cartaoCnpj: [] as File[],
    certidaoNegativa: [] as File[],
    contratoSocial: [] as File[],
    alvara: [] as File[],   
    outrosDocumentos: [] as File[]
  });


  

  const fileFieldLabels: Record<string, string> = {
  arquivosProdutos: "Catálogo ou Ficha Técnica",
  comprovantecapacidadetecnica: "Comprovante de Capacidade Técnica",
  fichaCadastral: "Ficha Cadastral",
  cartaoCnpj: "Cartão CNPJ",
  certidaoNegativa: "Certidões Negativas",
  contratoSocial: "Contrato Social",
  alvara: "Alvará de Funcionamento", 
  outrosDocumentos: "Outros Documentos",
  
};


const handleChange = (e: any) => {
  const { name, files } = e.target;

  // Encontrar a chave correspondente no formData
  const key = Object.keys(fileFieldLabels).find(k => k === name || fileFieldLabels[k] === name) || name;

  setFormData(prev => ({
    ...prev,
    [key]: files ? Array.from(files) : e.target.value
  }));
};




const handleSubmit = async () => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }

      // Mapeamento de campos obrigatórios para labels amigáveis
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

// Checa campos vazios
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


setLoading(true); // Inicia o loading



    try {
      const accessToken = await getAccessToken();

          if (!accessToken) {
  console.error("Token de acesso não encontrado.");
  alert("Token de acesso não encontrado.");
  return;
}


    // Função auxiliar para subir arquivo e retornar a URL ou null
      // Função para gerar nome do arquivo baseado no label + data
const uploadDoc = async (file?: File, key?: string) => {
  if (!file) return null;
  const label = key && fileFieldLabels[key] ? fileFieldLabels[key] : "Arquivo";

  const cleanLabel = label
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_ ]/g, "")
    .replace(/\s+/g, "_");

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,"0")}${String(today.getMonth()+1).padStart(2,"0")}${today.getFullYear()}`;

  const extension = file.name.split('.').pop(); // pega a extensão
  const fileName = `${cleanLabel}_${dateStr}.${extension}`;

  const uploaded = await uploadFileToOneDrive(
    accessToken,
    file,
    fileName,
    today.toISOString().slice(0, 10),
    formData.razaoSocial,
    "cadastro-fornecedor"
  );

  return uploaded?.url || null; // retorna somente a URL
};


      // Uploads específicos
      const fichaCadastralUrl = await uploadDoc(formData.fichaCadastral[0], "fichaCadastral");
      const comprovantecapacidadetecnicaUrl = await uploadDoc(formData.comprovantecapacidadetecnica[0], "comprovantecapacidadetecnica");
      const cartaoCnpjUrl = await uploadDoc(formData.cartaoCnpj[0], "cartaoCnpj");
      const certidaoNegativaUrl = await uploadDoc(formData.certidaoNegativa[0], "certidaoNegativa");
      const contratoSocialUrl = await uploadDoc(formData.contratoSocial[0], "contratoSocial");
      const alvaraUrl = await uploadDoc(formData.alvara[0], "alvara");      
      const outrosDocumentosUrl = await uploadDoc(formData.outrosDocumentos[0],"outrosDocumentos");


      // Upload de arquivos de produtos (array de URLs)
      const arquivosProdutosUrls: string[] = [];
      for (const arquivo of formData.arquivosProdutos) {
        const url = await uploadDoc(arquivo, "arquivosProdutos");
        if (url) arquivosProdutosUrls.push(url);
      }

      // Salvar fornecedor no Supabase
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
        outros_documentos_url: outrosDocumentosUrl
      }]);

      if (error) throw error;
      setLoading(false); // Inicia o loading
      alert("Fornecedor cadastrado com sucesso!");
      router.push("/dashboard/contratos-servicos/contratos/fornecedores");

    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar fornecedor.");
    }
  };



function formatCpfCnpj(value: string) {
  // Remove tudo que não é número
  const v = value.replace(/\D/g, "");

  if (v.length <= 11) {
    // Formato CPF: 000.000.000-00
    return v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  } else {
    // Formato CNPJ: 00.000.000/0000-00
    return v
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}

const handleChangecnpj = (e: React.ChangeEvent<HTMLInputElement>) => {
  const valorFormatado = formatCpfCnpj(e.target.value);

  // Atualiza o formData mantendo os outros campos
  setFormData((prev) => ({
    ...prev,
    cnpj: valorFormatado
  }));
};



  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
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
            <span className="w-full text-left">Cadastro de Fornecedor</span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 bg-[#f9fafb]">
        <Sidebar
          onNavClickAction={() => {}}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab="contratos"
        />

        <div className="p-10 w-full max-w-6xl mx-auto overflow-y-auto space-y-12">
          <Section title="Dados Gerais do Fornecedor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} placeholder="Razão Social" />
              <Input name="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} placeholder="Nome Fantasia" />
                  <input
      name="cnpj"
      value={formData.cnpj}
      onChange={handleChangecnpj}
      placeholder="CPF ou CNPJ"
      maxLength={18} // CPF 14 + pontuação, CNPJ 18
      className="border border-gray-300 rounded px-3 py-2"
    />
              <Input name="inscricao" value={formData.inscricao} onChange={handleChange} placeholder="Inscrição Estadual / Municipal" />
              <Select name="tipoFornecedor" value={formData.tipoFornecedor} onChange={handleChange} label="Tipo de Fornecedor" options={['Pessoa Jurídica', 'Pessoa Física']} />
              <Select name="naturezaJuridica" value={formData.naturezaJuridica} onChange={handleChange} label="Natureza Jurídica" options={['MEI', 'LTDA', 'EIRELI', 'ME']} />
            </div>
          </Section>

          <Section title="Endereço e Localização">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input name="telefonePrincipal" value={formData.telefonePrincipal} onChange={handleChange} placeholder="Telefone Fixo / Celular" />
              <Input name="responsavelComercial" value={formData.responsavelComercial} onChange={handleChange} placeholder="Responsável Comercial" />
              <Input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="E-mail" />
              <Input name="website" value={formData.website} onChange={handleChange} placeholder="Website" />              
              <Input name="responsavelTecnico" value={formData.responsavelTecnico} onChange={handleChange} placeholder="Responsável Técnico (se aplicável)" />
              <Input name="responsavelTecnico" value={formData.responsavelTecnicocontato} onChange={handleChange} placeholder="Contato Responsável (Telefone)" />
              <Input name="contato1Nome" value={formData.contato1Nome} onChange={handleChange} placeholder="Contato 1 - Nome" />
              <Input name="contato1Telefone" value={formData.contato1Telefone} onChange={handleChange} placeholder="Contato 1 - Telefone" />
              <Input name="contato2Telefone" value={formData.contato2Telefone} onChange={handleChange} placeholder="Contato 2 - Telefone" />
              <Input name="contato2Nome" value={formData.contato2Nome} onChange={handleChange} placeholder="Contato 2 - Nome" />
              
            </div>
          </Section>

          <Section title="Produtos / Serviços Ofertados">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select name="tipoProdutoServico" value={formData.tipoProdutoServico} onChange={handleChange} label="Tipo" options={['Produto', 'Serviço']} />
              <Input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Categoria" />
              <Input name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descrição" />
              <Input name="unidadeFornecimento" value={formData.unidadeFornecimento} onChange={handleChange} placeholder="Unidade de fornecimento" />
              <Input name="precoEstimado" value={formData.precoEstimado} onChange={handleChange} placeholder="Preço estimado (opcional)" />
              <Input name="prazoEntrega" value={formData.prazoEntrega} onChange={handleChange} placeholder="Prazo médio de entrega" />
              <FileUpload label="Catálogo ou Ficha Técnica (opcional)" name="arquivosProdutos" onChange={handleChange} multiple />
            </div>
          </Section>

          <Section title="Documentação">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload label="Comprovante de Capacidade Técnicas" name="comprovantecapacidadetecnica" onChange={handleChange}/>
        <FileUpload label="Ficha Cadastral do Fornecedor" name="fichaCadastral" onChange={handleChange} />
        <FileUpload label="Cartão CNPJ" name="cartaoCnpj" onChange={handleChange} />
        <FileUpload label="Certidões Negativas" name="certidaoNegativa" onChange={handleChange} />
        <FileUpload label="Contrato Social / Estatuto" name="contratoSocial" onChange={handleChange} />
        <FileUpload label="Alvará de Funcionamento" name="alvara" onChange={handleChange} />
      
      <FileUpload label="Outros Documentos" name="outrosDocumentos" onChange={handleChange} />
            </div>
          </Section>

          <div className="flex justify-end pt-6">
 <button
      onClick={handleSubmit}
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
        'Salvar Cadastro'
      )}
    </button>

            
          </div>
        </div>
      </div>
    </div>
  );
}

// === Componentes Reutilizáveis ===

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-semibold text-[#2b0000] mb-2">{title}</h2>
      <Separator className="mb-6" />
      {children}
    </div>
  );
}

function Input({ name, value, onChange, placeholder, type = 'text' }: any) {
  const isFilled = value && value.trim() !== '';

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 rounded-lg border text-sm shadow-sm placeholder:text-gray-400 focus:outline-none transition-all
        ${isFilled
          ? 'bg-green-50 border-green-400 focus:ring-2 focus:ring-green-500'
          : 'bg-white border-gray-300 focus:ring-2 focus:ring-[#4b0b0b]'
        }`}
    />
  );
}

function Select({ name, value, onChange, label, options }: any) {
  const isFilled = value && value.trim() !== '';

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 rounded-lg border text-sm shadow-sm focus:outline-none transition-all
        ${isFilled
          ? 'bg-green-50 border-green-400 focus:ring-2 focus:ring-green-500'
          : 'bg-white border-gray-300 focus:ring-2 focus:ring-[#4b0b0b]'
        }`}
    >
      <option value="">{label}</option>
      {options.map((opt: string, i: number) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function FileUpload({ label, name, onChange, multiple = false }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-[#2b0000] mb-1">{label}</label>
      <input
        type="file"
        name={name}
        onChange={onChange}
        multiple={multiple}
        className="w-full text-sm border border-gray-300 rounded-lg bg-white file:py-2 file:px-4 file:border-0 file:bg-[#4b0b0b] file:text-white file:rounded-md shadow-sm"
      />
    </div>
  );
}

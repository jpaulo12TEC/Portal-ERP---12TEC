'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, UploadCloud, Search } from 'lucide-react';
import Sidebar from '../../../../../components/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/superbase'
import { useUser } from '@/components/UserContext';


type Orcamento = {
  id: string;
  titulo: string;
  descricao: string;
  Fornecedorescolhido: string;
  motivacaodaescolha: string;
  orcamento_escolhido?: number; // 1 a 6
  orcamento1?: string;
  orcamento2?: string;
  orcamento3?: string;
  orcamento4?: string;
  orcamento5?: string;
  orcamento6?: string;
  linkOrcamento?:string
  // outras colunas que tiver na tabela
};



export default function IniciarContrato() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Estados principais do fornecedor e contrato
  const [cnpj, setCnpj] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState("");
  const [orcamentoResumo, setOrcamentoResumo] = useState<Orcamento | null>(null);
  const [fornecedorInfo, setFornecedorInfo] = useState<{
    nome?: string;
    endereco?: string;
    contato?: string;
    numeroContato?: string;
    statusContrato?: string;
    nome_social?:string;
    tipo?:string;
    naturezajuridica?:string;
    categoria?:string;
    email?:string;
    unidade_fornecimento?:string;
    servicos?: { id: string; nome: string; link?: string }[];
  }>({ servicos: [] });

const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);



useEffect(() => {
  const fetchOrcamentos = async () => {
    const { data, error } = await supabase
      .from('solicitacoes_contratos')
      .select('*')
      .eq('status', 'fornecedor selecionado') // 👈 filtra pelo status
      .order('data_solicitacao', { ascending: false });

    if (error) {
      console.error("Erro ao buscar orçamentos:", error.message);
    } else {
      console.log("👉 Orçamentos recebidos:", data);
      setOrcamentos(data || []);
    }
  };

  fetchOrcamentos();
}, []);




const handleOrcamentoChange = (id: string) => {
  setOrcamentoSelecionado(id);

  const selecionado = orcamentos.find((o) => o.id === id);

  if (selecionado) {
const numero = selecionado.orcamento_escolhido; // ex: 3
const key = `orcamento${numero}` as keyof Orcamento;
const link = selecionado[key] as string | undefined; // tipo opcional

    setOrcamentoResumo({
      ...selecionado,
      linkOrcamento: link, // 👈 adiciona já o link pronto
    });
  } else {
    setOrcamentoResumo(null);
  }
};















  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");
  const [objetoContrato, setObjetoContrato] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [pagamentoTipo, setPagamentoTipo] = useState('fixo'); // 'fixo' ou 'nota'
  const [periodicidade, setPeriodicidade] = useState('');
  const [proximoPagamento, setProximoPagamento] = useState('');
  const [diasAposNota, setDiasAposNota] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [semDataEncerramento, setSemDataEncerramento] = useState(false);
  const [controle, setControle] = useState('');
  const [diasControle, setDiasControle] = useState<string[]>([]);
  const [necessitaNR, setNecessitaNR] = useState(false);
  const [arquivoContrato, setArquivoContrato] = useState<File | null>(null);
  const [arquivosDocumentos, setArquivosDocumentos] = useState<(File | null)[]>([null, null, null]);
  const [descricaoDocs, setDescricaoDocs] = useState(['', '', '']);
  const [tipoContrato, setTipoContrato] = useState('');
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('contratos');

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];











useEffect(() => {
  const fetchFornecedor = async () => {
    if (cnpj.length < 14) {
      setFornecedorInfo({ servicos: [] });
      setServicoSelecionado('');
      return;
    }

    try {
      // 1️⃣ Busca o fornecedor pelo CNPJ
      const { data: fornecedorData, error: fornecedorError } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('cnpj', cnpj)
        .maybeSingle();

      if (fornecedorError) throw fornecedorError;

      if (!fornecedorData) {
        setFornecedorInfo({ servicos: [] });
        setServicoSelecionado('');
        return;
      }

      // 2️⃣ Busca os serviços do fornecedor
      const { data: servicosData, error: servicosError } = await supabase
        .from('servicos_cadastrados')
        .select('id, descricao_servico, categoria, preferencial') // se não tiver link, pode criar um campo calculado ou URL
        .eq('fornecedor_id', fornecedorData.id);


      if (servicosError) throw servicosError;

      // 3️⃣ Formata os serviços
      const servicosFormatados = (servicosData || []).map((s: any) => ({
        id: s.id.toString(),
        nome: s.descricao_servico,
      }));


      // 4️⃣ Atualiza estado
      setFornecedorInfo({
        nome: fornecedorData.nome_fantasia,
        nome_social: fornecedorData.razao_social,
        tipo: fornecedorData.tipo_fornecedor,
        naturezajuridica:fornecedorData.natureza_juridica,
        categoria: fornecedorData.categoria,
        unidade_fornecimento: fornecedorData.unidade_fornecimento,
        email: fornecedorData.email,
        endereco: `${fornecedorData.endereco}, ${fornecedorData.numero || ''}, ${fornecedorData.bairro}, ${fornecedorData.cidade_uf}`,
        contato: fornecedorData.responsavel_comercial || '',
        numeroContato: fornecedorData.telefone_principal || '',
        statusContrato: 'Ativo em contrato atual', // você pode buscar status real se tiver coluna
        servicos: servicosFormatados,
      });

      setServicoSelecionado('');
    } catch (err) {
      console.error('Erro ao buscar fornecedor:', err);
      setFornecedorInfo({ servicos: [] });
      setServicoSelecionado('');
    }
  };

  fetchFornecedor();
}, [cnpj]);
















  const toggleDia = (dia: string) => {
    setDiasControle((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };


























  const handleArquivoContratoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setArquivoContrato(e.target.files[0]);
  };










  const handleArquivoDocChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newArquivos = [...arquivosDocumentos];
      newArquivos[index] = e.target.files[0];
      setArquivosDocumentos(newArquivos);
    }
  };








  const handleDescricaoDocChange = (index: number, value: string) => {
    const newDescricoes = [...descricaoDocs];
    newDescricoes[index] = value;
    setDescricaoDocs(newDescricoes);
  };


const servicoSelecionadoNome = fornecedorInfo.servicos?.find(
  (s: any) => s.id === servicoSelecionado
)?.nome;




async function handleSubmit() {
  setLoading(true);
  console.log("🚀 Iniciando handleSubmit...");

  try {
    // Atualiza status da solicitação
    const { error: errorStatus } = await supabase
      .from('solicitacoes_contratos')
      .update({ status: 'contrato em elaboração' })
      .eq('id', orcamentoSelecionado);

    if (errorStatus) {
      alert('Erro ao atualizar status da solicitação.');
      console.error(errorStatus);
      return;
    }

    console.log('Status atualizado para "contrato em elaboração".');

    // Pega usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }

    if (!fornecedorInfo?.nome) {
      alert("Fornecedor não selecionado ou inválido.");
      return;
    }

    if (!arquivosDocumentos.some(a => a)) {
      alert("Nenhum documento selecionado para envio.");
      return;
    }

    const urls: (string | null)[] = [];
    const documentos: Record<string, any> = {};
    const hoje = new Date();
    const dataHoje = hoje.toISOString().slice(0, 10);

    // Envia documentos via API backend
    for (let i = 0; i < arquivosDocumentos.length; i++) {
      const arquivo = arquivosDocumentos[i];
      const descricao = descricaoDocs[i] || 'DOCUMENTO';

      if (!arquivo) continue;

      const fileName = `${descricao.toUpperCase().replace(/[\\/:*?"<>|]/g, '_')}${arquivo.name.slice(arquivo.name.lastIndexOf('.'))}`;
      const fornecedorSanitizado = fornecedorInfo.nome.toUpperCase().replace(/[\\/:*?"<>|]/g, '_');

      // Chamada à rota API backend
      const formDataAPI = new FormData();
      formDataAPI.append("file", arquivo);
      formDataAPI.append("fileName", fileName);
      formDataAPI.append("dataCompra", dataHoje);
      formDataAPI.append("fornecedor", fornecedorSanitizado);
      formDataAPI.append("tipo", "contratos");
      formDataAPI.append("caminho", servicoSelecionadoNome || "");

      const res = await fetch("/api/onedrive/upload", { method: "POST", body: formDataAPI });
      const data = await res.json();

      const url = data.file?.url || null;
      urls[i] = url;
      documentos[`documento${i + 1}`] = url;
      documentos[`documento${i + 1}nome`] = descricao;
    }

    // Envio do contrato principal
    let urld: string | null = null;
    if (arquivoContrato) {
      const fileNameContrato = `Contrato${arquivoContrato.name.slice(arquivoContrato.name.lastIndexOf('.'))}`;
      const fornecedorSanitizado = fornecedorInfo.nome.toUpperCase().replace(/[\\/:*?"<>|]/g, '_');

      const formDataContrato = new FormData();
      formDataContrato.append("file", arquivoContrato);
      formDataContrato.append("fileName", fileNameContrato);
      formDataContrato.append("dataCompra", dataHoje);
      formDataContrato.append("fornecedor", fornecedorSanitizado);
      formDataContrato.append("tipo", "contratos");
      formDataContrato.append("caminho", servicoSelecionadoNome || "");

      const resContrato = await fetch("/api/onedrive/upload", { method: "POST", body: formDataContrato });
      const dataContrato = await resContrato.json();
      urld = dataContrato.file?.url || null;
      if (!urld) console.warn("Não foi possível enviar o contrato");
    }

    // Monta o objeto do contrato
    const novoContrato = {
      id_criador: user.id,
      created_at: new Date().toISOString(),
      status: 'Em andamento',
      cotacao: orcamentoSelecionado,
      cnpj_fornecedor: cnpj,
      objeto_contrato: objetoContrato,
      valor_unitario: valorUnitario,
      unidade_medida: unidadeMedida,
      tipo_pagamento: pagamentoTipo,
      diasaposemissao: diasAposNota,
      periodicidade,
      proximopagamento: proximoPagamento ? new Date(proximoPagamento).toISOString().slice(0, 10) : null,
      dataencerramento: dataEncerramento ? new Date(dataEncerramento).toISOString().slice(0, 10) : null,
      controle,
      diasdasemanacontrole: diasControle,
      nrs: necessitaNR,
      contrato: urld,
      tipodecontrole: tipoContrato,
      ...documentos,
    };

    // Salva no Supabase
    const { data, error } = await supabase.from('contratos_servicos').insert([novoContrato]);
    if (error) {
      console.error('Erro ao salvar contrato no Supabase:', error);
      alert('Erro ao salvar contrato. Verifique o console.');
      return;
    }

    alert('Contrato salvo com sucesso!');
    router.push('/dashboard/contratos-servicos/contratos/elaboracao');

  } catch (err) {
    console.error("Erro geral no envio do contrato:", err);
    alert('Ocorreu um erro ao enviar o contrato. Verifique o console.');
  } finally {
    setLoading(false);
  }
}





function formatCpfCnpj(value: string) {
  const v = value.replace(/\D/g, ""); // remove tudo que não é número

  if (v.length <= 11) {
    // CPF: 000.000.000-00
    return v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  } else {
    // CNPJ: 00.000.000/0000-00
    return v
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}










  return (
    <div
      className={`flex flex-col h-screen ${
        menuActive ? 'ml-[300px]' : 'ml-[80px]'
      } ${isModalOpen ? 'backdrop-blur-lg' : ''}`}
    >
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
          onNavClickAction={(tab) => {
            setActiveTab(tab);
            router.push(`/dashboard/${tab}`);
          }}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        

        <main className="p-6  w-4/5 mx-auto overflow-auto">
          <h1 className="text-2xl font-bold text-[#5a0d0d] mb-6">Iniciar Novo Contrato</h1>
          
          <form
  onSubmit={async (e) => {
    e.preventDefault(); // ⬅️ importante para evitar refresh da página
    console.log("🔹 Botão de enviar clicado!");
    await handleSubmit(); // chama sua função
  }}
  className="bg-white shadow-lg rounded-2xl p-6 space-y-8"
>


          <div >
  <label className="block font-medium text-sm text-gray-700 mb-2">
    Selecionar Orçamento
  </label>
 <div className="flex flex-col md:flex-row gap-4">
        <select
          value={orcamentoSelecionado}
          onChange={(e) => handleOrcamentoChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-[#5a0d0d] outline-none"
        >
          <option value="">-- Selecione --</option>
          {orcamentos.map((orc) => (
            <option key={orc.id} value={orc.id}>
              {orc.titulo}
            </option>
          ))}
        </select>

{orcamentoResumo && (
  <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4">
    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
      Resumo do Orçamento
    </h3>

    <div className="space-y-2 text-gray-700">
      <p>
        <span className="font-medium text-gray-900">Descrição:</span>{" "}
        {orcamentoResumo.descricao}
      </p>

      <p>
        <span className="font-medium text-gray-900">Fornecedor escolhido:</span>{" "}
        {orcamentoResumo.Fornecedorescolhido}
      </p>

      <p>
        <span className="font-medium text-gray-900">Motivação da escolha:</span>{" "}
        {orcamentoResumo.motivacaodaescolha}
      </p>

      {orcamentoResumo.linkOrcamento && (
        <p>
          <span className="font-medium text-gray-900">Arquivo escolhido:</span>{" "}
          <a
            href={orcamentoResumo.linkOrcamento}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Ver orçamento
          </a>
        </p>
      )}
    </div>
  </div>
)}
      </div>
</div>


            {/* CNPJ do fornecedor */}
            
            {/* CNPJ do fornecedor */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
  {/* CNPJ ou CPF */}
  <div>
    <label className="block font-medium text-sm text-gray-700">
      CNPJ ou CPF do Fornecedor
    </label>
    <input
      type="text"
      value={cnpj}
      onChange={(e) => setCnpj(formatCpfCnpj(e.target.value))}
      placeholder="00.000.000/0000-00"
      className="w-full border rounded px-3 py-2"
      maxLength={18} // Limite para CPF ou CNPJ com pontuação
      required
    />
  </div>

  {/* Nome do Fornecedor */}
  <div>
    <label className="block font-medium text-sm text-gray-700">Nome do Fornecedor</label>
    <input
      type="text"
      value={fornecedorInfo.nome || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
      placeholder="Preencha o CNPJ"
    />
  </div>

  {/* Status do Fornecedor */}
  <div>
    <label className="block font-medium text-sm text-gray-700">Status do Fornecedor</label>
    <input
      type="text"
      value={fornecedorInfo.statusContrato || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
</div>

{/* Tipo, Natureza Jurídica e Categoria */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
  <div>
    <label className="block font-medium text-sm text-gray-700">Tipo do Fornecedor</label>
    <input
      type="text"
      value={fornecedorInfo.tipo || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>

  <div>
    <label className="block font-medium text-sm text-gray-700">Natureza Jurídica</label>
    <input
      type="text"
      value={fornecedorInfo.naturezajuridica || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>

  <div>
    <label className="block font-medium text-sm text-gray-700">Categoria</label>
    <input
      type="text"
      value={fornecedorInfo.categoria || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
</div>

{/* Unidade de fornecimento e endereço */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div>
    <label className="block font-medium text-sm text-gray-700">Unidade de Fornecimento</label>
    <input
      type="text"
      value={fornecedorInfo.unidade_fornecimento || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
  <div>
    <label className="block font-medium text-sm text-gray-700">Endereço</label>
    <input
      type="text"
      value={fornecedorInfo.endereco || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
</div>

{/* Contato e número */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div>
    <label className="block font-medium text-sm text-gray-700">Contato</label>
    <input
      type="text"
      value={fornecedorInfo.contato || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
  <div>
    <label className="block font-medium text-sm text-gray-700">Número do Contato</label>
    <input
      type="text"
      value={fornecedorInfo.numeroContato || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
    <div>
    <label className="block font-medium text-sm text-gray-700">E-mail</label>
    <input
      type="text"
      value={fornecedorInfo.email || ''}
      disabled
      className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
    />
  </div>
  
</div>

{/* Seleção de serviço */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
  <div>
    <label className="block font-medium text-sm text-gray-700">Serviço do Fornecedor</label>
    <select
      value={servicoSelecionado}
      onChange={(e) => setServicoSelecionado(e.target.value)}
      className="w-full border rounded px-3 py-2"
      disabled={!fornecedorInfo.servicos || fornecedorInfo.servicos.length === 0}
    >
      <option value="">Selecione um serviço</option>
      {fornecedorInfo.servicos?.map((servico) => (
        <option key={servico.id} value={servico.id}>
          {servico.nome}
        </option>
      ))}
    </select>
  </div>
  <div />
            </div>

            {/* Objeto do contrato */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Objeto do Contrato</label>
              <textarea
                value={objetoContrato}
                onChange={(e) => setObjetoContrato(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                required
              />
            </div>

            {/* Valor Unitário e Unidade de Medida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-sm text-gray-700">Valor Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-sm text-gray-700">Unidade de Medida</label>
                <input
                  type="text"
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: hora, m², unidade..."
                  required
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
                    checked={pagamentoTipo === 'fixo'}
                    onChange={() => setPagamentoTipo('fixo')}
                  />
                  <span>Fixo por período</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pagamentoTipo"
                    value="nota"
                    checked={pagamentoTipo === 'nota'}
                    onChange={() => setPagamentoTipo('nota')}
                  />
                  <span>Após emissão de Nota Fiscal</span>
                </label>
              </div>
            </div>

            {/* Campos dinâmicos pagamento */}
            {pagamentoTipo === 'fixo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-sm text-gray-700">Periodicidade de Pagamento</label>
                  <select
                    value={periodicidade}
                    onChange={(e) => setPeriodicidade(e.target.value)}
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
                <div>
                  <label className="block font-medium text-sm text-gray-700">Próximo Pagamento</label>
                  <input
                    type="date"
                    value={proximoPagamento}
                    onChange={(e) => setProximoPagamento(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
            )}

            {pagamentoTipo === 'nota' && (
              <div>
                <label className="block font-medium text-sm text-gray-700">
                  Dias para pagamento após emissão da Nota Fiscal
                </label>
                <input
                  type="number"
                  min={0}
                  value={diasAposNota}
                  onChange={(e) => setDiasAposNota(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            )}

            {/* Data de Encerramento */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Data de Encerramento</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={semDataEncerramento ? '' : dataEncerramento}
                  onChange={(e) => setDataEncerramento(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={semDataEncerramento}
                />
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={semDataEncerramento}
                    onChange={(e) => setSemDataEncerramento(e.target.checked)}
                  />
                  <span>Sem data de encerramento</span>
                </label>
              </div>
            </div>

            {/* Controle */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Controle</label>
              <select
                value={controle}
                onChange={(e) => setControle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
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
            {controle === 'Definir dias da semana' && (
              <div className="flex flex-wrap gap-2">
                {diasSemana.map((dia) => (
                  <label key={dia} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={diasControle.includes(dia)}
                      onChange={() => toggleDia(dia)}
                    />
                    <span>{dia}</span>
                  </label>
                ))}
              </div>
            )}

            {/* NR's necessárias */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={necessitaNR}
                  onChange={(e) => setNecessitaNR(e.target.checked)}
                />
                <span>Será necessário NR(s) para realizar o serviço?</span>
              </label>
            </div>

            {/* Anexos */}
            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">Anexar Contrato</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border">
                  <UploadCloud size={18} />
                  <span className="text-sm">Selecionar arquivo</span>
                  <input type="file" onChange={handleArquivoContratoChange} className="hidden" />
                </label>
                {arquivoContrato && <span className="text-sm text-gray-600">{arquivoContrato.name}</span>}
              </div>
            </div>

            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">
                Anexar Documentos Opcionais (até 3)
              </label>
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
<label
  className="flex items-center gap-3 cursor-pointer bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded border text-xs select-none"
  
>
  <UploadCloud size={19} />
  <span className="whitespace-nowrap">Arquivo {idx + 1}</span>
  <input
    type="file"
    onChange={(e) => handleArquivoDocChange(idx, e)}
    className="hidden"
  />
</label>
                  <input
                    type="text"
                    placeholder="Descrição do documento"
                    value={descricaoDocs[idx]}
                    onChange={(e) => handleDescricaoDocChange(idx, e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  {arquivosDocumentos[idx] && (
                    <span className="text-sm text-gray-600">{arquivosDocumentos[idx]?.name}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Tipo de contrato */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Tipo de Contrato</label>
              <select
                value={tipoContrato}
                onChange={(e) => setTipoContrato(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
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

 <button
      type="submit"
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
          </form>
        </main>
      </div>
    </div>
  );
}

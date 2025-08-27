'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, UploadCloud } from 'lucide-react';
import { getAccessToken } from "@/lib/auth";
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { supabase } from '../../../../../../lib/superbase';

export default function CadastroServicos() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('contratos');
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Campos do formulário
  const [fornecedorId, setFornecedorId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [areaAtuacao, setAreaAtuacao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [prazoAtendimento, setPrazoAtendimento] = useState('');
  const [tipoCobranca, setTipoCobranca] = useState('');
  const [preferencial, setPreferencial] = useState(false);

  // Buscar fornecedores
  useEffect(() => {
    const fetchFornecedores = async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome_fantasia, razao_social') // 👈 adiciona aqui
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar fornecedores:', error);
      } else {
        setFornecedores(data || []);
      }
    };
    fetchFornecedores();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
    }
  };





  const handleSubmit = async () => {
    // Validação antes do insert
if (
  !descricao ||
  !categoria ||
  !areaAtuacao ||
  !unidadeMedida ||
  !valorUnitario ||
  !prazoAtendimento ||
  !tipoCobranca ||
  !file
) {
  alert("Por favor, preencha todos os campos obrigatórios antes de enviar.");
  setLoading(false);
  return; // interrompe a execução
}


    setLoading(true); // Inicia o loading


        const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }


    try {

            const accessToken = await getAccessToken();

          if (!accessToken) {
  console.error("Token de acesso não encontrado.");
  alert("Token de acesso não encontrado.");
  return;
}



      setLoading(true);
      let fileUrl = null;

      // Upload do arquivo para OneDrive
      if (file) {
       
// Pega o fornecedor selecionado
const fornecedorSelecionado = fornecedores.find(f => f.id === fornecedorId);

// Define o nome da pasta (se tiver fornecedor, usa a razão social, senão "sem fornecedor")
const nomeFornecedor = fornecedorSelecionado ? fornecedorSelecionado.razao_social : "sem fornecedor";

// Extrai extensão do arquivo
const extensao = file.name.split('.').pop();

// Cria data no formato YYYYMMDD
const hoje = new Date();
const dataFormatada = `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2,'0')}${String(hoje.getDate()).padStart(2,'0')}`;

// Monta o nome do arquivo
const nomeArquivo = `${dataFormatada}_orcamento_${descricao.replace(/\s+/g, '_')}.${extensao}`;


// Faz upload
fileUrl = await uploadFileToOneDrive(
  accessToken,
  file,
  nomeArquivo,
  hoje.toISOString().slice(0, 10),       // dataCompra
  nomeFornecedor,      // fornecedor
  "cadastro-fornecedor-servico",
  descricao
);


      }

      // Inserir no Supabase
      const { error } = await supabase.from('servicos_cadastrados').insert([{
        fornecedor_id: fornecedorId,
        descricao_servico: descricao,
        categoria: categoria,
        area_atuacao: areaAtuacao,
        unidade_medida: unidadeMedida,
        valor_unitario: valorUnitario,
        prazo_atendimento_dias: prazoAtendimento,
        tipo_cobranca: tipoCobranca,
        preferencial: preferencial,
        arquivo_orcamento: fileUrl,
        user_id:user.id
      }]);

      if (error) {
        console.error('Erro ao cadastrar serviço:', error);
      } else {
        alert('Serviço cadastrado com sucesso!');
        router.push('/dashboard/contratos-servicos/contratos/fornecedores');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Cadastro de Serviços do Fornecedor
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar serviço..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={(tab) => { setActiveTab(tab); router.push(`/dashboard/${tab}`); }}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main className="p-6 w-full max-w-[1200px] mx-auto">
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold text-[#5a0d0d]">Novo Serviço</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                  <option value="">Selecione um fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome_fantasia}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição do Serviço</label>
                <input value={descricao} onChange={e => setDescricao(e.target.value)} type="text" className="mt-1 block w-full p-2 border rounded-md" placeholder="Ex: Locação de guindaste" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                  <option value="">Selecione...</option>
                  <option>Manutenção</option>
                  <option>Locação</option>
                  <option>Consultoria</option>
                  <option>Serviço Especializado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Área de Atuação</label>
                <select value={areaAtuacao} onChange={e => setAreaAtuacao(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                  <option value="">Selecione...</option>
                  <option>Civil</option>
                  <option>Mecânica</option>
                  <option>Elétrica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                <input value={unidadeMedida} onChange={e => setUnidadeMedida(e.target.value)} type="text" className="mt-1 block w-full p-2 border rounded-md" placeholder="Hora / Diária / Mês" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Unitário (R$)</label>
                <input value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} type="number" className="mt-1 block w-full p-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prazo de Atendimento (dias)</label>
                <input value={prazoAtendimento} onChange={e => setPrazoAtendimento(e.target.value)} type="number" className="mt-1 block w-full p-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Cobrança</label>
                <select value={tipoCobranca} onChange={e => setTipoCobranca(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
                  <option value="">Selecione...</option>
                  <option>Hora</option>
                  <option>Diária</option>
                  <option>Por demanda</option>
                  <option>Contrato fechado</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={preferencial} onChange={e => setPreferencial(e.target.checked)} className="form-checkbox" /> Fornecedor Preferencial
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Orçamento</label>
                <input type="file" onChange={handleFileChange} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
        'Salvar Serviço'
      )}
    </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

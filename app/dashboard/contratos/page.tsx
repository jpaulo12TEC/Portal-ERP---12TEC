'use client'
import { useState } from 'react';
import Sidebar from "../../../components/Sidebar";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Textarea, Select } from '../../../components/FormularioContratos';
import { supabase } from '../../../lib/superbase'
import ContratoLista from '@/components/ContratoLista'
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado

import axios from 'axios'; // Se não usa ainda, instale: npm install axios


export default function Page() {
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para controle de carregamento

  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [contratos, setContratos] = useState([]);

  const handleCnpjCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
  
    if (value.length <= 11) {
      // Formatar como CPF: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // Formatar como CNPJ: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
  
    setNovoContrato(prev => ({ ...prev, cnpjCpf: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    let newValue: string | boolean = value;
  
    // Se for checkbox, pega checked
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      newValue = e.target.checked;
    }
  
    setNovoContrato((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const [novoContrato, setNovoContrato] = useState({
    nome: '',
    empresa: '',
    data: '',
    nomeContrato: '',
    cnpjCpf: '',
    objetoContrato:'',
    clausulasAdicionais: '',
    responsabilidades: '',
    termoRescisao: '',
    tipoContrato: '',
    dataFinal: '',
    valorParcela: '',
    proximoVencimento:'',
    periodicidade: '',
    formaPagamento:'',
    dadosBancarios:'',
  });

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      setCurrentPage(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };





  const gerarContratoIA = async () => {
    setLoading(true);
    try {
      // 1. Salva no Supabase
      const { data, error } = await supabase
        .from('contratos_definicoes')
        .insert([
          {
            nomedocontrato: novoContrato.nomeContrato,
            cnpjcpf: novoContrato.cnpjCpf,
            nomedaempresa: novoContrato.empresa,
            objetodocontrato: novoContrato.objetoContrato,
            clausulasadicionais: novoContrato.clausulasAdicionais,
            responsabilidade: novoContrato.responsabilidades,
            termo: novoContrato.termoRescisao,
            tipo: novoContrato.tipoContrato,
            datafinal: novoContrato.dataFinal ? novoContrato.dataFinal : null,
            parcela: novoContrato.valorParcela ? parseFloat(novoContrato.valorParcela) : null,
            procimovencimento: novoContrato.proximoVencimento,
            pediodicidade: novoContrato.periodicidade,
            formadepagamento: novoContrato.formaPagamento,
            dadosbancarios: novoContrato.dadosBancarios,
            versao: 'inicial'
          }
        ])
        .select('id')
        .single();
  
      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        alert('Erro ao salvar o contrato no banco de dados.');
        return;
      }
  
      const contratoId = data.id;
      const nomeArquivo = `${contratoId}_contrato.docx`;
      console.log('Contrato salvo com ID:', contratoId);
  
      // 2. Gera o arquivo com a API
      const response = await axios.post('/api/chatgptcontrato', { novoContrato }, {
        responseType: 'blob',
      });
  
      // 3. Converte blob em File
      const arquivoContrato = new File([response.data], nomeArquivo, {
        type: response.data.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
  
      // 4. Envia o arquivo para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contratos-gerados')
        .upload(`contratos/${nomeArquivo}`, arquivoContrato, {
          upsert: true,
        });
  
      if (uploadError) {
        console.error('Erro ao enviar para o Storage:', uploadError);
        alert('Erro ao enviar o contrato para o Storage.');
        return;
      }
  
      console.log('Arquivo enviado ao Storage:', uploadData);
  
      // 5. Atualiza a coluna documento na tabela
      const { error: updateError } = await supabase
        .from('contratos_definicoes')
        .update({ documento: nomeArquivo })
        .eq('id', contratoId);
  
      if (updateError) {
        console.error('Erro ao atualizar a coluna documento:', updateError);
        alert('Erro ao salvar o nome do arquivo na tabela.');
        return;
      }
  
      // 6. Gera uma URL temporária segura
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('contratos-gerados')
        .createSignedUrl(`contratos/${nomeArquivo}`, 60 * 60); // 1 hora
  
      if (signedUrlError) {
        console.error('Erro ao gerar URL temporária:', signedUrlError);
        alert('Erro ao gerar link do contrato.');
        return;
      }
  
      const linkTemporario = signedUrlData.signedUrl;
  
      // 7. Gera a mensagem com link
      const mensagem = `
  📑 *Contrato Gerado*
  
  👤 *Nome da empresa:* ${novoContrato.empresa}
  📄 *Contrato:* ${novoContrato.nomeContrato}
  📅 *Vencimento:* ${novoContrato.proximoVencimento}
  💰 *Valor da Parcela:* ${novoContrato.valorParcela ? novoContrato.valorParcela : 'Não especificado'}
  📜 *Objeto do Contrato:* ${novoContrato.objetoContrato || 'Não especificado'}
  
  📥 *Acesse o contrato:* ${linkTemporario}
      `;
  
      // 8. Envia a mensagem via WhatsApp para vários números
      const numerosDestino = ['557998870125', '5511976113088', '557999885900']; // Adicione mais números se quiser
  
      for (const numero of numerosDestino) {
        await enviarMensagemWhatsApp({ numero, mensagem });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // evita bloqueios
      }
  
      alert('Contrato gerado, enviado ao Storage e compartilhado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      alert('Erro ao gerar contrato. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para enviar mensagem via WhatsApp
  async function enviarMensagemWhatsApp({ numero, mensagem }: { numero: string; mensagem: string }) {
    try {
      const resposta = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numero, mensagem }),
      });
  
      const dados = await resposta.json().catch(() => ({}));
  
      if (resposta.ok) {
        console.log(`Mensagem enviada com sucesso para ${numero}:`, dados);
      } else {
        console.warn(`Erro ao enviar mensagem para ${numero}:`, dados?.error || 'Erro desconhecido');
      }
    } catch (erro) {
      console.warn(`Servidor de WhatsApp não está acessível para o número ${numero}. Ignorando...`);
    }
  }
  



  return (
<div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-lg" : ""}`}>
 {/* Topbar */}
<div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
  <div className="flex space-x-4  w-full h-[40px] items-center">
    
    {/* Botão de retorno estilizado */}
    <button
      onClick={() => window.history.back()}
      className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
    >
      <ArrowLeft size={20} />
      <span className="text-sm font-medium">Voltar</span>
    </button>

    <div className="px-3 py-3 h-[50px]">
      <button className="w-full text-left hover:text-gray-300">
        Criação e Gerenciamento de contratos
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

      {/* Conteúdo principal com Sidebar + Conteúdo da Página */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        {/* Conteúdo da Página */}
        <div className="p-6 w-full">

          
          <h1 className="text-2xl font-bold mb-4">Criação e Gerenciamento de Contratos</h1>
          
          <button
            onClick={() => setIsModalOpen(true)} // Abre o modal
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Adicionar Contrato
          </button>
          
          <ContratoLista /> 
          
        </div>
      </div>

     {/* Modal para adicionar contrato */}
     {isModalOpen && (

<div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="backdrop-blur-sm absolute inset-0 bg-black opacity-80"></div>
    
    {/* Fundo escuro com blur */}
    
    {/* Modal */}
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 relative">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-indigo-700">Adicionar Novo Contrato</h2>
        <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <Input label="Nome do Contrato" name="nomeContrato" value={novoContrato.nomeContrato} onChange={handleChange} />
        <Input label="CNPJ ou CPF" name="cnpjCpf" value={novoContrato.cnpjCpf} onChange={handleCnpjCpfChange} />
        <Input label="Nome da Empresa" name="empresa" value={novoContrato.empresa} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 gap-1 mb-2">
        <Textarea label="Objeto do Contrato" name="objetoContrato" value={novoContrato.objetoContrato} onChange={handleChange} />
        <Textarea label="Cláusulas Adicionais" name="clausulasAdicionais" value={novoContrato.clausulasAdicionais} onChange={handleChange} />
        <Textarea label="Responsabilidade das Partes" name="responsabilidades" value={novoContrato.responsabilidades} onChange={handleChange} />
        <Textarea label="Termo de Rescisão" name="termoRescisao" value={novoContrato.termoRescisao} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        <Select label="Tipo de Contrato" name="tipoContrato" value={novoContrato.tipoContrato} onChange={handleChange} options={[
          { value: "", label: "Selecione" },
          { value: "determinado", label: "Tempo Determinado" },
          { value: "indeterminado", label: "Tempo Indeterminado" }
        ]} />

        {novoContrato.tipoContrato === 'determinado' && (
          <Input type="date" label="Data Final" name="dataFinal" value={novoContrato.dataFinal} onChange={handleChange} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Input label="Valor da Parcela" name="valorParcela" value={novoContrato.valorParcela} onChange={handleChange} type="number" />
        <Input type="date" label="Próximo Vencimento" name="proximoVencimento" value={novoContrato.proximoVencimento} onChange={handleChange} />
        <Select label="Periodicidade" name="periodicidade" value={novoContrato.periodicidade} onChange={handleChange} options={[
          { value: "", label: "Selecione" },
          { value: "unico", label: "Único" },
          { value: "diario", label: "Diário" },
          { value: "semanal", label: "Semanal" },
          { value: "quinzenal", label: "Quinzenal" },
          { value: "mensal", label: "Mensal" },
          { value: "bimestral", label: "Bimestral" },
          { value: "trimestral", label: "Trimestral" },
          { value: "semestral", label: "Semestral" },
          { value: "anual", label: "Anual" }
        ]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Select label="Forma de Pagamento" name="formaPagamento" value={novoContrato.formaPagamento} onChange={handleChange} options={[
          { value: "", label: "Selecione" },
          { value: "transferencia", label: "Transferência Bancária" },
          { value: "pix", label: "PIX" },
          { value: "boleto", label: "Boleto" },
          { value: "especie", label: "Em Espécie" }
        ]} />
        {(novoContrato.formaPagamento === 'transferencia' ||
          novoContrato.formaPagamento === 'pix' ||
          novoContrato.formaPagamento === 'boleto') && (
          <Input label="Dados Bancários" name="dadosBancarios" value={novoContrato.dadosBancarios} onChange={handleChange} />
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
      <button
        onClick={gerarContratoIA}
        disabled={loading} // Desabilita o botão durante o carregamento
        className={`bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span>Carregando...</span> // Exibe o texto ou ícone de carregamento
        ) : (
          'Gerar Contrato'
        )}
      </button>

      <button
        onClick={() => setIsModalOpen(false)}
        className="bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-500 transition duration-300"
      >
        Cancelar
      </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

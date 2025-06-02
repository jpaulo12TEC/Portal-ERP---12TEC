"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { supabase } from '../../../lib/superbase';
import { useUser } from '@/components/UserContext';
import { SendHorizontal } from "lucide-react";
import PedidosList from '@/components/PedidosList'
import { ArrowLeft } from "lucide-react"; // Certifique-se de ter o ícone importado


type Pedido = {
  id: number
  descricao: string
  status: string
  data_pedido: string
  orcamentos: string
}


export default function Dashboard() {

  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState("");
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMateriaisModalOpen, setIsMateriaisModalOpen] = useState(false);
  const [materialCount, setMaterialCount] = useState(0);
  const [isVisualizarModalOpen, setIsVisualizarModalOpen] = useState(false);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [isVisualizarPedidoModalOpen, setIsVisualizarPedidoModalOpen] = useState(false);
  const [orcamentos, setOrcamentos] = useState<File[]>([]);
  const [isOrcamentosModalOpen, setIsOrcamentosModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    solicitante: nome,
    dataPedido: "",
    observacao: "",
    nomedo_pedido:"",
  });

  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    setFormData(prev => ({ ...prev, dataPedido: formattedDate }));
  }, []);



  const handleMaterialAdd = () => {
    const nome = (document.getElementById("material-nome") as HTMLInputElement)?.value;
    const quantidade = (document.getElementById("material-quantidade") as HTMLInputElement)?.value;
    const unidade = (document.getElementById("material-unidade") as HTMLInputElement)?.value;
    if (nome && quantidade && unidade) {
      setMateriais([...materiais, { nome, quantidade, unidade }]);
      setMaterialCount(materialCount + 1);
      setIsMateriaisModalOpen(false);
    } else {
      alert("Preencha nome, quantidade e unidade.");
    }
  };

  const handleDeleteMaterial = (index: number) => {
    const newList = materiais.filter((_, i) => i !== index);
    setMateriais(newList);
    setMaterialCount(newList.length);
  };


  const uploadOrcamentos = async (solicitante: string) => {
    const nomes: string[] = [];
  
    for (let i = 0; i < orcamentos.length; i++) {
      const file = orcamentos[i];
      if (!file) continue;
  
      // Gera um nome único sem nome original do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `orcamento_${timestamp}_${i + 1}.pdf`; // Evita conflito e caracteres ruins
  
      try {
        const { error } = await supabase.storage
          .from("orcamentos")
          .upload(fileName, file);
  
        if (error) {
          console.error("Erro ao subir o arquivo:", error.message);
          alert(`Erro ao subir o arquivo do orçamento ${i + 1}`);
          continue;
        }
  
        // Nome armazenado com ", solicitante"
        nomes.push(`${fileName}, ${solicitante}`);
  
      } catch (err) {
        console.error("Erro inesperado ao subir o arquivo:", err);
        alert(`Erro inesperado ao subir o arquivo ${i + 1}`);
      }
    }
  
    return nomes;
  };
  
  

  
  




  type Material = {
    nome: string;
    quantidade: number;
    unidade: string;
  };
  
  type FormData = {
    solicitante: string;
    dataPedido: string;
    observacao: string;
    nomedo_pedido: string;
  };
  
  const handleSalvarPedido = async () => {
    // Formatar os materiais para enviar
    const materiaisFormatados = materiais
      .map(item => `${item.nome}, ${item.quantidade} ${item.unidade}`)
      .join("; ");
  
    const { observacao, nomedo_pedido } = formData;
    const novaData = new Date().toISOString();
  
    // Validar campos obrigatórios
    if (materiais.length === 0 || !nomedo_pedido?.trim()) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
  
    try {
      // Upload dos orçamentos
      const orcamentoNomes = await uploadOrcamentos(nome);
  
      // Inserir a solicitação na base de dados
      const { error } = await supabase.from("solicitacoes").insert([
        {
          data: novaData,
          status: "Pendente",
          solicitado_por: nome,
          orcamento_urls: orcamentoNomes.join("; "),
          materiais: materiaisFormatados,
          observacao: `${observacao}||| ${nome}||| ${novaData}`, // observação + nome + timestamp
          nome_pedido: nomedo_pedido,
        },
      ]);
  
      if (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar pedido.");
      } else {
        alert("Pedido salvo com sucesso!");
        setIsModalOpen(false);
  
        // Resetar o formulário
        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  
        setFormData({
          solicitante: "",
          dataPedido: formattedDate,
          observacao: "",
          nomedo_pedido: "",
        });
  
        // Enviar mensagem via WhatsApp
        enviarMensagemWhatsApp({
          solicitado_por: nome,
          nome_pedido: nomedo_pedido,
          observacao: observacao,
          materiais: materiais,
        });
  
        // Resetar os dados relacionados ao pedido
        setMateriais([]);
        setMaterialCount(0);
        setOrcamentos([]);
        // Recarregar a página para garantir que os dados atualizados sejam carregados
      window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao processar o pedido:", error);
      alert("Erro ao processar o pedido.");
    }
  };
  
// Função para enviar mensagem via WhatsApp para vários números
async function enviarMensagemWhatsApp({
  solicitado_por,
  nome_pedido,
  observacao,
  materiais,
}: {
  solicitado_por: string;
  nome_pedido: string;
  observacao: string;
  materiais: Material[];
}) {
  const numerosDestino = [
    '557998870125', '5511976113088', '557999885900'
    
    // Adicione mais números conforme necessário
  ];

  const materiaisFormatados = materiais
    .map(item => `• ${item.nome} — ${item.quantidade} ${item.unidade}`)
    .join("\n");

  const mensagem =
    `📢 *Nova Solicitação de Materiais*\n\n` +
    `👤 *Solicitado por:* ${solicitado_por}\n` +
    `📝 *Pedido:* ${nome_pedido}\n\n` +
    `💬 *Observação:*\n${observacao || "Sem observações."}\n\n` +
    `📦 *Materiais:*\n${materiaisFormatados}`;

  for (const numero of numerosDestino) {
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
        console.log(`✅ Mensagem enviada com sucesso para ${numero}:`, dados);
      } else {
        console.warn(`⚠️ Erro ao enviar mensagem para ${numero}:`, dados?.error || 'Erro desconhecido');
      }

      // Aguarda 1 segundo antes de enviar para o próximo número
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (erro) {
      console.warn(`❌ Servidor de WhatsApp não está acessível para o número ${numero}. Ignorando...`);
    }
  }
}






  
  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      setCurrentPage(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-sm" : ""}`}>
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
        Solicitação de Compra
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
          onNavClickAction={handleNavClick} 
          className="h-full" 
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className="content flex-1 p-6 mt-10 ">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative mb-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <PlusCircle size={20} className="transition-transform duration-300 group-hover:rotate-90" />
          <span className="text-base">Novo Pedido</span>
          <span className="absolute -bottom-1 left-1/2 h-1 w-0 rounded-full bg-white opacity-20 transition-all duration-300 group-hover:w-4 group-hover:-translate-x-1/2"></span>
        </button>

          {/* Cards com os Pedidos */}
          <div>
  
    <PedidosList /> 
  </div>
        </div>


        
      </div>

    {/* Modal de Novo Pedido */}
<Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
  {/* Fundo escurecido com blur */}
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" aria-hidden="true" />

  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="w-full max-w-2xl transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300">
      <Dialog.Title className="mb-6 text-2xl font-semibold text-gray-800">📝 Novo Pedido</Dialog.Title>

      <div className="grid grid-cols-1 gap-5">

      <input
          type="text"
          placeholder="Nome do pedido (facilita a busca depois)"
          value={formData.nomedo_pedido}
           className="rounded-lg border border-gray-300 p-3 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
           onChange={(e) => setFormData({ ...formData, nomedo_pedido: e.target.value })}
        />
        <input
          type="text"
          value={formData.dataPedido}
          disabled
          className="rounded-lg border border-gray-300 bg-gray-100 p-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          placeholder="Observação"
          value={formData.observacao}
          onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
          className="rounded-lg border border-gray-300 p-3 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

<input
  type="file"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files || []);
    setOrcamentos((prev) => [...prev, ...files]);
  }}
  className="cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-gray-600 transition hover:border-blue-400 hover:bg-blue-50"
/>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-50 px-4 py-2.5 text-blue-700 font-medium transition hover:bg-blue-100 hover:shadow-md"
    onClick={() => setIsMateriaisModalOpen(true)}
  >
    <span className="text-lg group-hover:scale-110 transition">➕</span>
    Incluir Materiais ({materialCount})
  </button>

  <button
    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-400 bg-gray-50 px-4 py-2.5 text-gray-700 font-medium transition hover:bg-gray-100 hover:shadow-md"
    onClick={() => setIsVisualizarModalOpen(true)}
  >
    <span className="text-lg group-hover:scale-110 transition">👀</span>
    Ver Materiais
  </button>

  <button
    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-500 bg-yellow-50 px-4 py-2.5 text-yellow-700 font-medium transition hover:bg-yellow-100 hover:shadow-md"
    onClick={() => setIsOrcamentosModalOpen(true)}
  >
    <span className="text-lg group-hover:scale-110 transition">📎</span>
    Ver Orçamentos ({orcamentos.length})
  </button>
</div>

<button
  onClick={handleSalvarPedido}
  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-white font-semibold shadow-md transition-all duration-150 hover:from-blue-600 hover:to-indigo-600 active:scale-95 active:shadow-inner"
>
  <SendHorizontal size={18} />
  Enviar Pedido de Compra
</button>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>


{/* Modal para visualizar orçamentos */}
<Dialog open={isOrcamentosModalOpen} onClose={() => setIsOrcamentosModalOpen(false)} className="relative z-50">
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

  <div className="fixed inset-0 flex items-center justify-center p-4">
  <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300">
      <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">📁 Orçamentos Selecionados</Dialog.Title>

      {orcamentos.length === 0 ? (
        <p className="text-gray-500">Nenhum orçamento selecionado.</p>
      ) : (
        <div className="grid gap-4 max-h-[400px] overflow-auto pr-2">
  {orcamentos.map((file, idx) => {
    const fileURL = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    return (
      <div key={idx} className="border rounded-lg p-3 bg-gray-50 shadow-sm relative">
        <div className="mb-2 text-sm font-medium truncate text-gray-700">{file.name}</div>

        {isImage && (
          <img
            src={fileURL}
            alt={file.name}
            className="max-h-48 w-full object-contain rounded"
          />
        )}

        {isPDF && (
          <iframe
            src={fileURL}
            title={file.name}
            className="w-full h-48 border rounded"
          />
        )}

        {!isImage && !isPDF && (
          <div className="text-gray-500 text-sm italic">Arquivo não suportado para visualização</div>
        )}

        <button
          onClick={() => setOrcamentos((prev) => prev.filter((_, i) => i !== idx))}
          className="absolute top-2 right-2 rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
        >
          Remover
        </button>
      </div>
    );
  })}
</div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setIsOrcamentosModalOpen(false)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Fechar
        </button>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>

      {/* Modal para adicionar materiais */}
      <Dialog open={isMateriaisModalOpen} onClose={() => setIsMateriaisModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="bg-white p-6 rounded-xl max-w-md w-full">
            <Dialog.Title className="text-xl font-bold mb-4">Adicionar Materiais</Dialog.Title>
            <div className="space-y-4">
              <input id="material-nome" type="text" placeholder="Nome do Material" className="border p-2 w-full rounded" />
              <input id="material-quantidade" type="number" placeholder="Quantidade" className="border p-2 w-full rounded" />
              <input id="material-unidade" type="text" placeholder="Unidade" className="border p-2 w-full rounded" />
              <button
                onClick={handleMaterialAdd}
                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 w-full"
              >
                Adicionar à Lista
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal para visualizar e excluir materiais */}
      <Dialog open={isVisualizarModalOpen} onClose={() => setIsVisualizarModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="bg-white p-6 rounded-xl max-w-md w-full">
            <Dialog.Title className="text-xl font-bold mb-4">Materiais Adicionados</Dialog.Title>
            <ul className="space-y-2">
              {materiais.map((mat, index) => (
                <li key={index} className="flex justify-between items-center border p-2 rounded">
                  <span>{mat.nome} - {mat.quantidade} - {mat.unidade}</span>
                  <button onClick={() => handleDeleteMaterial(index)}>
                    <Trash2 size={18} className="text-red-600 hover:text-red-800" />
                  </button>
                </li>
              ))}
              {materiais.length === 0 && <p className="text-sm text-gray-500">Nenhum material adicionado.</p>}
            </ul>
            <button
              onClick={() => setIsVisualizarModalOpen(false)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Fechar
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isVisualizarPedidoModalOpen} onClose={() => setIsVisualizarPedidoModalOpen(false)} className="relative z-50">
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center">
    <Dialog.Panel className="bg-white p-6 rounded-xl max-w-xl w-full">
      <Dialog.Title className="text-xl font-bold mb-4">Visualizar Pedido</Dialog.Title>

      {pedidoSelecionado && (
        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            value={pedidoSelecionado.descricao}
            disabled
            className="border p-2 rounded bg-gray-100"
          />
          <input
            type="text"
            value={pedidoSelecionado.status}
            disabled
            className="border p-2 rounded bg-gray-100"
          />

          <input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setOrcamentos(Array.from(e.target.files));
              }
            }}
            className="border p-2 rounded"
          />
          <ul className="text-sm text-gray-600">
            {orcamentos.map((file, idx) => (
              <li key={idx}>📎 {file.name}</li>
            ))}
          </ul>
          <button
            onClick={() => setIsVisualizarPedidoModalOpen(false)}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      )}
    </Dialog.Panel>
  </div>
      </Dialog>

    </div>
  );
}
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Package, Upload, PlusCircle, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getAccessToken } from "@/lib/auth";
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";

export default function EntradaRomaneioPage() {
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Logística');
  const [recebidoDe, setRecebidoDe] = useState('');
  const [indoPara, setIndoPara] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const addItem = () => setItens([...itens, { nome: '', quantidade: 1, observacao: '', imagemFile: null }]);
  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    setItens(newItens);
  };
  const removeItem = (index: number) => setItens(itens.filter((_, i) => i !== index));

  const dataFormatada = new Date().toISOString().slice(0,10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      // Inserir romaneio do tipo 'entrada'
      const { data: romaneioData, error: romaneioError } = await supabase
        .from('romaneio')
        .insert([{
          tipo: 'entrada',
          saindo_de: recebidoDe,
          indo_para: indoPara,
          responsavel_retirada: responsavel,
          contrato_id: contratoId,
        }])
        .select()
        .single();
      if (romaneioError) throw romaneioError;

      const romaneioId = romaneioData.id;

      // Upload do documento
      let documentoUrl: string | null = null;
      if (documentoFile) {
        const extension = documentoFile.name.includes('.') ? documentoFile.name.split('.').pop() : '';
        const fileName = `romaneio_${new Date().toISOString().replace(/[:.]/g, "-")}${extension ? '.' + extension : ''}`;
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Token de acesso não encontrado.");

const uploaded = await uploadFileToOneDrive(
  accessToken,
  documentoFile,
  fileName,
  dataFormatada,
  recebidoDe,
  "romaneio",
  romaneioId.toString()
);

documentoUrl = uploaded?.url || null; // pega apenas a URL


        if (!documentoUrl) throw new Error("URL do documento não retornada pelo OneDrive.");

        const { error: docUpdateError } = await supabase
          .from('romaneio')
          .update({ documento_path: documentoUrl })
          .eq('id', romaneioId);
        if (docUpdateError) throw docUpdateError;
      }

      // Upload e inserção dos itens
      for (const item of itens) {
        let urlImagem: string | null = null;
        if (item.imagemFile) {
          const extension = item.imagemFile.name.includes('.') ? item.imagemFile.name.split('.').pop() : '';
          const fileName = `romaneio_item_${new Date().toISOString().replace(/[:.]/g, "-")}${extension ? '.' + extension : ''}`;
          const accessToken = await getAccessToken();
          if (!accessToken) throw new Error("Token de acesso não encontrado.");

const uploadedw = await uploadFileToOneDrive(
  accessToken,
  item.imagemFile,
  fileName,
  dataFormatada,
  recebidoDe,
  "romaneio-itens",
  romaneioId.toString()
);

urlImagem = uploadedw?.url || null; // pega apenas a URL

        }

        const { error: itemError } = await supabase.from('romaneio_itens').insert([{
          romaneio_id: romaneioId,
          nome_item: item.nome,
          quantidade: item.quantidade,
          observacao: item.observacao,
          imagem: urlImagem,
        }]);
        if (itemError) throw itemError;
      }

      setMensagem('Romaneio de entrada registrado com sucesso ✅');
      setItens([]);
      setRecebidoDe('');
      setIndoPara('');
      setResponsavel('');
      setContratoId('');
      setDocumentoFile(null);

    } catch (err: any) {
      console.error(err);
      setMensagem(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
    {/* Topbar */}     
      <div
        className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${
          menuActive ? "ml-[300px]" : "ml-[80px]"
        }`}
      >
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Logística – Entrada de Materiais ou equipamentos
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
          <img
            src="/Logobranca.png"
            alt="Logo da Empresa"
            className="h-[40px] w-auto"
          />
        </div>
      </div>

      <div className="flex bg-gray-50">
        <Sidebar onNavClickAction={() => {}} menuActive={menuActive} setMenuActive={setMenuActive} activeTab={activeTab} />
        <div className="content flex-1 p-6 min-h-screen">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <h1 className="text-2xl font-bold mb-6 text-[#200101] flex items-center gap-2">
              <Package size={28} /> Registrar Entrada
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="text" value={recebidoDe} onChange={(e) => setRecebidoDe(e.target.value)} placeholder="Recebido de..." className="w-full border p-3 rounded-xl" required />
              <input type="text" value={indoPara} onChange={(e) => setIndoPara(e.target.value)} placeholder="Indo para..." className="w-full border p-3 rounded-xl" required />
              <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável pelo recebimento" className="w-full border p-3 rounded-xl" required />
              <select value={contratoId} onChange={(e) => setContratoId(e.target.value)} className="w-full border p-3 rounded-xl">
                <option value="">Selecione o contrato</option>
                <option value="1">Contrato A</option>
                <option value="2">Contrato B</option>
              </select>

              <div>
                <label className="block text-sm font-medium text-gray-700">Documento do Romaneio</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)} className="mt-1 w-full text-gray-700" required />
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Itens</h2>
                {itens.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-3 border p-3 rounded-xl">
                    <input type="text" placeholder="Nome" value={item.nome} onChange={(e) => updateItem(i,'nome',e.target.value)} className="border p-2 rounded-xl" required />
                    <input type="number" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(i,'quantidade',Number(e.target.value))} className="border p-2 rounded-xl" min={1} required />
                    <input type="text" placeholder="Obs" value={item.observacao} onChange={(e) => updateItem(i,'observacao',e.target.value)} className="border p-2 rounded-xl col-span-2" />
                    <input type="file" accept="image/*" onChange={(e) => updateItem(i,'imagemFile',e.target.files?.[0]||null)} />
                    <button type="button" onClick={() => removeItem(i)} className="text-red-600 flex items-center gap-1"><Trash2 size={16}/>Remover</button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="mt-2 flex items-center gap-2 text-blue-600"><PlusCircle size={18}/>Adicionar item</button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white px-6 py-3 rounded-xl flex justify-center items-center gap-2">
                <Upload size={20}/> {loading ? 'Salvando...' : 'Registrar Entrada'}
              </button>
            </form>

            {mensagem && <p className="mt-4 text-center text-sm font-medium text-gray-700">{mensagem}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

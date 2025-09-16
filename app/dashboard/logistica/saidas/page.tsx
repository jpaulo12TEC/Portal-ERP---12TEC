'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Package, Upload, PlusCircle, Trash2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getAccessToken } from "@/lib/auth"; // ajuste o caminho
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";


export default function SaidaRomaneioPage() {
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Logística');
  const [saindoDe, setSaindoDe] = useState('');
  const [indoPara, setIndoPara] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleNavClick = async (tab: string) => {
    setActiveTab(tab);
    router.push(`/logistica/${tab.toLowerCase()}`);
  };

  const addItem = () => {
    setItens([...itens, { nome: '', quantidade: 1, observacao: '', imagemFile: null }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    setItens(newItens);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

try {
  // 1. Inserir o romaneio sem o documento ainda
  const { data: romaneioData, error: romaneioError } = await supabase
    .from('romaneio')
    .insert([
      {
        tipo: 'saida',
        saindo_de: saindoDe,
        indo_para: indoPara,
        responsavel_retirada: responsavel,
        contrato_id: contratoId,
      },
    ])
    .select()
    .single();
  if (romaneioError) throw romaneioError;

  const romaneioId = romaneioData.id;

  // 2. Upload do documento do romaneio para o OneDrive
  let documentoUrl: string | null = null;
  if (documentoFile) {
    const originalFileName = documentoFile.name;
    const extension = originalFileName.includes('.') ? originalFileName.split('.').pop() : '';
    const fileName = `romaneio_${new Date().toISOString().replace(/[:.]/g, "-")}${extension ? '.' + extension : ''}`;
    
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Token de acesso não encontrado.");

    documentoUrl = await uploadFileToOneDrive(
      accessToken,
      documentoFile,
      fileName,
      new Date().toISOString(), // data/hora
      saindoDe,                // origem
      "romaneio",    // pasta
      romaneioId.toString()     // descrição usando romaneioId
    );

    if (!documentoUrl) throw new Error("URL do documento não retornada pelo OneDrive.");

    // Atualizar a tabela romaneio com o documento
    const { error: docUpdateError } = await supabase
      .from('romaneio')
      .update({ documento_path: documentoUrl })
      .eq('id', romaneioId);
    if (docUpdateError) throw docUpdateError;
  }

  // 3. Upload e inserção dos itens no OneDrive
  for (const item of itens) {
    let urlImagem: string | null = null;

    if (item.imagemFile) {
      const originalFileName = item.imagemFile.name;
      const extension = originalFileName.includes('.') ? originalFileName.split('.').pop() : '';
      const fileName = `romaneio_item_${new Date().toISOString().replace(/[:.]/g, "-")}${extension ? '.' + extension : ''}`;

      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Token de acesso não encontrado.");

      urlImagem = await uploadFileToOneDrive(
        accessToken,
        item.imagemFile,
        fileName,
        new Date().toISOString(), // data/hora
        saindoDe,
        "romaneio-itens",
        romaneioId.toString() // aqui a descrição é o romaneioId
      );

      if (!urlImagem) throw new Error("URL do item não retornada pelo OneDrive.");
    }

    const { error: itemError } = await supabase.from('romaneio_itens').insert([
      {
        romaneio_id: romaneioId,
        nome_item: item.nome,
        quantidade: item.quantidade,
        observacao: item.observacao,
        imagem: urlImagem,
      },
    ]);
    if (itemError) throw itemError;
  }

  setMensagem('Romaneio registrado com sucesso ✅');
  setItens([]);
  setSaindoDe('');
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
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button onClick={() => window.history.back()} className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] rounded-full">
            <ArrowLeft size={20} /> Voltar
          </button>
          <div className="px-3 py-3 h-[50px]">Logística – Saída de Romaneio</div>
        </div>
        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full text-black" />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>
        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px]" />
        </div>
      </div>

      <div className="flex bg-gray-50">
        <Sidebar onNavClickAction={handleNavClick} menuActive={menuActive} setMenuActive={setMenuActive} activeTab={activeTab} />

        <div className="content flex-1 p-6 min-h-screen">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <h1 className="text-2xl font-bold mb-6 text-[#200101] flex items-center gap-2">
              <Package size={28} /> Registrar Saída
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campos gerais do romaneio */}
              <input
                type="text"
                value={saindoDe}
                onChange={(e) => setSaindoDe(e.target.value)}
                placeholder="Saindo de..."
                className="w-full border p-3 rounded-xl"
                required
              />
              <input
                type="text"
                value={indoPara}
                onChange={(e) => setIndoPara(e.target.value)}
                placeholder="Indo para..."
                className="w-full border p-3 rounded-xl"
                required
              />
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Responsável pela retirada"
                className="w-full border p-3 rounded-xl"
                required
              />
              <select
                value={contratoId}
                onChange={(e) => setContratoId(e.target.value)}
                className="w-full border p-3 rounded-xl"
                
              >
                <option value="">Selecione o contrato</option>
                <option value="1">Contrato A</option>
                <option value="2">Contrato B</option>
              </select>

              <div>
                <label className="block text-sm font-medium text-gray-700">Documento do Romaneio</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-gray-700"
                  required
                />
              </div>

              {/* Itens do romaneio */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Itens</h2>
                {itens.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-3 border p-3 rounded-xl">
                    <input type="text" placeholder="Nome" value={item.nome} onChange={(e) => updateItem(i, 'nome', e.target.value)} className="border p-2 rounded-xl" required />
                    <input type="number" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value))} className="border p-2 rounded-xl" min={1} required />
                    <input type="text" placeholder="Obs" value={item.observacao} onChange={(e) => updateItem(i, 'observacao', e.target.value)} className="border p-2 rounded-xl col-span-2" />
                    <input type="file" accept="image/*" onChange={(e) => updateItem(i, 'imagemFile', e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => removeItem(i)} className="text-red-600 flex items-center gap-1"><Trash2 size={16}/>Remover</button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="mt-2 flex items-center gap-2 text-blue-600"><PlusCircle size={18}/>Adicionar item</button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white px-6 py-3 rounded-xl flex justify-center items-center gap-2">
                <Upload size={20}/> {loading ? 'Salvando...' : 'Registrar Romaneio'}
              </button>
            </form>

            {mensagem && <p className="mt-4 text-center text-sm font-medium text-gray-700">{mensagem}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

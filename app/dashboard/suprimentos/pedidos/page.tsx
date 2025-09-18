'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Layers, FileText, ClipboardList } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/superbase';
import { getAccessToken } from '@/lib/auth';
import { uploadFileToOneDrive } from '@/lib/uploadFileToOneDrive';

interface Material {
  nome: string;
  quantidade: number;
  unidade: string;
  obs: string;
}

export default function NovoPedidoCompra() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);

  const [materiais, setMateriais] = useState<Material[]>([
    { nome: '', quantidade: 1, unidade: '', obs: '' },
  ]);
  const [destino, setDestino] = useState('');
  const [fornecedores, setFornecedores] = useState<string[]>(['']);
  const [orcamentos, setOrcamentos] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);

  const usuarioSolicitante = 'João Silva';
  const dataSolicitacao = new Date().toLocaleDateString('pt-BR');

  const handleMaterialChange = (index: number, field: keyof Material, value: string | number) => {
    const novosMateriais = [...materiais];
    switch (field) {
      case 'nome':
      case 'unidade':
      case 'obs':
        novosMateriais[index][field] = value as string;
        break;
      case 'quantidade':
        novosMateriais[index][field] = Number(value);
        break;
    }
    setMateriais(novosMateriais);
  };

  const addMaterial = () => setMateriais([...materiais, { nome: '', quantidade: 1, unidade: '', obs: '' }]);
  const removeMaterial = (index: number) => setMateriais([...materiais].filter((_, i) => i !== index));

  const addFornecedor = () => {
    setFornecedores([...fornecedores, '']);
    setOrcamentos([...orcamentos, null]);
  };

  const removeFornecedor = (index: number) => {
    setFornecedores([...fornecedores].filter((_, i) => i !== index));
    setOrcamentos([...orcamentos].filter((_, i) => i !== index));
  };

const handleSubmit = async () => {
  setLoading(true);
  try {
    const accessToken = await getAccessToken(); // função que você deve ter
    if (!accessToken) throw new Error("Token de acesso não encontrado.");

    // Arrays para guardar urls e ids do OneDrive
    const uploadedFiles = await Promise.all(
      orcamentos.map(async (file, i) => {
        if (!file) return null;

        const extension = file.name.split('.').pop();
        const fileName = `orcamento_${Date.now()}_${i}.${extension}`;

        const newFile = await uploadFileToOneDrive(
          accessToken,
          file,
          fileName,
          new Date().toISOString().slice(0, 10), // dataCompra
          fornecedores[i] || '',
          "pedido_de_compra"
        );

        if (!newFile) throw new Error(`Falha no upload do arquivo ${file.name}`);

        return { url: newFile.url, id: newFile.id };
      })
    );

    // Monta o payload para inserir no Supabase
    const pedido = {
      id_solicitante: usuarioSolicitante,
      created_at: new Date().toISOString(),
      materiais: JSON.stringify(materiais),
      centro_custo: destino,
      fornecedor1: fornecedores[0] || null,
      orcamento_url1: uploadedFiles[0]?.url || null,
      fornecedor2: fornecedores[1] || null,
      orcamento_url2: uploadedFiles[1]?.url || null,
      fornecedor3: fornecedores[2] || null,
      orcamento_url3: uploadedFiles[2]?.url || null,
      vencedor: null,
      valor_previsto: null,
      menor_valor: null,
      fornecedor_menor_valor: null,
      motivacao: null,
      id_compra: null,
      comprado_em: null,
      ordem_servico: null,
      status: 'pendente',
      observacoes: null,
    };

    const { error } = await supabase.from('pedidosdecompra').insert([pedido]);
    if (error) throw error;

    alert('Pedido criado com sucesso!');
    router.push('/dashboard/compras/acompanhamento');

  } catch (err: any) {
    console.error("Erro ao criar pedido:", err);
    alert('Erro ao salvar pedido: ' + (err.message ?? err));
  } finally {
    setLoading(false);
  }
};



return (
  <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
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
          <button className="w-full text-left hover:text-gray-300">
            Departamento de Compras
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
      {/* Sidebar */}
      <Sidebar
        onNavClickAction={() => {}}
        className="h-full"
        menuActive={menuActive}
        setMenuActive={setMenuActive}
        activeTab={'Suprimentos'}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex justify-center items-start bg-gray-50 overflow-y-auto p-6">
        {/* Card centralizado */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8 space-y-8">

          {/* Cabeçalho */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs text-gray-400">Solicitante</p>
              <p className="text-lg font-semibold text-gray-700">{usuarioSolicitante}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Data</p>
              <p className="text-lg font-semibold text-gray-700">{dataSolicitacao}</p>
            </div>
          </div>

          {/* Materiais */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Materiais</h2>
              <span className="text-sm text-gray-500">{materiais.length} item(s)</span>
            </div>
            <div className="space-y-3">
              {materiais.map((mat, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <input type="text" placeholder="Material" value={mat.nome} onChange={(e) => handleMaterialChange(idx, 'nome', e.target.value)} className="flex-1 border-b border-gray-300 focus:outline-none py-1" />
                  <input type="number" placeholder="Qtd" value={mat.quantidade} onChange={(e) => handleMaterialChange(idx, 'quantidade', Number(e.target.value))} className="w-20 border-b border-gray-300 focus:outline-none py-1 text-center" />
                  <input type="text" placeholder="Unidade" value={mat.unidade} onChange={(e) => handleMaterialChange(idx, 'unidade', e.target.value)} className="w-24 border-b border-gray-300 focus:outline-none py-1 text-center" />
                  <input type="text" placeholder="Observação" value={mat.obs} onChange={(e) => handleMaterialChange(idx, 'obs', e.target.value)} className="flex-1 border-b border-gray-300 focus:outline-none py-1" />
                  <button onClick={() => removeMaterial(idx)} className="text-red-500 hover:underline text-sm">Remover</button>
                </div>
              ))}
              <button onClick={addMaterial} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 text-sm">+ Adicionar Material</button>
            </div>
          </div>

          {/* Destino */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-500 mb-1">Destino</label>
            <select value={destino} onChange={(e) => setDestino(e.target.value)} className="w-full border-b border-gray-300 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 rounded-md">
              <option value="">Selecione o destino</option>
              <option value="Eneva">Eneva</option>
              <option value="GE">GE</option>
              <option value="Stanza">Stanza</option>
              <option value="Moisaic">Moisaic</option>
              <option value="Mosaic-Postos">Mosaic-Postos</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Fornecedores */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Fornecedores sugeridos</h2>
              <span className="text-sm text-gray-500">{fornecedores.length} item(s)</span>
            </div>
            <div className="space-y-3">
              {fornecedores.map((f, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 items-center border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <input type="text" placeholder={`Fornecedor ${i+1}`} value={f} onChange={(e) => { const nf = [...fornecedores]; nf[i] = e.target.value; setFornecedores(nf); }} className="flex-1 border-b border-gray-300 py-1 focus:outline-none" />
                  <input type="file" onChange={(e) => { const no = [...orcamentos]; no[i] = e.target.files ? e.target.files[0] : null; setOrcamentos(no); }} className="flex-1" />
                  <button onClick={() => removeFornecedor(i)} className="text-red-500 hover:underline text-sm">Remover</button>
                </div>
              ))}
              <button onClick={addFornecedor} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 text-sm">+ Adicionar Fornecedor</button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition">{loading ? 'Salvando...' : 'Criar Pedido'}</button>

        </div> {/* fim card */}
      </div> {/* fim conteúdo principal */}
    </div> {/* fim flex principal */}
  </div> 
);
}
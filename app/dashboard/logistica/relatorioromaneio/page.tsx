'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Search, FileText, Image, Users } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface RomaneioItem {
  id: number;
  nome_item: string;
  quantidade: number;
  observacao: string;
  imagem: string | null;
}

interface Romaneio {
  id: number;
  tipo: string;
  saindo_de: string;
  indo_para: string;
  responsavel_retirada: string;
  contrato_id: string;
  documento_path: string | null;
  itens: RomaneioItem[];
  created_at: Date
}

export default function RelatorioRomaneiosPage() {
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Logística');
  const [romaneios, setRomaneios] = useState<Romaneio[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRomaneios();
  }, []);

  const fetchRomaneios = async () => {
    setLoading(true);
    try {
      const { data: romaneioData, error } = await supabase
        .from('romaneio')
        .select(`
          *,
          romaneio_itens(*)
        `)
        .order('id', { ascending: false });

      if (error) throw error;

      setRomaneios(
        romaneioData.map((r: any) => ({
          ...r,
          itens: r.romaneio_itens || [],
        }))
      );
    } catch (err: any) {
      console.error('Erro ao buscar romaneios:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = async (tab: string) => {
    setActiveTab(tab);
    router.push(`/logistica/${tab.toLowerCase()}`);
  };

  return (
    <div className="flex flex-col h-screen">
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
              Logística – Relatório de Romaneio
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
        <Sidebar onNavClickAction={handleNavClick} menuActive={menuActive} setMenuActive={setMenuActive} activeTab={activeTab} />

        <div className="content flex-1 p-6 min-h-screen">
          <div className="max-w-5xl mx-auto space-y-6">
            {loading && <p className="text-center text-gray-500">Carregando romaneios...</p>}

{romaneios.map((r) => (
  <div key={r.id} className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-[#200101] flex items-center gap-2">
        <Package size={24} /> Romaneio #{r.id} – {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}
      </h2>
      {r.documento_path && (
        <a href={r.documento_path} target="_blank" className="text-blue-600 flex items-center gap-1">
          <FileText size={18} /> Documento
        </a>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-gray-700">
      <div><strong>Data:</strong> {new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
      <div><strong>Tipo:</strong> {r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}</div>
      <div><strong>Saindo de:</strong> {r.saindo_de}</div>
      <div><strong>Indo para:</strong> {r.indo_para}</div>
      <div><strong>Responsável:</strong> {r.responsavel_retirada}</div>
      <div><strong>Contrato:</strong> {r.contrato_id}</div>
    </div>

    {r.itens.length > 0 && (
      <div className="mt-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Image size={18} /> Itens</h3>
        <div className="mt-2 space-y-2">
          {r.itens.map((item) => (
            <div key={item.id} className="border p-3 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <strong>{item.nome_item}</strong> (Qtd: {item.quantidade})
                {item.observacao && <p className="text-sm text-gray-600">Obs: {item.observacao}</p>}
              </div>
              {item.imagem && (
                <a href={item.imagem} target="_blank" className="text-blue-600 flex items-center gap-1">
                  <Image size={16} /> Ver imagem
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
))}


          </div>
        </div>
      </div>
    </div>
  );
}

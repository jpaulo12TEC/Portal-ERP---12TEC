'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Plus, Minus, Repeat } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/superbase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Modal genérico elegante

type Movimentacao = {
  data: string;
  acao: string;
  usuario: string;
  motivo?: string;
};

type InventarioItem = {
  id: number;
  nome: string;
  quantidade: number;
  local: string;
  status: string;
  ultima_movimentacao: Movimentacao;
  observacao: string;
  nome_tecnico: string;
};

export default function Inventario() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<Movimentacao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'adicionar' | 'retirar' | 'remanejar' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);

  // Campos do modal
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [local, setLocal] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    fetchInventario();
  }, []);

  async function fetchInventario() {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('id', { ascending: true });

    if (error) return console.error(error);

    const formatted = data.map((item: any) => ({
      ...item,
      ultima_movimentacao: item.ultima_movimentacao || { data: '-', acao: '-', usuario: '-' },
    }));
    setInventario(formatted);

    const ultimas = formatted
      .map(i => i.ultima_movimentacao)
      .sort((a, b) => (b.data > a.data ? 1 : -1))
      .slice(0, 3);
    setUltimasMovimentacoes(ultimas);
  }

  function openModal(type: 'adicionar' | 'retirar' | 'remanejar', item?: InventarioItem) {
    setModalType(type);
    if (item) setSelectedItem(item);
    setNome(item?.nome || '');
    setQuantidade(1);
    setLocal(item?.local || '');
    setMotivo('');
    setObservacao(item?.observacao || '');
    setModalOpen(true);
  }

  async function handleSubmitModal() {
    if (!modalType || !selectedItem) return;

    let updatedItem = { ...selectedItem };

    if (modalType === 'adicionar') {
      updatedItem.quantidade += quantidade;
      updatedItem.ultima_movimentacao = { data: new Date().toISOString(), acao: 'Adicionado', usuario: 'Usuário' };
    } else if (modalType === 'retirar') {
      updatedItem.quantidade -= quantidade;
      updatedItem.status = 'Perdido';
      updatedItem.ultima_movimentacao = { data: new Date().toISOString(), acao: 'Retirado', usuario: 'Usuário', motivo };
    } else if (modalType === 'remanejar') {
      updatedItem.local = local;
      updatedItem.ultima_movimentacao = { data: new Date().toISOString(), acao: 'Remanejado', usuario: 'Usuário' };
    }

    const { error } = await supabase
      .from('inventario')
      .update({
        quantidade: updatedItem.quantidade,
        local: updatedItem.local,
        status: updatedItem.status,
        ultima_movimentacao: updatedItem.ultima_movimentacao,
        observacao,
      })
      .eq('id', updatedItem.id);

    if (error) console.error(error);
    else fetchInventario();

    setModalOpen(false);
  }

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
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
            <span className="w-full text-left">Inventário</span>
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
      </div>

      <div className="flex flex-1">
        <Sidebar onNavClickAction={() => {}} className="h-full" menuActive={menuActive} setMenuActive={setMenuActive} activeTab={'Compras'} />

        <div className="p-6 w-[85%] mx-auto space-y-6">
          {/* Ações */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => openModal('adicionar')}
              className="flex flex-col items-center justify-center bg-white text-[#5a0d0d] border border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white rounded-xl w-[120px] h-[100px] shadow transition-all"
            >
              <Plus size={28} />
              <span className="text-xs mt-2">Adicionar</span>
            </button>
            <button
              onClick={() => openModal('retirar')}
              className="flex flex-col items-center justify-center bg-white text-[#5a0d0d] border border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white rounded-xl w-[120px] h-[100px] shadow transition-all"
            >
              <Minus size={28} />
              <span className="text-xs mt-2">Retirar</span>
            </button>
            <button
              onClick={() => openModal('remanejar')}
              className="flex flex-col items-center justify-center bg-white text-[#5a0d0d] border border-[#5a0d0d] hover:bg-[#5a0d0d] hover:text-white rounded-xl w-[120px] h-[100px] shadow transition-all"
            >
              <Repeat size={28} />
              <span className="text-xs mt-2">Remanejar</span>
            </button>
          </div>

          {/* Últimas movimentações */}
          <div>
            <h3 className="text-lg font-semibold text-[#5a0d0d] mb-4">Últimas 3 movimentações</h3>
            <ul className="bg-white rounded-lg shadow p-4 space-y-2">
              {ultimasMovimentacoes.map((m, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{m.acao}</span>
                  <span>{m.usuario}</span>
                  <span>{new Date(m.data).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista completa do inventário */}
          <div>
            <h3 className="text-lg font-semibold text-[#5a0d0d] mb-4">Todos os equipamentos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead className="bg-[#5a0d0d] text-white">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Quantidade</th>
                    <th className="px-4 py-2">Local</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Última movimentação</th>
                    <th className="px-4 py-2">Feito por</th>
                    <th className="px-4 py-2">Observação</th>
                    <th className="px-4 py-2">Nome técnico</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => openModal('adicionar', item)}
                    >
                      <td className="px-4 py-2">{item.nome}</td>
                      <td className="px-4 py-2">{item.quantidade}</td>
                      <td className="px-4 py-2">{item.local}</td>
                      <td className="px-4 py-2">{item.status}</td>
                      <td className="px-4 py-2">{item.ultima_movimentacao.data}</td>
                      <td className="px-4 py-2">{item.ultima_movimentacao.usuario}</td>
                      <td className="px-4 py-2">{item.observacao}</td>
                      <td className="px-4 py-2">{item.nome_tecnico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal integrado */}
      <Dialog open={modalOpen} onOpenChange={() => setModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{modalType}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {modalType !== 'remanejar' && (
              <input
                type="text"
                placeholder="Nome"
                value={nome || selectedItem?.nome}
                onChange={(e) => setNome(e.target.value)}
                className="border p-2 rounded"
              />
            )}
            <input
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="border p-2 rounded"
            />
            {modalType !== 'adicionar' && (
              <input
                type="text"
                placeholder="Motivo / Observação"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="border p-2 rounded"
              />
            )}
            {modalType === 'remanejar' && (
              <input
                type="text"
                placeholder="Novo local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="border p-2 rounded"
              />
            )}
            <textarea
              placeholder="Observações"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleSubmitModal}
              className="bg-[#5a0d0d] text-white py-2 px-4 rounded hover:bg-[#7a1a1a] transition"
            >
              Salvar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';
import RowDetailsModal from "./RowDetailsModal";

type HistoricoItem = {
  id: string;
  data_lancamento: string;
  lancadopor: string;
  codigo: string;
  quantidade_produtos: number;
  fornecedor: string;
  valor_liquido: number;
  data_compra: string;
  origem: string;
};

export default function HistoricoLancamentos() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  
const [selectedRow, setSelectedRow] = useState<any>(null);
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

const handleRowClick = async (rowData: any) => {
  const { data, error } = await supabase
    .from('provisao_pagamentos')
    .select('*')
    .eq('codigo', rowData.codigo);

  if (error) {
    console.error(error);
    return;
  }

  setSelectedRow(data ? data[0] : rowData);
  setIsModalOpen(true);
};

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setLoading(true);

  try {
    const { data: compras, error: errorCompras } = await supabase
      .from('gerenciamento_compras')
      .select('*')
      .order('data_lancamento', { ascending: false })
      .limit(50);

      if (errorCompras) throw errorCompras;

      const codigos = compras?.map((item: any) => item.codigo) || [];

      const { data: provisoes, error: errorProvisoes } = await supabase
        .from('provisao_pagamentos')
        .select('codigo, origem')
        .in('codigo', codigos);

      if (errorProvisoes) throw errorProvisoes;

      const historicoCompleto = compras?.map((item: any) => {
        const origem = provisoes?.find(p => p.codigo === item.codigo)?.origem || '-';
        return {
          id: item.id,
          data_lancamento: item.data_lancamento,
          lancadopor: item.lancadopor,
          codigo: item.codigo,
          quantidade_produtos: item.quantidade_produtos,
          fornecedor: item.fornecedor,
          valor_liquido: item.valor_liquido,
          data_compra: item.data_compra,
          origem,
        };
      }) as HistoricoItem[];

      setHistorico(historicoCompleto);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="p-6 bg-white  ">
  

  {loading ? (
    <p className="text-gray-500 text-center">Carregando...</p>
  ) : historico.length === 0 ? (
    <p className="text-gray-500 text-center">Nenhum lançamento encontrado.</p>
  ) : (
<div className="space-y-4">
  {historico.map((item) => (
    <div
      key={item.id}
      onClick={() => {
        handleRowClick(item); // passar o item clicado
        setIsModalOpen(true);
      }}
      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          <strong>Data Lançamento:</strong> {formatDate(item.data_lancamento)}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {item.origem || 'Sem origem'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
        <div>
          <strong>Lançado por:</strong> {item.lancadopor || '-'}
        </div>
        <div>
          <strong>Código:</strong> {item.codigo}
        </div>
        <div>
          <strong>Quantidade:</strong> {item.quantidade_produtos}
        </div>
        <div>
          <strong>Fornecedor:</strong> {item.fornecedor}
        </div>
        <div>
          <strong>Valor (R$):</strong> {formatCurrency(item.valor_liquido)}
        </div>
        <div>
          <strong>Data da compra:</strong> {formatDate(item.data_compra)}
        </div>
      </div>
    </div>
  ))}
</div>
  )}

    {/* Modal */}
  {isModalOpen && selectedRow && (
    <RowDetailsModal selectedRow={selectedRow} onClose={() => setIsModalOpen(false)} />
  )}
</div>

  );
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number) {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

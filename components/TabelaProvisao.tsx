import { useState, useEffect } from "react";
import { supabase } from '../lib/superbase';
import RowDetailsModal from "./RowDetailsModal";



type DataItem = {
  origem: string;
  empresa: string;
  cnpj: string;
  lancadoem: string;
  valor: number;
  venceem: string
  pagoem: string;
  data: string;
  codigo: number;
};

const parseDate = (date: string | null) => date ? new Date(date) : new Date(0);

interface SortConfig {
  key: keyof DataItem 
  direction: 'asc' | 'desc';
}

export default function FilterableTable() {
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    origem: "",
    empresa: "",
    cnpj: "",
    lancadoemInicio: "",
    lancadoemFim: "",
    venceemInicio: "",
    venceemFim: "",
    valorMin: "",
    valorMax: "",
    pagoem: "",
    codigo: "",
      });
  const [isPaidFilter, setIsPaidFilter] = useState<boolean>(false);


  


  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('provisao_pagamentos')
        .select('*');
  
      if (error) {
        console.error('Erro ao buscar dados:', error);
      } else {
        if (Array.isArray(data)) {
          setData(data as DataItem[]);
        } else {
          console.error('Dados retornados não são um array:', data);
          setData([]);
        }
      }
    };


  
    fetchData();
  }, []);



  const formatDate = (date: string | number | null) => {
    if (!date) return "-";
    return new Date(String(date)).toLocaleDateString('pt-BR');
  };
  
  const formatCodigo = (codigo: any) => {
    if (codigo == null) return "-";
    // Se o número estiver em notação científica, converte para string
    if (typeof codigo === 'number' && !Number.isInteger(codigo)) {
      return codigo.toFixed(0); // Isso vai forçar o número a ser exibido sem notação científica
    }
    return codigo.toLocaleString('pt-BR');
  };
  

  const formatCurrency = (value: number | null) => {
    if (value == null) return "R$ 0,00";
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const applyFilters = (item: DataItem) => {
    const {
      codigo,
      origem,
      empresa,
      cnpj,
      lancadoemInicio,
      lancadoemFim,
      venceemInicio,
      venceemFim,
      valorMin,
      valorMax,
    } = filters;

    const isPaid = isPaidFilter ? !!item.pagoem : true;


    return (
      (!codigo || (item.codigo && item.codigo.toString().includes(codigo.toString()))) &&
      (!origem || (item.origem && item.origem.toLowerCase().includes(origem.toLowerCase()))) &&
      (!empresa || (item.empresa && item.empresa.toLowerCase().includes(empresa.toLowerCase()))) &&
      (!cnpj || (item.cnpj && item.cnpj.includes(cnpj))) &&
      (!lancadoemInicio || parseDate(item.lancadoem) >= parseDate(lancadoemInicio)) &&
      (!lancadoemFim || (item.lancadoem && new Date(item.lancadoem) <= new Date(lancadoemFim))) &&
      (!venceemInicio || (item.venceem && new Date(item.venceem) >= new Date(venceemInicio))) &&
      (!venceemFim || (item.venceem && new Date(item.venceem) <= new Date(venceemFim))) &&
      (!valorMin || item.valor >= parseFloat(valorMin)) &&
      (!valorMax || item.valor <= parseFloat(valorMax)) &&
      isPaid
    );
  };
const headers = [
  { label: "Código", key: "codigo" },
  { label: "Vencimento", key: "venceem" },
  { label: "Empresa", key: "empresa" },
  { label: "CNPJ", key: "cnpj" },
  { label: "Lançado em", key: "lancadoem" },
  { label: "Valor", key: "valor" },
  { label: "Origem", key: "origem" },
  { label: "Pago em", key: "pagoem" },
];


const [sortConfig, setSortConfig] = useState<{ key: keyof DataItem; direction: 'asc' | 'desc' }>({
  key: 'codigo',
  direction: 'asc',
});
const handleSort = (key: keyof DataItem) => {
  setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
  }));
};

const sortedData = () => {
  const sorted = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  return sorted;
};

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
    setIsModalOpen(true);
  };


  

  return (
    <div className="p-4 h-screen">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" >
        {["Codigo","Origem", "Empresa", "CNPJ"].map((field) => (
          <div key={field} className="flex flex-col">
            <input
              type="text"
              placeholder={field}
              className="p-2 border rounded-md shadow-sm mt-1"
              value={filters[field.toLowerCase()] || ""}
              onChange={(e) =>
                setFilters({ ...filters, [field.toLowerCase()]: e.target.value || "" })
              }
            />
          </div>
        ))}
      </div>

      {/* Filtros de Datas e Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 mt-4">
        {[
          { label: "Início Lançamento", key: "lancadoemInicio" },
          { label: "Fim Lançamento", key: "lancadoemFim" },
          { label: "Início Vencimento", key: "venceemInicio" },
          { label: "Fim Vencimento", key: "venceemFim" },
          { label: "Valor Mínimo", key: "valorMin" },
          { label: "Valor Máximo", key: "valorMax" },
        ].map(({ label, key }) => (
          <div key={key} className="flex flex-col mb-0">
            {label}
            <input
              type={key.includes("valor") ? "number" : "date"}
              id = {label}
              className="p-2 border rounded-md shadow-sm mt-0 mb-4"
              value={filters[key] || ""}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            />
            
          </div>
        ))}
        
        {/* Checkbox de "Mostrar apenas pagos" */}
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            id="pagoFilter"
            checked={isPaidFilter}
            onChange={(e) => setIsPaidFilter(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="pagoFilter" className="font-semibold text-sm text-black">
            Mostrar apenas pagos
          </label>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto h-screen mt-0">
        <table className="min-w-full table-auto border-collapse border border-gray-900">
<thead className="sticky top-0 bg-gray-900 text-white text-sm z-10 shadow">
  <tr>
    {headers.map(({ label, key }) => (
      <th
        key={key}
        className="px-4 py-2 border-b text-xs text-center cursor-pointer"
        onClick={() => handleSort(key as keyof DataItem)}
      >
        {label}
        {sortConfig.key === key ? (
          sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽'
        ) : null}
      </th>
    ))}
  </tr>
</thead>
<tbody>
  {sortedData().filter(applyFilters).map((item, index) => {
    const isVencido = new Date(item.venceem) < new Date() && !item.pagoem;
    const isPago = item.pagoem;
    const isSelecionado = selectedRow === index;

    return (
      <tr
        key={index}
        onClick={() => handleRowClick(item)}
        className={`
          cursor-pointer transition 
          ${
            isSelecionado 
              ? 'bg-yellow-200' 
              : isVencido 
                ? 'bg-red-50' 
                : isPago 
                  ? 'bg-green-50' 
                  : 'hover:bg-gray-100'
          }
          rounded-xl
        `}
      >
        <td className="px-4 py-4 text-sm text-center">
          <div className="font-semibold">{formatCodigo(item.codigo)}</div>
        </td>
        <td className="px-4 py-4 text-sm text-center">
          <div className="">{formatDate(item.venceem)}</div>
          {isVencido && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-200 text-red-800">
              Vencido
            </span>
          )}
          {isPago && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-green-200 text-green-800">
              Pago
            </span>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-center">
          {item.empresa || <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-4 text-sm text-center">
          {item.cnpj || <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-4 text-sm text-center">
          {formatDate(item.lancadoem)}
        </td>
        <td className="px-4 py-4 text-sm text-center">
          <span className="font-medium">{formatCurrency(item.valor)}</span>
        </td>
        <td className="px-4 py-4 text-sm text-center">
          {item.origem || <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-4 text-sm text-center">
          {formatDate(item.pagoem)}
        </td>
      </tr>
    );
  })}
</tbody>

        </table>
         {/* Modal */}
      {isModalOpen && selectedRow && (
        <RowDetailsModal selectedRow={selectedRow} onClose={() => setIsModalOpen(false)} />
      )}
      </div>
    </div>
  );
}

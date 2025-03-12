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
      (!codigo || (item.codigo && item.codigo.toFixed(0).includes(codigo.toString()))) &&
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



  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "venceem" , direction: 'asc' });
  const handleSort = (key: keyof DataItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = () => {
    if (data.length === 0) return []; // Evita erro ao acessar data[0]
    let sortableData = [...data];
  
    if (sortConfig.key && sortConfig.key in data[0]) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
  
        // Se um dos valores for null ou undefined, move para o final
        if (aValue == null) return 1;
        if (bValue == null) return -1;
  
        // Ordenação para datas (certifica que são strings antes de parsear)
        if (["lancadoem", "venceem", "pagoem"].includes(sortConfig.key)) {
          return sortConfig.direction === "asc"
            ? parseDate(String(aValue)).getTime() - parseDate(String(bValue)).getTime()
            : parseDate(String(bValue)).getTime() - parseDate(String(aValue)).getTime();
        }
  
        // Comparação para strings (garante que são strings)
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue, 'pt-BR', { numeric: true })
            : bValue.localeCompare(aValue, 'pt-BR', { numeric: true });
        }
  
        // Comparação para números
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
  
        // Se for tipo misto (string + número), converte tudo para string antes de comparar
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue), 'pt-BR', { numeric: true })
          : String(bValue).localeCompare(String(aValue), 'pt-BR', { numeric: true });
      });
    }
  
    return sortableData;
  };

  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
    setIsModalOpen(true);
  };


  

  return (
    <div className="p-4 h-screen">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" >
        {["Origem", "Empresa", "CNPJ"].map((field) => (
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
          <thead className="sticky top-0 border border-gray-900 bg-gray-800 text-white text-xs">
            <tr>
              {["Código", "Vencimento", "Empresa", "CNPJ", "Lançado em", "Valor", "Origem", "Pago em"].map(header => (
                <th
                  key={header}
                  className="px-4 py-2 border-b text-xs text-center cursor-pointer"
                  onClick={() => handleSort(header.toLowerCase().replace(/\s+/g, '') as keyof DataItem)}
                >
                  {header}
                  {sortConfig.key === header.toLowerCase().replace(/\s+/g, '') ? (
                    sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽'
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData().filter(applyFilters).map((item, index) => (
              <tr
                key={index}
                className={`cursor-pointer ${
                  selectedRow === index ? "bg-yellow-300" : index % 2 === 0 ? "bg-red-50" : "bg-gray-200"
                } hover:bg-red-300`}
                onClick={() => handleRowClick(item)}
              >
                <td className="px-4 py-2 border-b text-xs text-center">{formatCodigo(item.codigo)}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{formatDate(item.venceem)}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{item.empresa || "-"}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{item.cnpj || "-"}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{formatDate(item.lancadoem)}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{formatCurrency(item.valor)}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{item.origem || "-"}</td>
                <td className="px-4 py-2 border-b text-xs text-center">{formatDate(item.pagoem)}</td>
              </tr>
            ))}
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

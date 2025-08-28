import { useState, useEffect } from "react";
import { supabase } from '../lib/superbase';
import RowDetailsModal from "./RowDetailsModal";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";



type DataItem = {
  origem: string;
  empresa: string;
  cnpj: string;
  lancadoem: string;
  valor: number;
  venceem: string
  pagoem: string;
  data: string;
  codigo: string;
  formapagamento: string;
};

const parseDate = (date: string | null) => date ? new Date(date) : new Date(0);

interface SortConfig {
  key: keyof DataItem 
  direction: 'asc' | 'desc';
}

export default function FilterableTable() {
  const [empresa, setEmpresa] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'tabela' | 'graficos'>('tabela');
  const [comprasData, setComprasData] = useState<any[]>([])
  const [showPaid, setShowPaid] = useState(false);
const [showUnpaid, setShowUnpaid] = useState(false);


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
    try {
      // 1️⃣ Buscar provisão de pagamentos
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from('provisao_pagamentos')
        .select('*')
        .order('lancadoem', { ascending: false });

      if (pagamentosError) {
        console.error('Erro ao buscar provisão de pagamentos:', pagamentosError);
        return;
      }

      if (!Array.isArray(pagamentosData)) {
        console.error('Provisão de pagamentos não é array:', pagamentosData);
        return;
      }

      // Garante que o código seja string
      const parsedPagamentos = pagamentosData.map(item => ({
        ...item,
        codigo: String(item.codigo)
      }));

      setData(parsedPagamentos);

      // 2️⃣ Buscar itens da tabela gerenciamentodecomprar usando os códigos
      const codigos = parsedPagamentos.map(item => item.codigo);

      // Se não houver códigos, não faz fetch
      if (codigos.length === 0) return;

      const { data: comprasData, error: comprasError } = await supabase
        .from('gerenciamento_compras')
        .select('*')
        .in('codigo', codigos); // busca todos os itens que tenham código na lista

      if (comprasError) {
        console.error('Erro ao buscar itens de gerenciamentodecomprar:', comprasError);
        return;
      }

      setComprasData(comprasData || []); // criar um state: const [comprasData, setComprasData] = useState<any[]>([]);

    } catch (err) {
      console.error('Erro no fetch combinado:', err);
    }
  };

  fetchData();
}, []);






  const formatDate = (date: string | number | null) => {
    if (!date) return "-";
    return new Date(String(date)).toLocaleDateString('pt-BR');
  };
  
const formatCodigo = (codigo: any) => {
  if (codigo == null || codigo === "") return "-";

  const codStr = String(codigo);

  // Remove espaços e verifica se é número puro
  const cleanCode = codStr.trim();

  // Se for um número muito grande, evita notação científica
  if (!isNaN(Number(cleanCode))) {
    return cleanCode;
  }

  // Se não for número, apenas retorna como string limpa
  return cleanCode;
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

   const matchPaid =
    (showPaid && !!item.pagoem) || (showUnpaid && !item.pagoem) || (!showPaid && !showUnpaid);

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
      matchPaid
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

const filteredData = sortedData().filter(applyFilters);



  const handleRowClick = (rowData: any) => {
    setSelectedRow(rowData);
    setIsModalOpen(true);
  };



  // Agrupar por fornecedor e somar valores
const fornecedoresAgrupados = Object.values(
  filteredData.reduce((acc: any, item: DataItem) => {
    const nomeFornecedor = item.empresa || "Sem fornecedor";
    if (!acc[nomeFornecedor]) {
      acc[nomeFornecedor] = { empresa: nomeFornecedor, valor: 0 };
    }
    acc[nomeFornecedor].valor += item.valor || 0;
    return acc;
  }, {})
);

// Ordenar do maior para o menor valor
const fornecedoresOrdenados = fornecedoresAgrupados.sort((a: any, b: any) => b.valor - a.valor);




  

  return (
    <div className="p-4 h-screen">

 <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActiveTab('tabela')}
        className={`px-3 py-1 rounded ${activeTab === 'tabela' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
      >
        Tabela
      </button>
      <button
        onClick={() => setActiveTab('graficos')}
        className={`px-3 py-1 rounded ${activeTab === 'graficos' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
      >
        Gráficos
      </button>
    </div>

 {/* ABA TABELA */}
    {activeTab === 'tabela' && (
      <>

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
{/* Filtros de Pagamento */}
<div className="flex flex-col mt-4 gap-2 w-max">
  <button
    onClick={() => {
      // Se já estava ativo, desmarca; caso contrário, marca e desmarca o outro
      setShowPaid((prev) => {
        const newState = !prev
        if (newState) setShowUnpaid(false)
        return newState
      })
    }}
    className={`px-3 py-1 rounded text-xs font-medium transition
      ${showPaid 
        ? "bg-green-200 text-green-800" 
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
  >
    Pagos
  </button>

  <button
    onClick={() => {
      setShowUnpaid((prev) => {
        const newState = !prev
        if (newState) setShowPaid(false)
        return newState
      })
    }}
    className={`px-3 py-1 rounded text-xs font-medium transition
      ${showUnpaid 
        ? "bg-red-200 text-red-800" 
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
  >
    Não pagos
  </button>
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
      </>
    )}

 {/* ABA GRÁFICOS */}
{/* ABA GRÁFICOS */}
{/* ABA GRÁFICOS */}
{/* ABA GRÁFICOS */}
{activeTab === "graficos" && (
  <div className="graficos-tab space-y-6">
    <h2 className="text-2xl font-bold mb-4">Relatórios</h2>

    {/* Cards de Resumo */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-green-100 rounded-2xl shadow">
        <p className="text-sm font-medium">Total de valores</p>
        <p className="text-xl font-bold text-green-700">
          R${" "}
          {filteredData
            .reduce((acc, item) => acc + (item.valor || 0), 0)
            .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="p-4 bg-blue-100 rounded-2xl shadow">
        <p className="text-sm font-medium">Itens pagos</p>
        <p className="text-xl font-bold text-blue-700">
          {filteredData.filter((i) => i.pagoem).length}
        </p>
      </div>
      <div className="p-4 bg-red-100 rounded-2xl shadow">
        <p className="text-sm font-medium">Itens não pagos</p>
        <p className="text-xl font-bold text-red-700">
          {filteredData.filter((i) => !i.pagoem).length}
        </p>
      </div>
    </div>

    {/* Gráfico de Pizza - Pagos vs Não pagos */}
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Pagos x Não pagos</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={[
              {
                name: "Pagos",
                value: filteredData.reduce(
                  (acc, item) => acc + (item.pagoem ? item.valor || 0 : 0),
                  0
                ),
              },
              {
                name: "Não pagos",
                value: filteredData.reduce(
                  (acc, item) => acc + (!item.pagoem ? item.valor || 0 : 0),
                  0
                ),
              },
            ]}
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={60}
            paddingAngle={4}
            dataKey="value"
            label={({ name, value }) =>
              `${name}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          >
            <Cell fill="#34d399" />
            <Cell fill="#fbbf24" />
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Gráfico de Barras - Valores por fornecedor */}
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Valores por fornecedor
      </h3>
      {(() => {
        const fornecedoresData = Object.values(
          filteredData.reduce((acc: any, item: any) => {
            const fornecedor = item.empresa || "Sem fornecedor";
            if (!acc[fornecedor]) acc[fornecedor] = { empresa: fornecedor, valor: 0 };
            acc[fornecedor].valor += item.valor || 0;
            return acc;
          }, {})
        );

        const fornecedoresOrdenados = fornecedoresData.sort((a: any, b: any) => b.valor - a.valor);

        const chartHeight = Math.max(fornecedoresOrdenados.length * 50, 400);

        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={fornecedoresOrdenados}
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
              <YAxis dataKey="empresa" type="category" width={150} />
              <Tooltip
                formatter={(value: number) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
              <Bar dataKey="valor" fill="url(#fornecedorGradient)" radius={[8, 8, 8, 8]} barSize={30} />
              <defs>
                <linearGradient id="fornecedorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        );
      })()}
    </div>

{/* Gráfico de Barras - Forma de Pagamento */}
<div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md p-6">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">
    Valores por forma de pagamento
  </h3>
  {(() => {
    // 1️⃣ Agrupar os valores por forma de pagamento
    const formasPagamentoData = Object.values(
      filteredData.reduce((acc: any, item: DataItem) => {
        const forma = item.formapagamento || "Sem forma";
        if (!acc[forma]) acc[forma] = { forma, valor: 0 };

        // Somar apenas valores válidos
        acc[forma].valor += Number(item.valor) || 0;
        return acc;
      }, {})
    );

    // 2️⃣ Ordenar do maior para o menor
    const formasPagamentoOrdenadas = formasPagamentoData.sort(
      (a: any, b: any) => b.valor - a.valor
    );

    // 3️⃣ Altura dinâmica
    const chartHeight = Math.max(formasPagamentoOrdenadas.length * 50, 300);

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={formasPagamentoOrdenadas}
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            tickFormatter={(value) =>
              `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
          <YAxis dataKey="forma" type="category" width={150} />
          <Tooltip
            formatter={(value: number) =>
              `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            }
          />
          <Bar
            dataKey="valor"
            fill="url(#paymentGradient)"
            radius={[8, 8, 8, 8]}
            barSize={30}
          />
          <defs>
            <linearGradient id="paymentGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    );
  })()}
</div>

  </div>
)}



  </div>
);
}

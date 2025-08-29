'use client'
import { useState, useEffect } from "react";
import { supabase } from "../lib/superbase";
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

type Produto = {
  id: number;
  codigo: string;
  fornecedor: string;
  data_compra: string | null;
  nome: string;
  valor_unitario: number;
  und: string;
  marca: string;
  tipo: string;
  gerenciamento_compras?: { nf: string }[];
  nfLink: string | null;       // já existia antes
  nfFileName: string | null;  // <-- adiciona aqui
};

export default function ProdutosAnalise() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [activeTab, setActiveTab] = useState<"tabela" | "graficos">("tabela");
  const [filters, setFilters] = useState<{ [key: string]: string }>({
    codigo: "",
    fornecedor: "",
    produto: "",
    tipo: "",
    marca: "",
    dataInicio: "",
    dataFim: "",
    valorMin: "",
    valorMax: "",
  });

useEffect(() => {
  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        id,
        codigo,
        fornecedor,
        data_compra,
        nome,
        valor_unitario,
        und,
        marca,
        tipo,
        gerenciamento_compras!inner(nf)
      `)
      .order("data_compra", { ascending: false });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }

    console.log("Retorno bruto do Supabase:", data); // 🔹 Log inicial

const produtosComNF = (data as any).map((item: any) => {
  let nfFileName: string | null = null;
  const ger = item.gerenciamento_compras;
  if (ger) {
    nfFileName = Array.isArray(ger) ? ger[0]?.nf : ger.nf;
  }

  return {
    ...item,
    nfFileName,
  };
});
setProdutos(produtosComNF);

    setProdutos(produtosComNF);
  };

  fetchProdutos();
}, []);


const abrirNF = async (nfFileName: string | null) => {
  if (!nfFileName) return alert("Sem NF para este item.");

  let url: string;

  if (nfFileName.startsWith("https")) {
    url = nfFileName;
  } else {
    const { data: signedUrlData, error } = await supabase
      .storage
      .from("notas-fiscais")
      .createSignedUrl(nfFileName, 60);

    if (error) {
      console.error("Erro ao gerar URL assinada:", error);
      return alert("Erro ao abrir a nota fiscal.");
    }

    url = signedUrlData.signedUrl;
  }

  window.open(url, "_blank");
};


  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "R$ 0,00";
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    
  };





  const applyFilters = (item: Produto) => {
    const { codigo, fornecedor, produto, tipo, marca, dataInicio, dataFim, valorMin, valorMax } = filters;

    return (
      (!codigo || item.codigo?.toLowerCase().includes(codigo.toLowerCase())) &&
      (!fornecedor || item.fornecedor?.toLowerCase().includes(fornecedor.toLowerCase())) &&
      (!produto || item.nome?.toLowerCase().includes(produto.toLowerCase())) &&
      (!tipo || item.tipo?.toLowerCase().includes(tipo.toLowerCase())) &&
      (!marca || item.marca?.toLowerCase().includes(marca.toLowerCase())) &&
      (!dataInicio || (item.data_compra && new Date(item.data_compra) >= new Date(dataInicio))) &&
      (!dataFim || (item.data_compra && new Date(item.data_compra) <= new Date(dataFim))) &&
      (!valorMin || item.valor_unitario >= parseFloat(valorMin)) &&
      (!valorMax || item.valor_unitario <= parseFloat(valorMax))
    );
  };

  const filteredData = produtos.filter(applyFilters);

  return (
    <div className="p-4 h-screen">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("tabela")}
          className={`px-3 py-1 rounded ${activeTab === "tabela" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Tabela
        </button>
        <button
          onClick={() => setActiveTab("graficos")}
          className={`px-3 py-1 rounded ${activeTab === "graficos" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Gráficos
        </button>
      </div>

      {/* TABELA */}
      {activeTab === "tabela" && (
        <>
<>
 {/* Painel de Filtros */}
{/* Linha 1: Código, Produto, Fornecedor, Marca */}
<div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
  {["codigo", "produto", "fornecedor", "marca"].map((field) => (
    <div key={field} className="relative">
      <input
        type="text"
        id={field}
        placeholder=" "
        className="peer w-full p-3 border rounded-xl shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={filters[field] || ""}
        onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-3 text-gray-400 text-sm transition-all 
                   peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
                   peer-focus:-top-2 peer-focus:text-blue-500 peer-focus:text-xs bg-white px-1"
      >
        {field.charAt(0).toUpperCase() + field.slice(1)}
      </label>
    </div>
  ))}
</div>

{/* Linha 2: Tipo, Valor Mínimo, Valor Máximo */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
  {["tipo", "valorMin", "valorMax"].map((field) => (
    <div key={field} className="relative">
      <input
        type={field.includes("valor") ? "number" : "text"}
        id={field}
        placeholder=" "
        className="peer w-full p-3 border rounded-xl shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={filters[field] || ""}
        onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-3 text-gray-400 text-sm transition-all 
                   peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
                   peer-focus:-top-2 peer-focus:text-blue-500 peer-focus:text-xs bg-white px-1"
      >
        {field === "valorMin"
          ? "Valor Mínimo"
          : field === "valorMax"
          ? "Valor Máximo"
          : "Tipo"}
      </label>
    </div>
  ))}
</div>

{/* Linha 3: Data Início e Data Fim */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
  {["dataInicio", "dataFim"].map((field) => (
    <div key={field} className="relative">
      <input
        type="date"
        id={field}
        placeholder=" "
        className="peer w-full p-3 border rounded-xl shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={filters[field]}
        onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-3 text-gray-400 text-sm transition-all 
                   peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm
                   peer-focus:-top-2 peer-focus:text-blue-500 peer-focus:text-xs bg-white px-1"
      >
        {field === "dataInicio" ? "Data Início" : "Data Fim"}
      </label>
    </div>
  ))}
</div>


</>


          {/* Tabela */}
{/* Tabela */}
<div className="overflow-x-auto h-[70vh] border rounded-lg shadow">
  <table className="min-w-full table-auto border-collapse">
    <thead className="sticky top-0 bg-gray-900 text-white text-sm">
      <tr>
        <th className="px-4 py-2">Código</th>
        <th className="px-4 py-2">Nome</th>
        <th className="px-4 py-2">Fornecedor</th>
        <th className="px-4 py-2">Marca</th>
        <th className="px-4 py-2">Tipo</th>
        <th className="px-4 py-2">Und</th>
        <th className="px-4 py-2">Data compra</th>
        <th className="px-4 py-2">Valor unitário</th>
        <th className="px-4 py-2">NF</th>
      </tr>
    </thead>
    <tbody>
      {filteredData.map((item, index) => (
        <tr
          key={item.id}
          className={`text-sm text-center cursor-pointer ${
            index % 2 === 0 ? "bg-gray-50" : "bg-white"
          } hover:bg-blue-100`}
          onClick={() => item.gerenciamento_compras?.[0]?.nf && window.open(item.gerenciamento_compras[0].nf, "_blank")}

        >
          <td className="px-4 py-2">{item.codigo}</td>
          <td className="px-4 py-2">{item.nome}</td>
          <td className="px-4 py-2">{item.fornecedor}</td>
          <td className="px-4 py-2">{item.marca}</td>
          <td className="px-4 py-2">{item.tipo}</td>
          <td className="px-4 py-2">{item.und}</td>
          <td className="px-4 py-2">{formatDate(item.data_compra)}</td>
          <td className="px-4 py-2 font-medium">{formatCurrency(item.valor_unitario)}</td>
<td
  className="px-4 py-2 text-blue-600 underline cursor-pointer"
  onClick={() => abrirNF(item.nfFileName)}
>
  {item.nfFileName ? "Abrir NF" : "-"}
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        </>
      )}

      {/* GRÁFICOS */}
      {activeTab === "graficos" && (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-100 rounded-2xl shadow">
              <p className="text-sm">Total de produtos</p>
              <p className="text-2xl font-bold">{filteredData.length}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-2xl shadow">
              <p className="text-sm">Valor total</p>
              <p className="text-2xl font-bold">
                R${" "}
                {filteredData
                  .reduce((acc, item) => acc + (item.valor_unitario || 0), 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-yellow-100 rounded-2xl shadow">
              <p className="text-sm">Fornecedores distintos</p>
              <p className="text-2xl font-bold">{new Set(filteredData.map((p) => p.fornecedor)).size}</p>
            </div>
          </div>

          {/* Gráfico de barras por fornecedor */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Valores por fornecedor</h3>
            {(() => {
              const fornecedoresData = Object.values(
                filteredData.reduce((acc: any, item: Produto) => {
                  const f = item.fornecedor || "Sem fornecedor";
                  if (!acc[f]) acc[f] = { fornecedor: f, valor: 0 };
                  acc[f].valor += item.valor_unitario || 0;
                  return acc;
                }, {})
              );

              const chartHeight = Math.max(fornecedoresData.length * 40, 300);

              return (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={fornecedoresData} layout="vertical" margin={{ top: 20, right: 30, left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                    <YAxis type="category" dataKey="fornecedor" />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[6, 6, 0, 0]} />
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

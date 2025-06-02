'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/superbase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
PieChart,
  Pie,
  Cell, 
} from 'recharts'

import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  addDays, 
  addMonths, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear 
} from 'date-fns'
const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"]; // Paleta lilás/violeta

type ChartType = 'Documentos' | 'Parcela x Total' | 'Centros de Custo' | 'Formas de Pagamento'
type Period = 'Semana' | 'Quinzena' | 'Mês' | 'Bimestre' | 'Trimestre' | 'Semestre' | 'Ano'

export default function GraficoCompras() {
  const [period, setPeriod] = useState<Period>('Mês')
  const [chartType, setChartType] = useState<ChartType>('Documentos')
  const [dataCompras, setDataCompras] = useState<any[]>([])
  const [dataProvisao, setDataProvisao] = useState<any[]>([])
    const [dataCentros, setDataCentros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<{ formapagamento: string; valor: number }[]>([]);
  const hoje = new Date().toISOString().split('T')[0]; // 🔥 gera a data de hoje
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);




const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
  <div
    style={{
      background: "linear-gradient(135deg,rgb(59, 59, 59),rgb(121, 100, 100),rgb(97, 86, 86))",
      padding: "10px 15px",
      borderRadius: 8,
          boxShadow: `
      0 0 10px rgba(99, 102, 241, 0.6), 
      0 0 20px rgba(99, 102, 241, 0.4),
      0 8px 16px rgba(0, 0, 0, 0.8)
    `,
      color: "#eee",
      fontSize: 14,
      fontFamily: "'Inter', sans-serif",
    }}
      >
        <p style={{ margin: 0, fontWeight: "600" }}>{label}</p>
        <p style={{ margin: 0 }}>
          Valor:{" "}
          <strong>
            R${" "}
            {Number(payload[0].value).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </strong>
        </p>
      </div>
    );
  }

  return null;
};



useEffect(() => {
  buscarDados();
}, [period, dataSelecionada]);

const buscarDados = async () => {
  setLoading(true);



  const intervalo = (() => {
    const base = new Date(dataSelecionada); // 🔥 Usando a data selecionada como referência
    switch (period) {
      case 'Semana':
        return { start: startOfWeek(base ), end: endOfWeek(base ) };
      case 'Quinzena':
        return { start: base , end: addDays(base , 14) };
      case 'Mês':
        return { start: startOfMonth(base), end: endOfMonth(base ) };
      case 'Bimestre':
        return { start: startOfMonth(base), end: endOfMonth(addMonths(base  , 1)) };
      case 'Trimestre':
        return { start: startOfQuarter(base ), end: endOfQuarter(base ) };
      case 'Semestre':
        return { start: startOfMonth(base ), end: endOfMonth(addMonths(base , 5)) };
      case 'Ano':
        return { start: startOfYear(base ), end: endOfYear(base ) };
      default:
        return { start: base , end: base  };
    }
  })();

  console.log('📅 Intervalo:', intervalo);

  try {
    // 🔸 Compras
    const { data: compras, error: errorCompras } = await supabase
      .from('gerenciamento_compras')
      .select('comprovante, valor_liquido, data_compra')
      .gte('data_compra', (intervalo.start as Date).toISOString())
      .lte('data_compra', (intervalo.end as Date).toISOString());

    if (errorCompras) throw errorCompras;
    console.log('🛒 Dados compras:', compras);

    const agrupadoCompras = compras?.reduce((acc: any, item: any) => {
      const chave = item.comprovante || 'Outro';
      acc[chave] = (acc[chave] || 0) + (item.valor_liquido || 0);
      return acc;
    }, {});

    const dadosGraficoCompras = Object.entries(agrupadoCompras).map(
      ([comprovante, valor]) => ({
        comprovante,
        valor: Number(valor),
      })
    );

    console.log('📊 Gráfico Compras:', dadosGraficoCompras);
    setDataCompras(dadosGraficoCompras);

    // 🔸 Provisão
    const { data: provisao, error: errorProvisao } = await supabase
      .from('provisao_pagamentos')
      .select('codigo, valor_total, valor, data_compra, venceem')
      .gte('data_compra', (intervalo.start as Date).toISOString())
      .lte('data_compra', (intervalo.end as Date).toISOString());

    if (errorProvisao) throw errorProvisao;
    console.log('💰 Dados Provisão:', provisao);

    const valorTotalPorCodigo: Record<string, number> = {};
    provisao?.forEach((item: any) => {
      const codigo = item.codigo || 'Outro';
      if (!valorTotalPorCodigo[codigo]) {
        valorTotalPorCodigo[codigo] = item.valor_total || 0;
      }
    });

    const parcelasDentroDoPeriodo = provisao?.filter((item: any) => {
      const dataVencimento = new Date(item.venceem);
      return dataVencimento >= intervalo.start && dataVencimento <= intervalo.end;
    });

    console.log('📆 Parcelas no período:', parcelasDentroDoPeriodo);

    const valorParcelaPorCodigo = parcelasDentroDoPeriodo?.reduce(
      (acc: any, item: any) => {
        const codigo = item.codigo || 'Outro';
        acc[codigo] = (acc[codigo] || 0) + (item.valor || 0);
        return acc;
      },
      {}
    );

    const codigos = Array.from(
      new Set([
        ...Object.keys(valorTotalPorCodigo),
        ...Object.keys(valorParcelaPorCodigo),
      ])
    );

    const dadosGraficoProvisao = codigos.map((codigo) => ({
      codigo,
      valor_total: valorTotalPorCodigo[codigo] || 0,
      valor_parcela: valorParcelaPorCodigo?.[codigo] || 0,
    }));

    console.log('📊 Gráfico Provisão:', dadosGraficoProvisao);
    setDataProvisao(dadosGraficoProvisao);

    // 🔸 Centros de Custo
    const { data: centros, error: errorCentros } = await supabase
      .from('centros_de_custo')
      .select('centro, valor, data_compra')
      .gte('data_compra', (intervalo.start as Date).toISOString())
      .lte('data_compra', (intervalo.end as Date).toISOString());

    if (errorCentros) throw errorCentros;
    console.log('🏢 Dados Centros:', centros);

    const agrupadoCentros = centros?.reduce((acc: any, item: any) => {
      const chave = item.centro || 'Outro';
      acc[chave] = (acc[chave] || 0) + (item.valor || 0);
      return acc;
    }, {});

    const dadosGraficoCentros = Object.entries(agrupadoCentros).map(
      ([centro, valor]) => ({
        centro,
        valor: Number(valor),
      })
    );

    console.log('📊 Gráfico Centros:', dadosGraficoCentros);
    setDataCentros(dadosGraficoCentros);

    // 🔸 Forma de Pagamento
    const { data: pagamentos, error: errorPagamentos } = await supabase
      .from('provisao_pagamentos')
      .select('formapagamento, valor, data_compra')
      .gte('data_compra', (intervalo.start as Date).toISOString())
      .lte('data_compra', (intervalo.end as Date).toISOString());

    if (errorPagamentos) throw errorPagamentos;
    console.log('💳 Dados Pagamentos:', pagamentos);

    const pagamentosFiltrados = pagamentos?.filter(
      (item: any) => item.formapagamento && item.formapagamento.trim() !== ''
    );

    const agrupadoPagamentos = pagamentosFiltrados?.reduce((acc: any, item: any) => {
      const chave = item.formapagamento;
      acc[chave] = (acc[chave] || 0) + (item.valor || 0);
      return acc;
    }, {});

    const dadosGraficoPagamentos = Object.entries(agrupadoPagamentos).map(
      ([formapagamento, valor]) => ({
        formapagamento,
        valor: Number(valor),
      })
    );

    console.log('📊 Gráfico Formas de Pagamento:', dadosGraficoPagamentos);
    setDados(dadosGraficoPagamentos);
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
  } finally {
    setLoading(false);
  }
};










return (
  <div className="w-full border rounded-xl bg-white p-6">
    {/* 🔹 Filtros */}
    <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
      <select
        className="border rounded-md px-3 py-1 text-sm"
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
      >
        {['Semana','Quinzena','Mês','Bimestre','Trimestre','Semestre','Ano'].map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
  {/* Input de data */}
  <input
    type="date"
    className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    value={dataSelecionada}
    onChange={(e) => setDataSelecionada(e.target.value)}
  />
  </div>

      <div className="flex gap-2">
        {['Documentos','Parcela x Total','Centros de Custo','Formas de Pagamento'].map(c => (
          <button
            key={c}
            onClick={() => setChartType(c as ChartType)}
            className={`px-4 py-1 rounded-full border 
            ${chartType === c ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-indigo-50'} 
            text-sm`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>

    {loading ? (
      <p className="text-center">Carregando...</p>
    ) : (
      <>
        {/* 🔸 Gráfico de Compras */}
        {chartType === 'Documentos' && (
          <div
            className="mb-10 p-6 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #0f0f0f, #1a1a2e, #0f0f0f)",
              boxShadow: "0 4px 20px rgba(100, 100, 255, 0.3)",
            }}
          >
            <h3
              className="text-center mb-6"
              style={{
                color: "#e0e0e0",
                fontWeight: "700",
                fontSize: "1.5rem",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "1.5px",
              }}
            >
              📄 Origem das Compras - {period}
            </h3>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={dataCompras}
                margin={{ top: 20, right: 30, left: 40, bottom: 30 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#333" />
                <XAxis
                  dataKey="comprovante"
                  stroke="#bbb"
                  tick={{ fill: "#bbb", fontSize: 14, fontWeight: "600" }}
                  tickLine={false}
                  axisLine={{ stroke: "#444" }}
                />
                <YAxis
                  stroke="#bbb"
                  tick={{ fill: "#bbb", fontSize: 14, fontWeight: "600" }}
                  tickLine={false}
                  axisLine={{ stroke: "#444" }}
                  tickFormatter={(value) =>
                    `R$ ${value.toLocaleString("pt-BR")}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="valor"
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                  animationDuration={800}
                  activeBar={{ fill: "#4f46e5" }}
                >
                  {dataCompras.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 🔸 Gráfico de Provisão */}
        {chartType === 'Parcela x Total' && (
          <div
            className="mb-10 p-6 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #0f0f0f, #1a1a2e, #0f0f0f)",
              boxShadow: "0 4px 20px rgba(100, 100, 255, 0.3)",
            }}
          >
            <h3 className="text-xl font-semibold mb-4 text-center text-slate-200">
              📑 Parcela vs Valor Total - {period}
            </h3>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                layout="vertical"
                data={dataProvisao}
                margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  type="number"
                  tick={{ fill: "#aaa" }}
                  axisLine={{ stroke: "#555" }}
                />
                <YAxis
                  type="category"
                  dataKey="codigo"
                  width={140}
                  tick={{ fontSize: 13, fill: "#ccc" }}
                  axisLine={{ stroke: "#555" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e1e1e",
                    border: "1px solid #333",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#eee" }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(value: any) =>
                    `R$ ${Number(value).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Legend wrapperStyle={{ color: "#ccc" }} iconType="circle" />

                <Bar
                  dataKey="valor_total"
                  name="Valor Total"
                  fill="url(#colorTotal)"
                  radius={[6, 6, 6, 6]}
                  barSize={20}
                />
                <Bar
                  dataKey="valor_parcela"
                  name="Valor Parcela"
                  fill="url(#colorParcela)"
                  radius={[6, 6, 6, 6]}
                  barSize={20}
                />

                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#065f46" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorParcela" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 🔸 Gráfico de Centros */}
        {chartType === 'Centros de Custo' && (
          <div className="w-full border mt-10 bg-gray-100 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-center mb-4">
              🥧 Gráfico de Centros de Custo - {period}
            </h2>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dataCentros}
                  dataKey="valor"
                  nameKey="centro"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dataCentros.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    `R$ ${Number(value).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 🔸 Gráfico de Pagamento */}
        {chartType === 'Formas de Pagamento' && (
          <div className="w-full h-[450px] bg-white rounded-xl shadow p-5">
            <h2 className="text-xl font-semibold mb-4">
              Provisão de Pagamentos - Formas de Pagamento
            </h2>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dados}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="formapagamento"
                  tick={{ fontSize: 14 }}
                />
                <Tooltip
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString("pt-BR")}`
                  }
                />
                <Bar
                  dataKey="valor"
                  fill="#6366f1"
                  barSize={30}
                  radius={[10, 10, 10, 10]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    )}
  </div>
)

}

'use client'

import { useEffect, useState } from 'react'
import VisualizarPedidoModal from './VisualizarPedidoModal'

type Pedido = {
  id: number
  nome_pedido: string
  status: string
  data: string
  orcamentos: string
  observacao: string
}

export default function PedidosList() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)

  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    const fetchPedidos = async () => {
      const params = new URLSearchParams()

      if (statusFiltro !== 'Todos') params.append('status', statusFiltro)
      if (filtro) params.append('q', filtro)
      if (dataInicio) params.append('data_inicio', dataInicio)
      if (dataFim) params.append('data_fim', dataFim)

      const res = await fetch(`/api/pedidos?${params.toString()}`)
      const data = await res.json()
      setPedidos(data)
    }

    fetchPedidos()
  }, [filtro, statusFiltro, dataInicio, dataFim])

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Pesquisar por nome do pedido..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <select
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/4"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          <option value="Todos">Todos os status</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Pendente">Pendente</option>
          <option value="Rejeitado">Rejeitado</option>
        </select>

        <input
          type="date"
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/6"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          placeholder="Data início"
        />

        <input
          type="date"
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/6"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          placeholder="Data fim"
        />
      </div>

      {/* Lista de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.map((pedido) => {
          let corBg = 'bg-gray-100'
          let corText = 'text-gray-600'
          let corBorda = 'border-gray-300'

          if (pedido.status === 'Aprovado') {
            corBg = 'bg-green-100'
            corText = 'text-green-700'
            corBorda = 'border-green-400'
          } else if (pedido.status === 'Pendente') {
            corBg = 'bg-yellow-100'
            corText = 'text-yellow-700'
            corBorda = 'border-yellow-400'
          } else if (pedido.status === 'Rejeitado') {
            corBg = 'bg-red-100'
            corText = 'text-red-600'
            corBorda = 'border-red-400'
          }

          return (
            <div
              key={pedido.id}
              onClick={() => setPedidoSelecionado(pedido)}
              className={`group rounded-xl ${corBorda} border-l-4 p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer`}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                📝 Pedido #{pedido.id}
              </h2>

              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${corBg} ${corText}`}>
                {pedido.status}
              </span>

              <p className="text-gray-700 mt-3 font-medium">{pedido.nome_pedido}</p>

              <p className="text-sm text-gray-500">📅 {new Date(pedido.data).toLocaleDateString()}</p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setPedidoSelecionado(pedido)
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Ver detalhes
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {pedidoSelecionado && (
        <VisualizarPedidoModal
          pedido={pedidoSelecionado}
          onCloseAction={() => setPedidoSelecionado(null)}
        />
      )}
    </>
  )
}

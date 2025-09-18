'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/superbase'
import FiltrosPedidos, { FiltroProps } from '@/components/FiltrosPedidosdecompra'

interface Observacao {
  texto: string
  data: string
  usuario: string
}

interface Pedido {
  id: number
  id_solicitante: string
  created_at: string
  materiais: string
  centro_custo: string
  ordem_servico: string
  status: string
  observacoes: string
  id_compra: string
  // campos extras para orçamentos
  fornecedor1?: string
  orcamento_url1?: string
  fornecedor2?: string
  orcamento_url2?: string
  fornecedor3?: string
  orcamento_url3?: string
}

export default function AcompanhamentoPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [openObs, setOpenObs] = useState<number | null>(null)

const [filtros, setFiltros] = useState<FiltroProps>({
  status: '',
  destino: '',
  solicitante: '',
  dataInicio: '',
  dataFim: '',
  semNota: 'nenhum', // ← valor inicial válido
})

  const [destinos, setDestinos] = useState<string[]>([])
  const [solicitantes, setSolicitantes] = useState<string[]>([])

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from('Pedidosdecompra')
        .select('*')

      if (error) {
        console.error('Erro ao buscar pedidos:', error)
        return
      }

      if (data) {
        setPedidos(data as Pedido[])
        setDestinos(Array.from(new Set(data.map((p: any) => p.centro_custo))).filter(Boolean))
        setSolicitantes(Array.from(new Set(data.map((p: any) => p.id_solicitante))).filter(Boolean))
      }
    }

    fetchPedidos()
  }, [])

  const toggleObs = (id: number) => {
    setOpenObs(openObs === id ? null : id)
  }

  const parseObservacoes = (obsStr: string): Observacao[] => {
    if (!obsStr) return []
    return obsStr.split('|||').map((item) => {
      const [texto, data, usuario] = item.split(';;;')
      return { texto, data, usuario }
    })
  }

  
  const parseMateriais = (materiaisStr: string) => {
    try {
      const arr = JSON.parse(materiaisStr)
      return arr.map((m: any) => `${m.nome} (${m.quantidade} ${m.unidade})`).join(', ')
    } catch {
      return materiaisStr
    }
  }

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtros.status && p.status !== filtros.status) return false
    if (filtros.destino && p.centro_custo !== filtros.destino) return false
    if (filtros.solicitante && p.id_solicitante !== filtros.solicitante) return false
    if (filtros.dataInicio && new Date(p.created_at) < new Date(filtros.dataInicio)) return false
    if (filtros.dataFim && new Date(p.created_at) > new Date(filtros.dataFim)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FiltrosPedidos
        destinos={destinos}
        solicitantes={solicitantes}
        onFiltrarAction={setFiltros}
      />

      {/* Cabeçalho */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4 bg-[#5a0d0d] text-white p-2 rounded-t-xl font-medium text-sm">
        <span>Número</span>
        <span>Solicitante</span>
        <span>Materiais</span>
        <span>Destino</span>
        <span>Status</span>
        <span>Data Solicitação</span>
        <span>Observações</span>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white shadow-md rounded-b-xl p-4 space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum pedido encontrado.</p>
        ) : (
          pedidosFiltrados.map((p) => {
            const obsArray = parseObservacoes(p.observacoes)
            const ultimaObs = obsArray[obsArray.length - 1]

            return (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="grid grid-cols-2 md:grid-cols-10 gap-2 md:gap-4 text-sm">
                  <span>{p.id_compra}</span>
                  <span>{p.id_solicitante}</span>
                  <span>{parseMateriais(p.materiais)}</span>
                  <span>{p.centro_custo}</span>
                  <span>{p.status}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span>
                    {p.fornecedor1 && (
                      <a href={p.orcamento_url1} target="_blank" className="text-blue-500 underline">{p.fornecedor1}</a>
                    )}
                  </span>
                  <span>
                    {p.fornecedor2 && (
                      <a href={p.orcamento_url2} target="_blank" className="text-blue-500 underline">{p.fornecedor2}</a>
                    )}
                  </span>
                  <span>
                    {p.fornecedor3 && (
                      <a href={p.orcamento_url3} target="_blank" className="text-blue-500 underline">{p.fornecedor3}</a>
                    )}
                  </span>
                  <span
                    className="cursor-pointer text-[#5a0d0d] hover:underline"
                    onClick={() => toggleObs(p.id)}
                  >
                    {ultimaObs ? ultimaObs.texto : 'Sem observação'}
                  </span>
                </div>

                {openObs === p.id && obsArray.length > 1 && (
                  <div className="mt-2 p-3 border-l-2 border-[#5a0d0d] rounded-l-lg bg-gray-50 space-y-2">
                    {obsArray.slice(0, -1).map((obs, idx) => (
                      <div key={idx} className="flex flex-col p-2 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500">{obs.data} - {obs.usuario}</span>
                        <span className="text-sm text-gray-700">{obs.texto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
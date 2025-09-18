'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/superbase'
import FiltrosPedidos, { FiltroProps } from '@/components/FiltrosPedidosdecompra'
import { useUser } from '@/components/UserContext';

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
  fornecedor1?: string
  orcamento_url1?: string
  fornecedor2?: string
  orcamento_url2?: string
  fornecedor3?: string
  orcamento_url3?: string
  profiles?: { nome: string }
}

export default function AcompanhamentoPedidos() {
  const { nome } = useUser();
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [openObs, setOpenObs] = useState<number | null>(null)
  const [novaObs, setNovaObs] = useState<{ [key: number]: string }>({})

  // filtros adaptados
  const [filtros, setFiltros] = useState<FiltroProps>({
    status: 'todos',
    centroCusto: 'todos',
    solicitante: 'todos',
    ordemServico: 'todos',
    dataInicio: '',
    dataFim: '',
  })

  const [centrosCusto, setCentrosCusto] = useState<string[]>([])
  const [solicitantes, setSolicitantes] = useState<string[]>([])
  const [ordensServico, setOrdensServico] = useState<string[]>([])

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from('pedidosdecompra')
        .select(`
          *,
          profiles ( nome )
        `)

      if (error) {
        console.error('Erro ao buscar pedidos:', error)
        return
      }

      if (data) {
        setPedidos(data as Pedido[])
        setCentrosCusto(Array.from(new Set(data.map((p: any) => p.centro_custo))).filter(Boolean))
        setSolicitantes(
  Array.from(new Set(data.map((p: any) => p.profiles?.nome))).filter(Boolean)
)

        setOrdensServico(Array.from(new Set(data.map((p: any) => p.ordem_servico))).filter(Boolean))
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

  const atualizarStatus = async (id: number, novoStatus: string) => {
    const { error } = await supabase
      .from('pedidosdecompra')
      .update({ status: novoStatus })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
    )
  }

  const salvarObservacao = async (id: number) => {
    const texto = novaObs[id]
    if (!texto) return

    const nova = `${texto};;;${new Date().toLocaleString()};;;${nome}`
    const pedido = pedidos.find((p) => p.id === id)
    const obsAtual = pedido?.observacoes || ''
    const obsConcat = obsAtual ? `${obsAtual}|||${nova}` : nova

    const { error } = await supabase
      .from('pedidosdecompra')
      .update({ observacoes: obsConcat })
      .eq('id', id)

    if (error) {
      console.error('Erro ao salvar observação:', error)
      return
    }

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, observacoes: obsConcat } : p
      )
    )

    setNovaObs((prev) => ({ ...prev, [id]: '' }))
  }

  // aplicação dos filtros
  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtros.status !== 'todos' && p.status !== filtros.status) return false
    if (filtros.centroCusto !== 'todos' && p.centro_custo !== filtros.centroCusto) return false
    if (filtros.solicitante !== 'todos' && p.profiles?.nome !== filtros.solicitante) return false

    if (filtros.ordemServico !== 'todos' && p.ordem_servico !== filtros.ordemServico) return false
    if (filtros.dataInicio && new Date(p.created_at) < new Date(filtros.dataInicio)) return false
    if (filtros.dataFim && new Date(p.created_at) > new Date(filtros.dataFim)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FiltrosPedidos
        centrosCusto={centrosCusto}
        solicitantes={solicitantes}
        ordensServico={ordensServico}
        onFiltrarAction={setFiltros}
      />

      {/* Tabela */}
      <div className="overflow-x-auto bg-white shadow-md">
        <table className="min-w-full text-sm text-left border-collapse border border-gray-300">
          <thead className="bg-[#5a0d0d] text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="p-2 border border-gray-300">Número</th>
              <th className="p-2 border border-gray-300">Solicitante</th>
              <th className="p-2 border border-gray-300">Materiais</th>
              <th className="p-2 border border-gray-300">Centro de Custo</th>
              <th className="p-2 border border-gray-300">Ordem de Serviço</th>
              <th className="p-2 border border-gray-300">Status</th>
              <th className="p-2 border border-gray-300">Data Solicitação</th>
              <th className="p-2 border border-gray-300">Orçamentos</th>
              <th className="p-2 border border-gray-300">Observações</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              pedidosFiltrados.map((p) => {
                const obsArray = parseObservacoes(p.observacoes)
                const ultimaObs = obsArray[obsArray.length - 1]

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border border-gray-300">{p.id}</td>
                    <td className="p-2 border border-gray-300">{p.profiles?.nome ?? p.id_solicitante}</td>
                    <td className="p-2 border border-gray-300">{parseMateriais(p.materiais)}</td>
                    <td className="p-2 border border-gray-300">{p.centro_custo}</td>
                    <td className="p-2 border border-gray-300">{p.ordem_servico}</td>
                    <td className="p-2 border border-gray-300">
                      <select
                        value={p.status}
                        onChange={(e) => atualizarStatus(p.id, e.target.value)}
                        className="border border-gray-400 rounded px-1 py-0.5 text-sm"
                      >
                        <option value="pendente">Pendente de aprovação</option>
                        <option value="Pago - Aguardando Envio">Pago - Aguardando Envio</option>
                        <option value="Pago - Aguardando Recolher">Pago - Aguardando Recolher</option>
                        <option value="Pago - Em translado">Pago - Em translado</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-2 border border-gray-300">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-2 border border-gray-300 space-y-1">
                      {p.fornecedor1 && (
                        <a href={p.orcamento_url1} target="_blank" className="block text-blue-600 underline">
                          {p.fornecedor1}
                        </a>
                      )}
                      {p.fornecedor2 && (
                        <a href={p.orcamento_url2} target="_blank" className="block text-blue-600 underline">
                          {p.fornecedor2}
                        </a>
                      )}
                      {p.fornecedor3 && (
                        <a href={p.orcamento_url3} target="_blank" className="block text-blue-600 underline">
                          {p.fornecedor3}
                        </a>
                      )}
                    </td>
                    <td className="p-2 border border-gray-300">
                      <div
                        className="cursor-pointer text-[#5a0d0d] hover:underline"
                        onClick={() => toggleObs(p.id)}
                      >
                        {ultimaObs ? ultimaObs.texto : 'Sem observação'}
                      </div>

                      {openObs === p.id && (
                        <div className="mt-2 space-y-2">
                          {obsArray.map((obs, idx) => (
                            <div key={idx} className="text-xs text-gray-600 border-b pb-1">
                              <span className="block font-medium">{obs.usuario}</span>
                              <span>{obs.texto}</span>
                              <span className="block text-gray-400">{obs.data}</span>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={novaObs[p.id] || ''}
                              onChange={(e) =>
                                setNovaObs((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="border px-2 py-1 flex-1 text-sm"
                              placeholder="Nova observação"
                            />
                            <button
                              onClick={() => salvarObservacao(p.id)}
                              className="bg-[#5a0d0d] text-white px-3 py-1 text-sm"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

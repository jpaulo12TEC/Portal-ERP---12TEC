'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

export interface FiltroProps {
  status: string
  destino: string
  solicitante: string
  dataInicio: string
  dataFim: string
  semNota: string // 'todos' | 'sim' | 'nao'
}

interface Props {
  onFiltrarAction: (filtros: FiltroProps) => void
  destinos?: string[]
  solicitantes?: string[]
}

export default function FiltrosPedidos({
  onFiltrarAction,
  destinos = [],
  solicitantes = [],
}: Props) {
  const [filtros, setFiltros] = useState<FiltroProps>({
    status: 'todos',
    destino: 'todos',
    solicitante: 'todos',
    dataInicio: '',
    dataFim: '',
    semNota: 'todos',
  })

  const handleChange = (campo: keyof FiltroProps, valor: any) => {
    const novosFiltros = { ...filtros, [campo]: valor }
    setFiltros(novosFiltros)
    onFiltrarAction(novosFiltros)
  }

  return (
    <div className="w-full bg-white rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-[#5a0d0d] mb-6">
        ACOMPANHAMENTO DE PEDIDOS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Status</label>
          <Select
            onValueChange={(val) => handleChange('status', val)}
            value={filtros.status}
          >
            <SelectTrigger className="h-[42px] rounded-full border border-gray-300 px-3">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em-andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Destino */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Destino</label>
          <Select
            onValueChange={(val) => handleChange('destino', val)}
            value={filtros.destino}
          >
            <SelectTrigger className="h-[42px] rounded-full border border-gray-300 px-3">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {destinos.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Solicitante */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Solicitante</label>
          <Select
            onValueChange={(val) => handleChange('solicitante', val)}
            value={filtros.solicitante}
          >
            <SelectTrigger className="h-[42px] rounded-full border border-gray-300 px-3">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {solicitantes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Datas e Sem Nota */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Data Início</label>
          <Input
            type="date"
            className="h-[42px] rounded-full border border-gray-300 text-sm px-3"
            value={filtros.dataInicio}
            onChange={(e) => handleChange('dataInicio', e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Data Fim</label>
          <Input
            type="date"
            className="h-[42px] rounded-full border border-gray-300 text-sm px-3"
            value={filtros.dataFim}
            onChange={(e) => handleChange('dataFim', e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Apenas nota cadastrada</label>
          <Select
            onValueChange={(val) => handleChange('semNota', val)}
            value={filtros.semNota}
          >
            <SelectTrigger className="h-[42px] rounded-full px-3">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botão Limpar */}
      <div className="mt-6 flex justify-end">
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            const reset: FiltroProps = {
              status: 'todos',
              destino: 'todos',
              solicitante: 'todos',
              dataInicio: '',
              dataFim: '',
              semNota: 'todos',
            }
            setFiltros(reset)
            onFiltrarAction(reset)
          }}
          className="rounded-full px-6 py-2 bg-[#5a0d0d] text-white hover:bg-[#7a1a1a] transition-all"
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}

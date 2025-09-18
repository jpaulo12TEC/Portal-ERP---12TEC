'use client'

import { useState } from 'react'
import Input from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { XCircle, Eraser  } from 'lucide-react'

export interface FiltroProps {
  status: string
  centroCusto: string
  solicitante: string
  ordemServico: string
  dataInicio: string
  dataFim: string
}

interface Props {
  onFiltrarAction: (filtros: FiltroProps) => void
  centrosCusto?: string[]
  solicitantes?: string[]
  ordensServico?: string[]
}

export default function FiltrosPedidos({
  onFiltrarAction,
  centrosCusto = [],
  solicitantes = [],
  ordensServico = [],
}: Props) {
  const [filtros, setFiltros] = useState<FiltroProps>({
    status: 'todos',
    centroCusto: 'todos',
    solicitante: 'todos',
    ordemServico: 'todos',
    dataInicio: '',
    dataFim: '',
  })

  const handleChange = (campo: keyof FiltroProps, valor: any) => {
    const novosFiltros = { ...filtros, [campo]: valor }
    setFiltros(novosFiltros)
    onFiltrarAction(novosFiltros)
  }

  const resetFiltros = () => {
    const reset: FiltroProps = {
      status: 'todos',
      centroCusto: 'todos',
      solicitante: 'todos',
      ordemServico: 'todos',
      dataInicio: '',
      dataFim: '',
    }
    setFiltros(reset)
    onFiltrarAction(reset)
  }

  return (
<div className="w-full bg-white rounded-xl p-6 mb-6">
  {/* Filtros principais */}
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

    {/* Centro de Custo */}
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">Centro de Custo</label>
      <Select
        onValueChange={(val) => handleChange('centroCusto', val)}
        value={filtros.centroCusto}
      >
        <SelectTrigger className="h-[42px] rounded-full border border-gray-300 px-3">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {centrosCusto.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
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

  {/* Ordem de Serviço e Datas */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">Ordem de Serviço</label>
      <Select
        onValueChange={(val) => handleChange('ordemServico', val)}
        value={filtros.ordemServico}
      >
        <SelectTrigger className="h-[42px] rounded-full border border-gray-300 px-3">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {ordensServico.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

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
  </div>

  {/* Botão de Limpar Filtros centralizado */}
  <div className="flex flex-col items-center mt-6">
    <Eraser
      onClick={resetFiltros}
      className="w-6 h-6 text-[#5a0d0d] cursor-pointer hover:text-[#7a1a1a] transition-colors"
    />
    <span className="text-xs text-gray-500 mt-1">Limpar Filtros</span>
  </div>
</div>

  )
}


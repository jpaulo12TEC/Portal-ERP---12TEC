'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/superbase'
import {
    isAfter,
  format,
  isBefore,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  addDays,
  addMonths
} from 'date-fns'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import Button from '../components/ui/button'
import { cn } from '@/lib/utils'

type Pagamento = {
  id: number
  venceem: string
  pagoem: string | null
  codigo: string
  empresa: string
  qtdparcelas: number
  nparcelas: number
  valor: number
  valor_total: number
  formapagamento: string
}

const periodOptions = ['Semana', 'Quinzena', 'Mês', 'Bimestre'] as const
type Period = (typeof periodOptions)[number]

export default function Resumo() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [selectedVencidos, setSelectedVencidos] = useState<number[]>([])
  const [selectedAVencer, setSelectedAVencer] = useState<number[]>([])
  const [period, setPeriod] = useState<Period>('Semana')


const getNomeReembolso = (formapagamento: string | null) => {
  if (!formapagamento) return null;
  if (formapagamento.toLowerCase().includes('reembolso')) {
    // Extrai tudo após "Reembolso - "
    const partes = formapagamento.split('-');
    if (partes.length > 1) {
      return partes.slice(1).join('-').trim(); // pega tudo depois do primeiro hífen
    }
  }
  return null;
}



  useEffect(() => {
    fetchPagamentos()
  }, [])

  const fetchPagamentos = async () => {
    const { data, error } = await supabase.from('provisao_pagamentos').select('*')
    if (error) {
      console.error('Erro ao buscar dados:', error)
    } else {
      setPagamentos(data as Pagamento[])
    }
  }

const hoje = startOfDay(new Date())

  const vencidos = pagamentos.filter(p => isBefore(new Date(p.venceem), hoje) && p.pagoem === null)

const interval = (() => {
  switch (period) {
    case 'Semana':
      return { start: startOfWeek(hoje), end: addDays(hoje, 7) }
    case 'Quinzena':
      return { start: startOfDay(hoje), end: addDays(hoje, 14) }
    case 'Mês':
      return { start: startOfMonth(hoje), end: endOfMonth(addMonths(hoje, 1)) }
    case 'Bimestre':
      return { start: startOfMonth(hoje), end: endOfMonth(addMonths(hoje, 2)) }
    default:
      return { start: hoje, end: hoje }
  }
})()

const aVencer = pagamentos.filter(
  p =>
    isWithinInterval(new Date(p.venceem), interval) &&
    p.pagoem === null &&
    isAfter(new Date(p.venceem), hoje) // Opcional, garante que não pegue hoje pra trás
)


const reembolsos = pagamentos.filter(
  p => 
    (p.formapagamento?.toLowerCase().includes('reembolso')) && 
    p.pagoem === null
)

const totalReembolso = reembolsos.reduce((acc, cur) => acc + (cur.valor_total || 0), 0)
const qtdReembolso = reembolsos.length

const [selectedReembolso, setSelectedReembolso] = useState<number[]>([])



  const sumSelected = (list: Pagamento[], selected: number[]) =>
    list
      .filter(p => selected.includes(p.id))
      .reduce((acc, cur) => acc + (cur.valor || 0), 0)


        // 🔥 Resumos gerais
  const totalVencidos = vencidos.reduce((acc, cur) => acc + (cur.valor || 0), 0)
  const qtdVencidos = vencidos.length

  const totalAVencer = aVencer.reduce((acc, cur) => acc + (cur.valor || 0), 0)
  const qtdAVencer = aVencer.length

const totalSelecionado = 
  sumSelected(vencidos, selectedVencidos) + 
  sumSelected(aVencer, selectedAVencer) +
  sumSelected(reembolsos, selectedReembolso)










  const renderTabela = (
    list: Pagamento[],
    selected: number[],
    setSelected: (ids: number[]) => void,
    isReembolsoTab = false
  ) => (
    <div className="space-y-3">
      {list.map(p => {
        const isChecked = selected.includes(p.id)
        return (
          <Card
            key={p.id}
            className={cn(
              'transition-shadow border rounded-lg shadow-sm hover:shadow-md',
              isChecked ? 'border-blue-500 shadow-lg' : 'border-gray-200'
            )}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <Checkbox
                checked={isChecked}
                onCheckedChange={checked => {
                  setSelected(
                    checked ? [...selected, p.id] : selected.filter(id => id !== p.id)
                  )
                }}
                aria-label={`Selecionar pagamento código ${p.codigo}`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-x-6 gap-y-2 w-full text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Venceu em:</span>{' '}
                  <span>{format(new Date(p.venceem), 'dd/MM/yyyy')}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Código:</span> <span>{p.codigo}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Empresa:</span> <span>{p.empresa}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Parcelada:</span>{' '}
                  <span>{p.qtdparcelas > 0 ? 'Sim' : 'Não'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Nº Parcela:</span>{' '}
                  <span>{p.nparcelas}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Valor Parcela:</span>{' '}
                  <span>
                    {p.valor.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Valor Total:</span>{' '}
                  <span>
                    {p.valor.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                    
  {/* Mostrar coluna Reembolso só se isReembolsoTab for true */}
    {isReembolsoTab && p.formapagamento && (
      <div>
        <span className="font-semibold text-gray-700">Reembolso:</span>{' '}
        <span>{p.formapagamento}</span>
      </div>
    )}
                  
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-8 max-w-full mt-10 mx-auto px-4 sm:px-6 lg:px-8">

      {/* 🔥 Resumo Geral */}
<div className="w-3/4 border rounded-xl bg-white p-4 mx-auto">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
    {/* Divisor */}
    <div className="hidden md:block h-10 w-px bg-border" />
    {/* Total Selecionado */}
    <div className="flex flex-col items-center">
      <span className="text-sm text-muted-foreground">Total Selecionado</span>
      <span className="text-2xl font-semibold">
        R$ {totalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>

    {/* Divisor */}
    <div className="hidden md:block h-10 w-px bg-border" />

    {/* A Vencer */}
    <div className="flex flex-col items-center">
      <span className="text-sm text-muted-foreground">A Vencer</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-medium">{qtdAVencer} itens</span>
        <span className="text-lg text-muted-foreground">
          R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>

    {/* Divisor */}
    <div className="hidden md:block h-10 w-px bg-border" />

    {/* Vencidos */}
    <div className="flex flex-col items-center">
      <span className="text-sm text-muted-foreground">Vencidos</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-medium">{qtdVencidos} itens</span>
        <span className="text-lg text-muted-foreground">
          R$ {totalVencidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
    {/* Divisor */}
    <div className="hidden md:block h-10 w-px bg-border" />
  </div>
</div>




 





      <Accordion type="multiple" defaultValue={['vencidos', 'avencer']} className="border border-gray-200 rounded-lg">
        {/* VENCIDOS */}
        <AccordionItem value="vencidos" className="border-b last:border-b-0">
          <AccordionTrigger>
            <div className="flex justify-between w-full items-center py-4 px-5 bg-gradient-to-br from-red-50 via-red-100 to-red-50 rounded-t-lg cursor-pointer">
              <h2 className="text-xl font-semibold text-red-700">Vencidos</h2>
              <span className="text-red-600 font-medium text-lg select-none">
                Total Selecionado:{' '}
                {sumSelected(vencidos, selectedVencidos).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            {renderTabela(vencidos, selectedVencidos, setSelectedVencidos)}
          </AccordionContent>
        </AccordionItem>

        {/* A VENCER */}
        <AccordionItem value="avencer" className="border-b last:border-b-0">
          <AccordionTrigger>
            <div className="flex justify-between w-full items-center py-4 px-5 bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-t-lg cursor-pointer">
              <h2 className="text-xl font-semibold text-green-700">A Vencer</h2>
              <span className="text-green-700 font-medium text-lg select-none">
                Total Selecionado:{' '}
                {sumSelected(aVencer, selectedAVencer).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="flex flex-wrap gap-3 mb-6">
              {periodOptions.map(opt => (
   <button
      key={opt}
      role="tab"
      aria-selected={opt === period}
      onClick={() => setPeriod(opt)}
      className={`px-4 py-2 rounded-md focus:outline-none transition-colors
        ${
          opt === period
            ? 'bg-blue-200 text-gray-800 shadow-md'
            : 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
    >
      {opt}
    </button>
              ))}
            </div>
            {renderTabela(aVencer, selectedAVencer, setSelectedAVencer)}
          </AccordionContent>
        </AccordionItem>

              {/* REEMBOLSO */}
   
<AccordionItem value="reembolso" className="border-b last:border-b-0">
  <AccordionTrigger>
    <div className="flex justify-between w-full items-center py-4 px-5 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-t-lg cursor-pointer">
      <h2 className="text-xl font-semibold text-yellow-700">Reembolso</h2>
      <span className="text-yellow-600 font-medium text-lg select-none">
        Total Selecionado:{' '}
        {sumSelected(reembolsos, selectedReembolso).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })}
      </span>
    </div>
  </AccordionTrigger>
  <AccordionContent className="px-5 pb-5">
   {renderTabela(reembolsos, selectedReembolso, setSelectedReembolso, true)}
  </AccordionContent>
</AccordionItem>
      </Accordion>



    </div>
  )
}

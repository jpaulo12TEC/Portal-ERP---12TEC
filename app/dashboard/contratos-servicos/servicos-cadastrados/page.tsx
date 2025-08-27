'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Building2, Wrench, Download, Star } from 'lucide-react'
import { supabase } from '@/lib/superbase'
import dayjs from 'dayjs'

type Servico = {
  id: string
  descricao_servico: string
  categoria: string
  valor_unitario: number | null
  prazo_atendimento_dias: number | null
  tipo_cobranca: string | null
  created_at: string
  arquivo_orcamento?: string | null
  preferencial: boolean
  fornecedores?: {
    id: string
    nome_fantasia?: string | null
    razao_social?: string | null
  } | null
}

export default function ListaServicosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('contratos-servicos')
  const [menuActive, setMenuActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchServicos = async () => {
      setLoading(true)
      setErro(null)
      const { data, error } = await supabase
        .from('servicos_cadastrados')
        .select(`
          id,
          descricao_servico,
          categoria,
          valor_unitario,
          prazo_atendimento_dias,
          tipo_cobranca,
          created_at,
          arquivo_orcamento,
          preferencial,
          fornecedores (
            id,
            nome_fantasia,
            razao_social
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar serviços:', error)
        setErro('Não foi possível carregar os serviços.')
      } else {
        setServicos((data || []) as unknown as Servico[])
      }
      setLoading(false)
    }
    fetchServicos()
  }, [])

  const servicosFiltrados = useMemo(
    () =>
      servicos.filter(
        (s) =>
          s.descricao_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.fornecedores?.nome_fantasia || s.fornecedores?.razao_social || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [servicos, searchTerm]
  )

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    router.push(`/dashboard/${tab}`)
  }

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
{/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <span className="w-full text-left">Serviços cadastrados</span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />
        
        <div className="p-6 w-full max-w-[1100px] mx-auto">
  <div className="flex mt-10 flex-col">
    
    <input
      type="text"
      placeholder="Buscar serviço ou fornecedor..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full  h-[36px] px-4 text-sm rounded-full text-gray-900 border border-gray-300 shadow-sm focus:border-[#5a0d0d] focus:ring-2 focus:ring-[#5a0d0d] transition-all mb-6"
    />
  </div>

          <p className="text-sm text-gray-600 mb-4">
            {loading
              ? 'Carregando...'
              : `${servicosFiltrados.length} resultado(s) — atualizado em ${dayjs().format(
                  'DD/MM/YYYY HH:mm'
                )}`}
          </p>
          <Separator className="mb-6" />

          {erro && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {erro}
            </div>
          )}

          <ul className="space-y-3">
            {loading ? (
              <li className="text-sm text-gray-500">Carregando...</li>
            ) : servicosFiltrados.length === 0 ? (
              <li className="bg-gray-50 p-6 border border-dashed border-gray-300 text-sm text-gray-500 italic rounded-xl text-center">
                Nenhum serviço encontrado.
              </li>
            ) : (
              servicosFiltrados.map((s) => (
                <li
                  key={s.id}
                  className={`bg-white p-4 border rounded-xl hover:border-[#5a0d0d] hover:shadow-md transition-all ${
                    s.preferencial ? 'border-yellow-400 shadow-md' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Wrench className="w-5 h-5 mt-1 text-[#5a0d0d]" />
                      <div>
                        <p className="text-sm font-semibold text-[#5a0d0d]">
                          {s.descricao_servico}{' '}
                          {s.preferencial && (
                            <Star className="inline w-4 h-4 text-yellow-500" aria-label="Preferencial" />
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criado em {dayjs(s.created_at).format('DD/MM/YYYY')}
                        </p>
                        <p className="text-xs text-gray-600">
                          Categoria: {s.categoria || '—'} | Prazo:{' '}
                          {s.prazo_atendimento_dias ? `${s.prazo_atendimento_dias} dias` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <Building2 className="w-4 h-4 text-gray-600" />
                        <button
                          className="underline underline-offset-2 hover:text-[#5a0d0d]"
                          onClick={() =>
                            s.fornecedores?.id &&
                            router.push(
                              `/dashboard/contratos-servicos/contratos/fornecedores/${s.fornecedores.id}`
                            )
                          }
                          disabled={!s.fornecedores?.id}
                        >
                          {s.fornecedores?.nome_fantasia ||
                            s.fornecedores?.razao_social ||
                            '—'}
                        </button>
                      </div>

                      <div className="text-sm font-medium text-gray-900">
                        {typeof s.valor_unitario === 'number'
                          ? `R$ ${s.valor_unitario.toFixed(2)}`
                          : 'Valor não informado'}
                      </div>

                      {s.arquivo_orcamento && (
                        <a
                          href={s.arquivo_orcamento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 border border-[#5a0d0d] text-[#5a0d0d] rounded-lg text-xs hover:bg-[#5a0d0d] hover:text-white transition-all"
                        >
                          <Download size={14} />
                          Orçamento
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

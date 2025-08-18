'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Search } from 'lucide-react'
import { supabase } from '@/lib/superbase'
import dayjs from 'dayjs'

interface Fornecedor {
  id: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  email: string
  telefone_principal: string
  endereco?: string
  cidade_uf?: string
  // outros campos que você quiser mostrar
}

interface Servico {
  id: string
  descricao_servico: string
  categoria: string
  area_atuacao: string
  valor_unitario: number
  prazo_atendimento_dias: number
  tipo_cobranca: string
  preferencial: boolean
  arquivo_orcamento?: string
}

export default function FornecedorPage() {
  const params = useParams()
  const router = useRouter()
  const fornecedorId = params.id

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [menuActive, setMenuActive] = useState(false)

  // Busca fornecedor
  useEffect(() => {
    const fetchFornecedor = async () => {
      if (!fornecedorId) return

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', fornecedorId)
        .single()

      if (error) console.error('Erro ao buscar fornecedor:', error)
      else setFornecedor(data)

      setLoading(false)
    }

    fetchFornecedor()
  }, [fornecedorId])

  // Busca serviços do fornecedor
  useEffect(() => {
    const fetchServicos = async () => {
      if (!fornecedorId) return

      const { data, error } = await supabase
        .from('servicos_cadastrados')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .order('created_at', { ascending: false })

      if (error) console.error('Erro ao buscar serviços:', error)
      else setServicos(data || [])
    }

    fetchServicos()
  }, [fornecedorId])

  if (loading) return <div className="p-4">Carregando fornecedor...</div>
  if (!fornecedor) return <div className="p-4">Fornecedor não encontrado.</div>

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md h-[50px]">
        <div className="flex items-center space-x-4 w-full">
          <button
            onClick={() => router.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3">
            <button className="w-full text-left hover:text-gray-300">Fornecedor</button>
          </div>
        </div>
        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar serviço..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>
        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab="fornecedores"
          onNavClickAction={(tab) => router.push(`/dashboard/${tab}`)}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow space-y-6">
            {/* Dados do fornecedor */}
            <h1 className="text-2xl font-bold text-[#200101]">{fornecedor.nome_fantasia}</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-4 rounded shadow">
                <p className="text-gray-600">Razão Social</p>
                <p className="font-medium">{fornecedor.razao_social}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded shadow">
                <p className="text-gray-600">CNPJ</p>
                <p className="font-medium">{fornecedor.cnpj}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded shadow">
                <p className="text-gray-600">Telefone</p>
                <p className="font-medium">{fornecedor.telefone_principal}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded shadow">
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{fornecedor.email}</p>
              </div>
              {fornecedor.endereco && (
                <div className="bg-gray-50 p-4 rounded shadow">
                  <p className="text-gray-600">Endereço</p>
                  <p className="font-medium">{fornecedor.endereco}, {fornecedor.cidade_uf}</p>
                </div>
              )}
            </div>

            {/* Serviços cadastrados */}
            <h2 className="text-xl font-semibold text-[#200101] mt-6">Serviços Cadastrados</h2>
            {servicos.length === 0 ? (
              <p className="text-gray-500 mt-2">Nenhum serviço cadastrado.</p>
            ) : (
              <ul className="space-y-4 mt-2">
                {servicos.map((s) => (
                  <li key={s.id} className="border p-4 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition-all">
                    <p><strong>Descrição:</strong> {s.descricao_servico}</p>
                    <p><strong>Categoria:</strong> {s.categoria}</p>
                    <p><strong>Área de atuação:</strong> {s.area_atuacao}</p>
                    <p><strong>Valor unitário:</strong> R$ {s.valor_unitario}</p>
                    <p><strong>Prazo atendimento:</strong> {s.prazo_atendimento_dias} dias</p>
                    <p><strong>Tipo cobrança:</strong> {s.tipo_cobranca}</p>
                    {s.preferencial && <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Preferencial</span>}
                    {s.arquivo_orcamento && (
                      <div className="mt-2">
                        <a href={s.arquivo_orcamento} target="_blank" className="text-blue-600 underline">Documento de orçamento</a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

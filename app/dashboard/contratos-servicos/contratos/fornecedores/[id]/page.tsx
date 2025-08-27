'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Download } from 'lucide-react'
import { supabase } from '@/lib/superbase'
import dayjs from 'dayjs'

interface Fornecedor {
  id: string
  id_cadastrador: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  inscrição: string
  tipo_fornecedor: string
  natureza_juridica: string
  endereco: string
  numero: string
  complemento?: string
  bairro?: string
  cidade_uf?: string
  cep?: string
  pais?: string
  telefone_principal?: string    
  email: string
  website?: string
  responsavel_comercial?: string
  responsavel_tecnico?: string
  contato1_nome?: string
  contato1_telefone?: string
  contato2_nome?: string
  contato2_telefone?: string
  tipo_produto_servico?: string
  categoria?: string
  descricao?: string
  unidade_fornecimento?: string
  preco_estimado?: number
  prazo_entrega?: string

  arquivos_produtos_url?: string
  comprovantecapacidadetecnica_url?: string
  ficha_cadastral_url?: string
  cartao_cnpj_url?: string
  certidao_negativa_url?: string
  contrato_social_url?: string
  alvara_url?: string
  outros_documentos_url?: string

  created_at: string
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
  data_criacao: string
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

  // Busca serviços
  useEffect(() => {
    const fetchServicos = async () => {
      if (!fornecedorId) return
      const { data, error } = await supabase
        .from('servicos_cadastrados')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .order('created_at', { ascending: false })
      if (error) console.error('Erro ao buscar serviços:', error)
      else
        setServicos(
          (data || []).map((s: any) => ({
            ...s,
            data_criacao: dayjs(s.created_at).format('DD/MM/YYYY')
          }))
        )
    }
    fetchServicos()
  }, [fornecedorId])

  if (loading) return <div className="p-4">Carregando fornecedor...</div>
  if (!fornecedor) return <div className="p-4">Fornecedor não encontrado.</div>

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
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
            <span className="w-full text-left">{fornecedor.nome_fantasia}</span>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab="fornecedores"
          onNavClickAction={(tab) => router.push(`/dashboard/${tab}`)}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {/* Dados gerais */}
          <section className="bg-white p-6 rounded-2xl shadow space-y-4 mb-8">
            <h2 className="text-xl font-bold text-[#200101] mb-4">Dados do Fornecedor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="Razão Social" value={fornecedor.razao_social} />
              <InfoCard label="CNPJ" value={fornecedor.cnpj} />
              <InfoCard label="Inscrição" value={fornecedor.inscrição} />
              <InfoCard label="Tipo de Fornecedor" value={fornecedor.tipo_fornecedor} />
              <InfoCard label="Natureza Jurídica" value={fornecedor.natureza_juridica} />
              <InfoCard label="Telefone" value={fornecedor.telefone_principal} />
              <InfoCard label="Email" value={fornecedor.email} />
              {fornecedor.website && (
                <InfoCard
                  label="Website"
                  value={<a href={fornecedor.website} target="_blank" className="text-blue-600 underline">{fornecedor.website}</a>}
                />
              )}
              <InfoCard
                label="Endereço"
                value={`${fornecedor.endereco}, ${fornecedor.numero || ''} ${fornecedor.complemento || ''}, ${fornecedor.bairro || ''} - ${fornecedor.cidade_uf || ''}, ${fornecedor.cep || ''}, ${fornecedor.pais || ''}`}
              />
              <InfoCard label="Responsável Comercial" value={fornecedor.responsavel_comercial} />
              <InfoCard label="Responsável Técnico" value={fornecedor.responsavel_tecnico} />
              <InfoCard label="Contato 1" value={`${fornecedor.contato1_nome || ''} ${fornecedor.contato1_telefone || ''}`} />
              <InfoCard label="Contato 2" value={`${fornecedor.contato2_nome || ''} ${fornecedor.contato2_telefone || ''}`} />
              <InfoCard label="Tipo Produto/Serviço" value={fornecedor.tipo_produto_servico} />
              <InfoCard label="Categoria" value={fornecedor.categoria} />
              <InfoCard label="Descrição" value={fornecedor.descricao} />
              <InfoCard label="Unidade Fornecimento" value={fornecedor.unidade_fornecimento} />
              <InfoCard label="Preço Estimado" value={fornecedor.preco_estimado ? `R$ ${fornecedor.preco_estimado.toFixed(2)}` : '-'} />
              <InfoCard label="Prazo Entrega" value={fornecedor.prazo_entrega} />
            </div>
          </section>

          {/* Documentos */}
          <section className="bg-white p-6 rounded-2xl shadow space-y-4 mb-8">
            <h2 className="text-xl font-bold text-[#200101] mb-4">Documentos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderDoc("Ficha Cadastral", fornecedor.ficha_cadastral_url)}
              {renderDoc("Cartão CNPJ", fornecedor.cartao_cnpj_url)}
              {renderDoc("Certidão Negativa", fornecedor.certidao_negativa_url)}
              {renderDoc("Contrato Social", fornecedor.contrato_social_url)}
              {renderDoc("Alvará", fornecedor.alvara_url)}
              {renderDoc("Comprovante Capacidade Técnica", fornecedor.comprovantecapacidadetecnica_url)}
              {renderDoc("Arquivos Produtos", fornecedor.arquivos_produtos_url)}
              {renderDoc("Outros Documentos", fornecedor.outros_documentos_url)}
            </div>
          </section>

          {/* Serviços */}
          <section className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-xl font-bold text-[#200101] mb-4">Serviços Cadastrados</h2>
            {servicos.length === 0 ? (
              <p className="text-gray-500">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servicos.map((s) => (
                  <div key={s.id} className="border p-4 rounded-xl shadow-sm bg-gray-50 hover:bg-gray-100 transition-all">
                    <h3 className="font-semibold text-[#200101] mb-2">{s.descricao_servico}</h3>
                    <ul className="text-sm space-y-1">
                      <li><strong>Categoria:</strong> {s.categoria}</li>
                      <li><strong>Área de atuação:</strong> {s.area_atuacao}</li>
                      <li><strong>Valor unitário:</strong> R$ {s.valor_unitario.toFixed(2)}</li>
                      <li><strong>Prazo atendimento:</strong> {s.prazo_atendimento_dias} dias</li>
                      <li><strong>Tipo cobrança:</strong> {s.tipo_cobranca}</li>
                      <li><strong>Data cadastro:</strong> {s.data_criacao}</li>
                      {s.preferencial && (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Preferencial
                        </span>
                      )}
                      {s.arquivo_orcamento && (
                        <a
                          href={s.arquivo_orcamento}
                          target="_blank"
                          className="mt-2 inline-flex items-center text-blue-600 hover:underline gap-1"
                        >
                          Baixar Orçamento <Download size={16} />
                        </a>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

// Card padrão
function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow flex flex-col">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-medium text-[#200101] break-words">{value}</span>
    </div>
  )
}

// Documentos com botão de download
function renderDoc(label: string, url?: string) {
  if (!url) return null
  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow flex justify-between items-center">
      <span className="text-gray-700">{label}</span>
      <a href={url} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
        Baixar <Download size={16} />
      </a>
    </div>
  )
}

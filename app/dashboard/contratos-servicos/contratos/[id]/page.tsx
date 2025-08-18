'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const mockData = {
  id: '123',
  fornecedor: 'Empresa Exemplo Ltda',
  cnpj: '12.345.678/0001-90',
  valor: 'R$ 25.000,00',
  ativoDesde: '2023-01-10',
  ultimoPagamento: '2025-07-15',
  proximoVencimento: '2025-08-15',
  statusPagamento: 'Atrasado',
  contratoAnexado: '/contratos/contrato_123.pdf',
  historico: [
    '/contratos/versao_1.pdf',
    '/contratos/versao_2.pdf'
  ],
  controles: [
    { data: '2025-07-01', arquivo: '/controles/controle_0701.pdf', texto: 'Verificação semanal: tudo ok.' },
    { data: '2025-07-08', arquivo: '/controles/controle_0708.pdf', texto: 'Problema na entrega do serviço.' },
    { data: '2025-07-15', arquivo: '/controles/controle_0715.pdf', texto: 'Ajustado conforme contrato.' },
  ]
}

function calcularTempoAtivo(dataInicio: string): string {
  const inicio = new Date(dataInicio)
  const hoje = new Date()
  const diff = hoje.getTime() - inicio.getTime()
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  return `${dias} dias`
}

export default function DetalheContrato({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [contrato, setContrato] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('contratos')
  const [menuActive, setMenuActive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
    const [controleAtrasado, setControleAtrasado] = useState(false)
  const [modalData, setModalData] = useState(null)

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    router.push(`/dashboard/${tab}`)
  }

useEffect(() => {
  if (contrato && contrato.controles && contrato.controles.length > 0) {
    const ultimaData = dayjs(contrato.controles[contrato.controles.length - 1].data)
    const hoje = dayjs()
    const dias = hoje.diff(ultimaData, 'day')

    if (dias > 7) {
      setControleAtrasado(true)
    } else {
      setControleAtrasado(false)
    }
  } else {
    setControleAtrasado(true)
  }
}, [contrato])


  useEffect(() => {
    if (params.id) {
      setContrato(mockData) // aqui você faria fetch do contrato real usando params.id
    }
  }, [params.id])

  if (!contrato) return <div className="p-4">Carregando contrato...</div>

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${isModalOpen ? "backdrop-blur-lg" : ""}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md h-[50px]">
        <div className="flex items-center space-x-4 w-full">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3">
            <button className="w-full text-left hover:text-gray-300">Contratos</button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar..."
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
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow space-y-6">
            <h1 className="text-2xl font-bold text-[#200101]">Contrato #{contrato.id}</h1>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Fornecedor', value: contrato.fornecedor },
                { label: 'CNPJ', value: contrato.cnpj },
                { label: 'Valor', value: contrato.valor },
                { label: 'Ativo há', value: calcularTempoAtivo(contrato.ativoDesde) },
                { label: 'Último pagamento', value: contrato.ultimoPagamento },
                { label: 'Próximo vencimento', value: contrato.proximoVencimento }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded shadow">
                  <p className="text-gray-600">{item.label}</p>
                  <p className="font-medium text-black">{item.value}</p>
                </div>
              ))}
              <div className="col-span-2 bg-gray-50 p-4 rounded shadow">
                <p className="text-gray-600">Status do pagamento</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${contrato.statusPagamento === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {contrato.statusPagamento}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#200101]">Contrato Anexado</h2>
              <a href={contrato.contratoAnexado} target="_blank" className="text-blue-600 underline">Ver contrato principal</a>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#200101]">Histórico de Contratos</h2>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                {contrato.historico.map((doc: string, idx: number) => (
                  <li key={idx}>
                    <a href={doc} target="_blank" className="text-blue-600 underline">Versão {idx + 1}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
<h2 className="text-lg font-semibold text-[#200101]">Controles Realizados</h2>

      {/* RESUMO */}
      <div className={`p-3 rounded-md my-2 text-sm font-medium ${controleAtrasado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {controleAtrasado
          ? '⚠️ Há um controle atrasado! O último controle foi há mais de 7 dias.'
          : '✅ Os controles estão em dia.'}
      </div>

      {/* LISTA DE CONTROLES */}
      <ul className="space-y-4 mt-2">
        {contrato.controles.map((controle: any, idx: number) => {
          const dias = dayjs().diff(dayjs(controle.data), 'day')
          const atrasado = dias > 7

          return (
            <li
              key={idx}
              className={`cursor-pointer border p-4 rounded-lg shadow-sm text-sm ${
                atrasado ? 'bg-red-50 border-red-300' : 'bg-gray-50'
              }`}
              onClick={() => setModalData(controle)}
            >
              <p><strong>Data:</strong> {dayjs(controle.data).format('DD/MM/YYYY')}</p>
              <p className="mt-1"><strong>Descrição:</strong> {controle.texto}</p>
              <p className="mt-1 text-blue-600 underline">Ver mais</p>
            </li>
          )
        })}
      </ul>

{/* MODAL */}
{modalData && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-lg p-6 md:p-8 relative animate-fade-in">
      <h3 className="text-xl font-bold text-gray-800 mb-3">
        Controle - {dayjs(modalData.data).format('DD/MM/YYYY')}
      </h3>

      <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
        {modalData.texto}
      </p>

      <a
        href={modalData.arquivo}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 font-medium underline transition duration-200"
      >
        📄 Abrir Documento
      </a>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setModalData(null)}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg shadow-sm transition duration-200"
        >
          Fechar
        </button>
      </div>

      {/* Optional: close icon */}
      <button
        onClick={() => setModalData(null)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition duration-200"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  </div>
)}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

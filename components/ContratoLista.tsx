import React, { useState, useEffect } from 'react'

const ContratoLista = () => {
  const [contratos, setContratos] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/download-contratos')
        const result = await response.json()
        if (Array.isArray(result)) {
          setContratos(result)
        } else {
          console.error('A resposta da API não é um array', result)
        }
      } catch (error) {
        console.error('Erro ao buscar contratos:', error)
      }
    }

    fetchData()
  }, [])

  if (!Array.isArray(contratos)) {
    return <div>Erro: Dados de contratos não estão disponíveis.</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lista de Contratos</h2>
      {contratos.length === 0 ? (
        <p className="text-gray-600">Não há contratos para exibir.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {contratos.map((contrato, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-blue-700">{contrato.nomedocontrato}</h3>
              <p className="text-sm text-gray-700 mt-1"><strong>Empresa:</strong> {contrato.nomedaempresa}</p>
              <p className="text-sm text-gray-700"><strong>CNPJ/CPF:</strong> {contrato.cnpjcpf}</p>
              <p className="text-sm text-gray-700"><strong>Objeto:</strong> {contrato.objetodocontrato}</p>

              {contrato.url ? (
  <a
    href={contrato.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block mt-3 text-blue-600 underline"
  >
    Visualizar Documento
  </a>
) : (
  <p className="text-sm text-red-600">Documento indisponível</p>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContratoLista
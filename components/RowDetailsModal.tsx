import React, { useState, useEffect, useRef } from "react";
import Button from "../components/ui/button";
import { supabase } from "../lib/superbase";

interface RowDetailsModalProps {
  selectedRow: any;
  onClose: () => void;
}

const RowDetailsModal: React.FC<RowDetailsModalProps> = ({ selectedRow, onClose }) => {
  const [additionalRows, setAdditionalRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Função para buscar mais linhas no Supabase
  const fetchAdditionalRows = async () => {
    if (!selectedRow || !selectedRow.codigo) {
      setError("Dados inválidos para buscar informações.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("provisao_pagamentos")
      .select("formapagamento, nparcelas, qtdparcelas, valor, cnpj, venceem, pagoem, empresa")
      .eq("codigo", selectedRow.codigo);

    setLoading(false);

    if (error) {
      setError(`Erro ao buscar dados: ${error.message}`);
    } else {
      setError(null);
      setAdditionalRows(data);
    }
  };

  useEffect(() => {
    fetchAdditionalRows();
  }, [selectedRow]);

  const handleAddPayment = () => {
    console.log("Adicionar pagamento");
  };

  const handleDeleteRow = () => {
    console.log("Apagar linha");
  };

  const handlePrintBoleto = () => {
    console.log("Imprimir boleto");
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose(); // Chama a função de fechamento do modal
    }
  };

  const formatDate = (date: string | number | null) => {
    if (!date) return "-";
    return new Date(String(date)).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "R$ 0,00";
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
    >
      <div
        ref={modalRef} // Usando o ref para o modal
        className="bg-white p-6 rounded-xl shadow-lg transform transition-transform duration-300 scale-100 hover:scale-101"
        style={{
          animation: 'fadeIn 0.3s ease-out',
          width: '80%', 
          maxWidth: '800px',
        }}
      >
        <div className="flex flex-col space-y-6 sm:flex-row sm:space-y-0 sm:space-x-6">
          {/* Informações principais com fundo diferente */}
          <div className="flex-1 space-y-8 p-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg">
            <p className="text-xm text-gray-600"><strong>Empresa:</strong> {selectedRow?.empresa}</p>
            <p className="text-xm text-gray-600"><strong>CNPJ:</strong> {selectedRow?.cnpj}</p>
            <p className="text-xm text-gray-600"><strong>Valor:</strong> {formatCurrency(selectedRow?.valor)}</p>
            <p className="text-xm text-gray-600"><strong>Origem:</strong> {selectedRow?.origem}</p>
          </div>

          {/* Outras informações com rolagem lateral e alinhadas horizontalmente */}
          <div className="flex-1 space-y-4 overflow-x-auto p-4">
            <h3 className="text-xl font-semibold text-gray-700">Pagamentos relacionados:</h3>
            <div className="flex gap-6 overflow-x-auto">
              {loading ? (
                <p>Carregando dados...</p>
              ) : additionalRows.length > 0 ? (
                additionalRows.map((row, index) => (
                  <div key={index} className={`flex-shrink-0 flex flex-col items-start p-6 rounded-lg shadow-md w-80  ${
                    !row.pagoem || row.pagoem === "-" 

                      ? (new Date() > new Date(row.venceem) 
                        ? "bg-red-50 border-2 border-red-300" 
                        : "bg-yellow-50 border-2 border-yellow-600") 
                      : "bg-green-50 border-2 border-green-300"
                  }`}>
                    {/* Cartão do boleto */}
                    <h4 className="font-semibold text-lg text-gray-700">Boleto #{index + 1}</h4>
                    <p className="text-sm text-gray-600"><strong>Forma de Pagamento:</strong> {row.formapagamento}</p>
                    <p className="text-sm text-gray-600"><strong>Parcela:</strong> {row.nparcelas}</p>
                    <p className="text-sm text-gray-600"><strong>Qtd Parcelas:</strong> {row.qtdparcelas}</p>
                    <p className="text-sm text-gray-600"><strong>Valor:</strong> {formatCurrency(row.valor)}</p>
                    <p className="text-sm text-gray-600"><strong>Vencimento:</strong> {formatDate(row.venceem)}</p>
                    <p className="text-sm text-gray-600"><strong>Pagamento:</strong> {formatDate(row.pagoem)}</p>

                    {/* Botões de ação para o boleto */}
                    <div className="mt-4 flex justify-between space-x-4">
                      <Button onClick={handleAddPayment} disabled={loading}>
                        Pagar
                      </Button>
                      <Button onClick={handlePrintBoleto} disabled={loading}>
                        Imprimir
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhuma linha adicional encontrada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Exibindo a mensagem de erro, se houver */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default RowDetailsModal;
import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

type Material = {
  nome_material: string;
  quantidade: number;
};

type Orcamento = {
  nome_arquivo: string;
  enviado_por: string;
};

type Pedido = {
  id: number
  nome_pedido: string
  solicitado_por: string
  status: string
  data: string
  orcamentos: Orcamento[]
  materiais: Material[]
  observacao: string
}

interface VisualizarPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
}

const VisualizarPedidoModal: React.FC<VisualizarPedidoModalProps> = ({ isOpen, onClose, pedido }) => {
  if (!pedido) return null;

  const materiaisFormatados = pedido.materiais || [];



  const orcamentosFormatados = pedido.orcamentos.map((orcamento) => ({
    nomeArquivo: orcamento.nome_arquivo,
    enviadoPor: orcamento.enviado_por,
    link: `https://bucket-url/orcamentos/${orcamento.nome_arquivo}`,
  }));

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" /> {/* CORREÇÃO: Overlay estava errado */}

        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-auto p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold">Pedido #{pedido.id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Solicitado por:</p>
              <p className="text-lg font-medium">{pedido.solicitado_por}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Apelido do pedido:</p>
              <p className="text-lg font-medium">{pedido.nome_pedido}</p>
            </div>
          </div>

          {pedido.observacao && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Observações:</p>
              <p className="text-base text-gray-700">{pedido.observacao}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Materiais Solicitados:</p>
            <ul className="list-disc list-inside text-gray-700">
              {materiaisFormatados.length > 0 ? (
materiaisFormatados.map((item: Material, index: number) => (
  <li key={index}>
    {item.nome_material} - {item.quantidade}
  </li>
                ))
              ) : (
                <li>Nenhum material listado</li>
              )}
            </ul>
          </div>

          <div>
  <p className="text-sm text-gray-500 mb-1">Orçamentos:</p>
  <ul className="list-disc list-inside text-gray-700">
    {orcamentosFormatados.length > 0 ? (
      orcamentosFormatados.map((orc, index) => (
        <li key={index}>
          <a
            href={orc.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {orc.nomeArquivo}
          </a>{' '}
          (Enviado por: {orc.enviadoPor})
        </li>
      ))
    ) : (
      <li>Nenhum orçamento listado</li>
    )}
  </ul>
</div>
        </div>
      </div>
    </Dialog>
  );
};

export default VisualizarPedidoModal;

'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/superbase'; // ajuste o caminho

interface PedidoForm {
  centro_custo: string;
  ordem_servico: string;
  materiais: string;
  orcamento_url1: string;
  fornecedor1: string;
  orcamento_url2: string;
  fornecedor2: string;
  orcamento_url3: string;
  fornecedor3: string;
  orcamento_url4: string;
  fornecedor4: string;
  vencedor: string;
  valor_previsto: string;
  menor_valor: string;
  fornecedor_menor_valor: string;
  motivacao: string;
  id_compra?: string;
  comprado_em?: string;
}

const PedidoPage = () => {
  const [form, setForm] = useState<PedidoForm>({
    centro_custo: '',
    ordem_servico: '',
    materiais: '',
    orcamento_url1: '',
    fornecedor1: '',
    orcamento_url2: '',
    fornecedor2: '',
    orcamento_url3: '',
    fornecedor3: '',
    orcamento_url4: '',
    fornecedor4: '',
    vencedor: '',
    valor_previsto: '',
    menor_valor: '',
    fornecedor_menor_valor: '',
    motivacao: '',
    id_compra: '',
    comprado_em: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase.from('pedido_de_compra').insert([{
      ...form,
      valor_previsto: form.valor_previsto ? parseFloat(form.valor_previsto) : null,
      menor_valor: form.menor_valor ? parseFloat(form.menor_valor) : null,
      comprado_em: form.comprado_em ? new Date(form.comprado_em) : null
    }]);
    if (error) {
      alert('Erro ao enviar: ' + error.message);
    } else {
      alert('Pedido criado com sucesso!');
      setForm({
        centro_custo: '',
        ordem_servico: '',
        materiais: '',
        orcamento_url1: '',
        fornecedor1: '',
        orcamento_url2: '',
        fornecedor2: '',
        orcamento_url3: '',
        fornecedor3: '',
        orcamento_url4: '',
        fornecedor4: '',
        vencedor: '',
        valor_previsto: '',
        menor_valor: '',
        fornecedor_menor_valor: '',
        motivacao: '',
        id_compra: '',
        comprado_em: ''
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Pedido de Compra</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(form).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="font-semibold mb-1">{key.replace(/_/g, ' ')}</label>
            {key === 'materiais' || key === 'motivacao' ? (
              <textarea
                name={key}
                value={form[key as keyof PedidoForm]}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            ) : (
              <input
                type="text"
                name={key}
                value={form[key as keyof PedidoForm]}
                onChange={handleChange}
                className="border p-2 rounded"
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Enviar
      </button>
    </div>
  );
};

export default PedidoPage;

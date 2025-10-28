'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserContext';
import { supabase } from '@/lib/superbase';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Funcionario = {
  id: string;
  nome_completo: string;
};

type Apontamento = {
  funcionario_id: string;
  tipo_apontamento: string;
  observacoes: string | null;
};

export default function ApontamentosPage() {
  const { nome } = useUser();
  const router = useRouter();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcSelecionado, setFuncSelecionado] = useState<string>('');
  const [tipoApontamento, setTipoApontamento] = useState<string>('Férias');
  const [loading, setLoading] = useState(false);
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);

  // Campos dinâmicos
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [diasSuspensao, setDiasSuspensao] = useState<number | ''>('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [datasFalta, setDatasFalta] = useState('');

  const tiposApontamento = [
    'Férias',
    'Advertência',
    'Suspensão',
    'Demissão',
    'Falta',
    'Afastamento',
    'Aviso Prévio'
  ];

  useEffect(() => {
    async function carregarFuncionarios() {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome_completo')
        .eq('situacao', 'Ativo');
      if (error) console.error(error);
      else setFuncionarios(data || []);
    }

    async function carregarApontamentos() {
      const { data, error } = await supabase.from('apontamentos').select('*');
      if (!error) setApontamentos(data || []);
    }

    carregarFuncionarios();
    carregarApontamentos();
  }, []);

  const handleAdicionar = async () => {
    if (!funcSelecionado) return alert('Selecione um funcionário');

    let observacoes: string | null = null;

    switch (tipoApontamento) {
      case 'Férias':
        if (!dataInicio || !dataFim) return alert('Informe o período de férias');
        observacoes = `Férias de ${dataInicio} a ${dataFim}`;
        break;
      case 'Suspensão':
        if (!diasSuspensao) return alert('Informe a quantidade de dias');
        observacoes = `Suspensão por ${diasSuspensao} dias`;
        break;
      case 'Aviso Prévio':
        if (!dataEncerramento) return alert('Informe a data de encerramento');
        observacoes = `Aviso prévio até ${dataEncerramento}`;
        break;
      case 'Falta':
        if (!datasFalta) return alert('Informe a(s) data(s) da(s) falta(s)');
        observacoes = `Falta(s) na(s) seguinte(s) data(s): ${datasFalta}`;
        break;
      default:
        observacoes = null;
    }

    setLoading(true);
    const { data, error } = await supabase.from('apontamentos').insert([
      {
        funcionario_id: funcSelecionado,
        tipo_apontamento: tipoApontamento,
        observacoes
      }
    ]);

    if (error) {
      console.error(error);
      alert('Erro ao salvar apontamento');
    } else {
      setApontamentos((prev) => [...prev, ...(data ?? [])]);
      // Resetar campos
      setTipoApontamento('Férias');
      setFuncSelecionado('');
      setDataInicio('');
      setDataFim('');
      setDiasSuspensao('');
      setDataEncerramento('');
      setDatasFalta('');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-sm text-[#5a0d0d] hover:text-[#7a1a1a]"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>

      <h1 className="text-2xl font-semibold text-[#5a0d0d] mb-6">Apontamentos de RH</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-semibold text-lg mb-4">Adicionar Apontamento</h2>

        <div className="flex flex-col gap-4">
          <select
            className="border px-3 py-2 rounded"
            value={funcSelecionado}
            onChange={(e) => setFuncSelecionado(e.target.value)}
          >
            <option value="">Selecione um funcionário</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome_completo}
              </option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded"
            value={tipoApontamento}
            onChange={(e) => setTipoApontamento(e.target.value)}
          >
            {tiposApontamento.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

          {/* Campos dinâmicos */}
          {tipoApontamento === 'Férias' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="border px-3 py-2 rounded"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <input
                type="date"
                className="border px-3 py-2 rounded"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          )}

          {tipoApontamento === 'Suspensão' && (
            <input
              type="number"
              className="border px-3 py-2 rounded"
              placeholder="Número de dias"
              value={diasSuspensao}
              onChange={(e) => setDiasSuspensao(Number(e.target.value))}
            />
          )}

          {tipoApontamento === 'Aviso Prévio' && (
            <input
              type="date"
              className="border px-3 py-2 rounded"
              value={dataEncerramento}
              onChange={(e) => setDataEncerramento(e.target.value)}
            />
          )}

          {tipoApontamento === 'Falta' && (
            <input
              type="text"
              className="border px-3 py-2 rounded"
              placeholder="Digite as datas das faltas, separadas por vírgula"
              value={datasFalta}
              onChange={(e) => setDatasFalta(e.target.value)}
            />
          )}

          <button
            onClick={handleAdicionar}
            disabled={loading}
            className="flex items-center gap-2 bg-[#5a0d0d] text-white px-4 py-2 rounded hover:bg-[#7a1a1a]"
          >
            <PlusCircle size={16} />
            Adicionar Apontamento
          </button>
        </div>
      </div>

      {/* Tabela de apontamentos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-semibold text-lg mb-4">Apontamentos Registrados</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2">Funcionário</th>
              <th className="border px-3 py-2">Tipo</th>
              <th className="border px-3 py-2">Observações</th>
            </tr>
          </thead>
          <tbody>
            {apontamentos.map((a, idx) => {
              const func = funcionarios.find((f) => f.id === a.funcionario_id);
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{func?.nome_completo ?? '---'}</td>
                  <td className="border px-3 py-2">{a.tipo_apontamento}</td>
                  <td className="border px-3 py-2">{a.observacoes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

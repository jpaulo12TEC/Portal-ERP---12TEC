'use client';
import React, { useState } from 'react';
import { CheckCircle, FileText, ClipboardCheck, FileCheck2, BadgeCheck, Banknote, ArrowLeft, Search } from 'lucide-react';
import Sidebar from '../../../../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { useUser } from '@/components/UserContext';
import { supabase } from '../../../../../lib/superbase';
import { Calendar, UploadCloud } from 'lucide-react';

type Observacao = {
  descricao: string;
  autor: string;
  data: string;
  dataOriginal?: string;
};

type Contrato = {
  id: number;
  fornecedor: string;
  cnpj: string;
  objeto: string;
  valor: number;
  status: 'Em Elaboração' | 'Ativo' | 'Inativo' | 'Cancelado' | 'Readequação';
  checklist: {
    iniciado: boolean;
    anexado: boolean;
    acordado: boolean;
    assinado: boolean;
    pagamento: boolean;
    observacao?: string;
  };
  observacao?: Observacao[]; // ← Adicione isto
};


export default function ElaboracaoContrato() {
  const [periodicidade, setPeriodicidade] = useState('');
  const [proximoPagamento, setProximoPagamento] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [controle, setControle] = useState('');
  const [semDataEncerramento, setSemDataEncerramento] = useState(false);
  const { nome } = useUser(); // Esse nome será usado como autor da observação
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('contratos');
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [novaObservacao, setNovaObservacao] = useState('');
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [diasControle, setDiasControle] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setArquivo(e.target.files[0]);
  };


  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab);
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };

    const toggleDia = (dia: string) => {
    setDiasControle(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const abrirModal = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setContratoSelecionado(null);
  };

  const handleNovaObservacao = async (mensagem?: string) => {
  const descricao = mensagem || novaObservacao.trim();
  if (!descricao || !contratoSelecionado) return;

  const novaData = new Date().toISOString();
  const novaObsString = `${descricao}|||${nome.trim()}|||${novaData}`;

  const observacaoAtual = contratoSelecionado?.observacao || [];

  const todasObservacoes = [
    novaObsString,
    ...observacaoAtual.map(obs => {
      const dataOriginal = obs.dataOriginal || obs.data;
      return `${obs.descricao.trim()}|||${obs.autor.trim()}|||${dataOriginal}`;
    })
  ].join(';');

  const { error } = await supabase
    .from('contratos') // <- ALTERE conforme sua tabela
    .update({ observacao: todasObservacoes })
    .eq('id', contratoSelecionado?.id);

  if (!error) {
    const novaListaObservacoes = [
      {
        descricao,
        autor: nome.trim(),
        data: new Date(novaData).toLocaleString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        dataOriginal: novaData
      },
      ...observacaoAtual,
    ];

    setContratoSelecionado(prev =>
      prev ? { ...prev, observacao: novaListaObservacoes } : prev
    );

    if (!mensagem) setNovaObservacao('');
  } else {
    alert('Erro ao adicionar observação');
    console.error(error);
  }
};

  const contratos: Contrato[] = [
    {
      id: 1,
      fornecedor: 'Construtora Alfa',
      cnpj: '12.345.678/0001-90',
      objeto: 'Locação de Retroescavadeira',
      valor: 15000.00,
      status: 'Em Elaboração',
      checklist: {
        iniciado: true,
        anexado: true,
        acordado: false,
        assinado: false,
        pagamento: false,
      },
    },
    {
      id: 2,
      fornecedor: 'Serviços Beta Ltda',
      cnpj: '98.765.432/0001-11',
      objeto: 'Terceirização de manutenção predial',
      valor: 32000.00,
      status: 'Readequação',
      checklist: {
        iniciado: true,
        anexado: true,
        acordado: true,
        assinado: true,
        pagamento: false,
      },
    },
  ];

  const statusColors: Record<Contrato['status'], string> = {
    'Em Elaboração': 'bg-yellow-100 text-yellow-800',
    'Ativo': 'bg-green-100 text-green-800',
    'Inativo': 'bg-gray-200 text-gray-700',
    'Cancelado': 'bg-red-100 text-red-700',
    'Readequação': 'bg-orange-100 text-orange-800',
  };

  const checklistItems = [
    { key: 'iniciado', label: 'Contrato Iniciado', icon: FileText },
    { key: 'anexado', label: 'Contrato Anexado', icon: ClipboardCheck },
    { key: 'acordado', label: 'Condições Acordadas', icon: FileCheck2 },
    { key: 'assinado', label: 'Contrato Aceito', icon: BadgeCheck },
    { key: 'pagamento', label: 'Inclusão p/ Pagamento', icon: Banknote },
  ];

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

        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-[#5a0d0d] mb-6">Elaboração e Ajustes</h1>

          <div className="space-y-6">
            {contratos.map(contrato => (
              <div
                key={contrato.id}
                onClick={() => abrirModal(contrato)}
                className="p-5 border border-gray-200 rounded-xl shadow bg-white hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#5a0d0d]">{contrato.fornecedor}</h2>
                    <p className="text-sm text-gray-600">{contrato.objeto}</p>
                    <p className="text-sm text-gray-600">CNPJ: {contrato.cnpj}</p>
                    <p className="text-sm text-gray-600">
                      Valor: R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[contrato.status]}`}>
                    {contrato.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                  {checklistItems.map(({ key, label, icon: Icon }) => {
                    const checked = contrato.checklist[key as keyof typeof contrato.checklist];
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center justify-center text-center p-3 border rounded-md ${
                          checked
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                        {checked && <CheckCircle className="w-4 h-4 mt-1 text-green-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={isModalOpen} onClose={fecharModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
<Dialog.Panel className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-0 flex overflow-hidden max-h-[90vh]">
  {/* Formulário - lado esquerdo */}
  <div className="w-[70%] p-6 overflow-y-auto">
    <Dialog.Title className="text-lg font-bold text-[#5a0d0d] mb-4">Editar Contrato</Dialog.Title>
    
  {contratoSelecionado && (
    <div className="space-y-4">
      {/* CNPJ ou CPF */}
      <div>
        <label className="block font-medium text-sm text-gray-700">CNPJ ou CPF do Fornecedor</label>
        <input
          type="text"
          value={contratoSelecionado.cnpj}
          onChange={e => setContratoSelecionado({ ...contratoSelecionado, cnpj: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Nome do Fornecedor */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Nome do Fornecedor</label>
        <input
          type="text"
          value={contratoSelecionado.fornecedor}
          onChange={e => setContratoSelecionado({ ...contratoSelecionado, fornecedor: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Objeto do Contrato */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Objeto do Contrato</label>
        <textarea
          value={contratoSelecionado.objeto}
          onChange={e => setContratoSelecionado({ ...contratoSelecionado, objeto: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={4}
        />
      </div>

      {/* Valor */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Valor do Contrato (R$)</label>
        <input
          type="number"
          step="0.01"
          value={contratoSelecionado.valor}
          onChange={e => setContratoSelecionado({ ...contratoSelecionado, valor: parseFloat(e.target.value) })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Periodicidade */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Periodicidade de Pagamento</label>
        <select
          value={periodicidade}
          onChange={e => setPeriodicidade(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          <option>Único</option>
          <option>Diário</option>
          <option>Semanal</option>
          <option>Quinzenal</option>
          <option>Mensal</option>
          <option>Bimestral</option>
          <option>Trimestral</option>
          <option>Semestral</option>
        </select>
      </div>

      {/* Próximo Pagamento */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Próximo Pagamento</label>
        <input
          type="date"
          value={proximoPagamento}
          onChange={e => setProximoPagamento(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Encerramento */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Data de Encerramento</label>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={semDataEncerramento ? '' : dataEncerramento}
            onChange={e => setDataEncerramento(e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={semDataEncerramento}
          />
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={semDataEncerramento}
              onChange={e => setSemDataEncerramento(e.target.checked)}
            />
            <span>Sem data de encerramento</span>
          </label>
        </div>
      </div>

      {/* Controle */}
      <div>
        <label className="block font-medium text-sm text-gray-700">Controle</label>
        <select
          value={controle}
          onChange={e => setControle(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Selecione</option>
          <option>Definir dias da semana</option>
          <option>Semanal</option>
          <option>Quinzenal</option>
          <option>Mensal</option>
          <option>Bimestral</option>
          <option>Semestral</option>
        </select>
      </div>

      {controle === 'Definir dias da semana' && (
        <div className="flex flex-wrap gap-2">
          {diasSemana.map((dia) => (
            <label key={dia} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={diasControle.includes(dia)}
                onChange={() => toggleDia(dia)}
              />
              <span>{dia}</span>
            </label>
          ))}
        </div>
      )}

      {/* Upload do contrato */}
      <div>
        <label className="block font-medium text-sm text-gray-700 mb-1">Anexar novo contrato</label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border">
            <UploadCloud size={18} />
            <span className="text-sm">Selecionar arquivo</span>
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
          {arquivo && <span className="text-sm text-gray-600">{arquivo.name}</span>}
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={fecharModal}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            console.log('Salvar alterações:', contratoSelecionado);
            fecharModal();
          }}
          className="px-4 py-2 bg-[#5a0d0d] text-white rounded hover:bg-[#7a1a1a] transition"
        >
          Salvar
        </button>
      </div>
    </div>
  )}
  </div>

  {/* Observações - lado direito */}
  <div className="w-[30%] bg-gray-50 border-l border-gray-200 p-4 flex flex-col">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">Observações</h3>
    
<div className="flex-1 overflow-y-auto space-y-4 pr-2">
  {Array.isArray(contratoSelecionado?.observacao) && contratoSelecionado.observacao.length > 0 ? (
    contratoSelecionado.observacao.map((obs, index) => (
      <div key={index} className="flex items-start space-x-3">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
            {obs.autor?.[0] ?? '?'}
          </div>
          <span className="text-xs text-gray-500 mt-1 text-center max-w-[60px] truncate">
            {obs.autor ?? 'Desconhecido'}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-full">
          <p className="text-sm text-gray-800 mb-1">{obs.descricao ?? ''}</p>
          <span className="text-xs text-gray-400">{obs.data ?? ''}</span>
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500">Nenhuma observação disponível.</p>
  )}
</div>

    {/* Caixa para nova observação */}
    <div className="pt-4 flex gap-2 items-center">
      <input
        type="text"
        placeholder="Digite uma nova observação..."
        className="flex-1 border rounded-lg px-4 py-2 text-sm"
        value={novaObservacao}
        onChange={(e) => setNovaObservacao(e.target.value)}
      />
      <button
        onClick={() => handleNovaObservacao()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
      >
        Enviar
      </button>
    </div>
  </div>
</Dialog.Panel>

        </div>
      </Dialog>
    </div>
  );
}

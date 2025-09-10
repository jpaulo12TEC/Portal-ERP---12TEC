'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search } from "lucide-react";
import { ArrowLeft } from "lucide-react";

interface Contrato {
  id: number;
  nome: string;
  clausulas: string[];
  objeto: string;
}

interface Parte {
  nome: string;
  cpfCnpj: string;
  endereco: string;
}

export default function CriacaoDeContratos() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Contratos');
  const [loading, setLoading] = useState(false);

  // Dados do formulário
  const [contrato, setContrato] = useState<Contrato>({
    id: Date.now(),
    nome: '',
    clausulas: [''],
    objeto: '',
  });

  const [contratante, setContratante] = useState<Parte>({ nome: '', cpfCnpj: '', endereco: '' });
  const [contratado, setContratado] = useState<Parte>({ nome: '', cpfCnpj: '', endereco: '' });
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [prazoMeses, setPrazoMeses] = useState('');
  const [valorNum, setValorNum] = useState('');
  const [valorExtenso, setValorExtenso] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState('O pagamento será realizado após 30 (trinta) dias da emissão da nota fiscal pelo CONTRATANTE');
  const [condicoesRescisao, setCondicoesRescisao] = useState('Encerramento do prazo do contrato ou por convenção entre as partes a qualquer momento');
  const [prazoConfidencialidade, setPrazoConfidencialidade] = useState('duração do contrato');
  const [cidade, setCidade] = useState('Aracaju');
  const [estado, setEstado] = useState('Sergipe');
  const [foroCidade, setForoCidade] = useState('Aracaju');
  const [foroEstado, setForoEstado] = useState('Sergipe');
  const [geradoPor, setGeradoPor] = useState('');
// Obrigações padrão para o Contratado
const [obrigacoesContratado, setObrigacoesContratado] = useState([
  "1. Executar os serviços de acordo com as especificações acordadas;",
  "2. Cumprir os prazos estabelecidos para a entrega dos serviços;",
  "3. Manter sigilo sobre todas as informações e documentos recebidos;",
  "4. Responsabilizar-se por quaisquer danos causados por má execução."
]);

// Obrigações padrão para o Contratante
const [obrigacoesContratante, setObrigacoesContratante] = useState([
  "1. Fornecer todas as informações e documentos necessários para a execução dos serviços;",
  "2. Efetuar o pagamento nas condições e prazos estipulados;",
  "3. Garantir acesso às dependências ou recursos necessários para a execução dos serviços;",
  "4. Comunicar eventuais problemas ou necessidades de ajuste no prazo adequado."
]);

  // Função para enviar para API
  async function gerarContrato() {
    if (!contrato.objeto) return alert("Informe o objeto do contrato");
    if (!dataAssinatura) return alert("Informe a data de assinatura");

    setLoading(true);

const resHtml = await fetch('/modelos/CONTRATOSERVICO.html');
const htmlTemplate = await resHtml.text();

    const payload = {
      contrato: {
        ...contrato,
         html: htmlTemplate, // <- envia o modelo completo
        contratante,
        contratado,
        data_assinatura: dataAssinatura,
        data_inicio: dataInicio,
        prazo_meses: prazoMeses,
        valor_num: valorNum,
        valor_extenso: valorExtenso,
        condicoes_pagamento: condicoesPagamento,
        condicoes_rescisao: condicoesRescisao,
        prazo_confidencialidade: prazoConfidencialidade,
        cidade,
        estado,
        foro_cidade: foroCidade,
        foro_estado: foroEstado,
        gerado_por: geradoPor,
        obrigacoes_contratado_lista: obrigacoesContratado,
        obrigacoes_contratante_lista: obrigacoesContratante,
      }
    };

    try {
      const res = await fetch('/api/gerar_contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao gerar contrato');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contrato.nome || 'contrato'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      alert("Contrato gerado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar contrato");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
      {/* Topbar */}
      <div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => router.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              📄 GERADOR DE CONTRATOS
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={(tab: string) => setActiveTab(tab)}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main ref={containerRef} className={`content flex-1 p-8 min-h-screen overflow-y-auto ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
          <section className="max-w-5xl mx-auto bg-gray-700 p-8 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-green-400 font-extrabold text-3xl mb-4">📄 Dados do Contrato</h2>

            {/* Nome do contrato */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Nome do Contrato</label>
              <input
                type="text"
                placeholder="Digite o nome do contrato"
                className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                value={contrato.nome}
                onChange={e => setContrato({ ...contrato, nome: e.target.value })}
              />
            </div>

            {/* Objeto do contrato */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Objeto do Contrato</label>
              <textarea
                placeholder="Descreva o objeto do contrato..."
                className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                value={contrato.objeto}
                onChange={e => setContrato({ ...contrato, objeto: e.target.value })}
              />
            </div>

            {/* Restante do formulário continua igual */}
            {/* Contratante */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-green-300 font-semibold">Contratante</label>
                <input type="text" placeholder="Nome" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratante.nome} onChange={e => setContratante({ ...contratante, nome: e.target.value })} />
                <input type="text" placeholder="CPF/CNPJ" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratante.cpfCnpj} onChange={e => setContratante({ ...contratante, cpfCnpj: e.target.value })} />
                <input type="text" placeholder="Endereço" className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                  value={contratante.endereco} onChange={e => setContratante({ ...contratante, endereco: e.target.value })} />
              </div>

              {/* Contratado */}
              <div>
                <label className="block text-green-300 font-semibold">Contratado</label>
                <input type="text" placeholder="Nome" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratado.nome} onChange={e => setContratado({ ...contratado, nome: e.target.value })} />
                <input type="text" placeholder="CPF/CNPJ" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratado.cpfCnpj} onChange={e => setContratado({ ...contratado, cpfCnpj: e.target.value })} />
                <input type="text" placeholder="Endereço" className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                  value={contratado.endereco} onChange={e => setContratado({ ...contratado, endereco: e.target.value })} />
              </div>
            </div>

{/* Datas, prazos e valores */}
<div className="grid grid-cols-3 gap-6">
  <div>
    <label className="block text-green-300 font-semibold mb-2">Data da Assinatura</label>
    <input
      type="date"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={dataAssinatura}
      onChange={e => setDataAssinatura(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Data de Início</label>
    <input
      type="date"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={dataInicio}
      onChange={e => setDataInicio(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Prazo (meses)</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={prazoMeses}
      onChange={e => setPrazoMeses(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Valor numérico</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={valorNum}
      onChange={e => setValorNum(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Valor por extenso</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={valorExtenso}
      onChange={e => setValorExtenso(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Condições de pagamento</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={condicoesPagamento}
      onChange={e => setCondicoesPagamento(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Condições de rescisão</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={condicoesRescisao}
      onChange={e => setCondicoesRescisao(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Prazo de confidencialidade</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={prazoConfidencialidade}
      onChange={e => setPrazoConfidencialidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Foro cidade</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={foroCidade}
      onChange={e => setForoCidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Foro estado</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={foroEstado}
      onChange={e => setForoEstado(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Gerado por</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={geradoPor}
      onChange={e => setGeradoPor(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Cidade</label>
    <input
      type="text"
      placeholder="Digite a cidade"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={cidade}
      onChange={e => setCidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Estado</label>
    <input
      type="text"
      placeholder="Digite o estado"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={estado}
      onChange={e => setEstado(e.target.value)}
    />
  </div>
</div>


            {/* Cláusulas e Obrigações continuam iguais */}
            {/* Cláusulas */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Cláusulas</label>
              {contrato.clausulas.map((c, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={c} onChange={e => {
                      const copy = [...contrato.clausulas];
                      copy[idx] = e.target.value;
                      setContrato({ ...contrato, clausulas: copy });
                    }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setContrato({ ...contrato, clausulas: contrato.clausulas.filter((_, i) => i !== idx) })}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setContrato({ ...contrato, clausulas: [...contrato.clausulas, ''] })}>Adicionar Cláusula</button>
            </div>

            {/* Obrigações Contratado */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Obrigações do Contratado</label>
              {obrigacoesContratado.map((o, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={o} onChange={e => { const copy = [...obrigacoesContratado]; copy[idx] = e.target.value; setObrigacoesContratado(copy); }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setObrigacoesContratado(obrigacoesContratado.filter((_, i) => i !== idx))}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setObrigacoesContratado([...obrigacoesContratado, ''])}>Adicionar Obrigação</button>
            </div>

            {/* Obrigações Contratante */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Obrigações do Contratante</label>
              {obrigacoesContratante.map((o, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={o} onChange={e => { const copy = [...obrigacoesContratante]; copy[idx] = e.target.value; setObrigacoesContratante(copy); }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setObrigacoesContratante(obrigacoesContratante.filter((_, i) => i !== idx))}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setObrigacoesContratante([...obrigacoesContratante, ''])}>Adicionar Obrigação</button>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="bg-green-400 hover:bg-green-500 active:bg-green-600 px-10 py-3 rounded-lg text-white font-semibold shadow-md"
                onClick={gerarContrato} disabled={loading}>
                {loading ? 'Gerando...' : '🚀 Gerar Contrato'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

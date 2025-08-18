'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, UploadCloud, Search } from 'lucide-react';
import Sidebar from '../../../../../components/Sidebar';
import { ArrowLeft } from 'lucide-react';

export default function IniciarContrato() {
  const router = useRouter();

  // Estados principais do fornecedor e contrato
  const [cnpj, setCnpj] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState("");
  const [orcamentoResumo, setOrcamentoResumo] = useState(null);
  const [fornecedorInfo, setFornecedorInfo] = useState<{
    nome?: string;
    endereco?: string;
    contato?: string;
    numeroContato?: string;
    statusContrato?: string;
    servicos?: { id: string; nome: string; link?: string }[];
  }>({ servicos: [] });

  const orcamentos = [
  { id: 1, numero: "001/2025", descricao: "Compra de materiais elétricos", fornecedor: "Fornecedor X", valor: 1500.50 },
  { id: 2, numero: "002/2025", descricao: "Serviço de manutenção", fornecedor: "Fornecedor Y", valor: 2300.00 },
  // ... seus outros orçamentos
];

  const [servicoSelecionado, setServicoSelecionado] = useState('');
  const [objetoContrato, setObjetoContrato] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [pagamentoTipo, setPagamentoTipo] = useState('fixo'); // 'fixo' ou 'nota'
  const [periodicidade, setPeriodicidade] = useState('');
  const [proximoPagamento, setProximoPagamento] = useState('');
  const [diasAposNota, setDiasAposNota] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [semDataEncerramento, setSemDataEncerramento] = useState(false);
  const [controle, setControle] = useState('');
  const [diasControle, setDiasControle] = useState<string[]>([]);
  const [necessitaNR, setNecessitaNR] = useState(false);
  const [arquivoContrato, setArquivoContrato] = useState<File | null>(null);
  const [arquivosDocumentos, setArquivosDocumentos] = useState<(File | null)[]>([null, null, null]);
  const [descricaoDocs, setDescricaoDocs] = useState(['', '', '']);
  const [tipoContrato, setTipoContrato] = useState('');
  const [menuActive, setMenuActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('contratos');

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  // Simula busca fornecedor via API por CNPJ (deve trocar para fetch real)
  useEffect(() => {
    if (cnpj.length >= 14) {
      // Aqui você faz o fetch real, por enquanto mock:
      // Exemplo fake:
      const mockFornecedor = {
        nome: 'Fornecedor Exemplo LTDA',
        endereco: 'Rua Exemplo, 123, Bairro, Cidade - UF',
        contato: 'João Silva',
        numeroContato: '(11) 99999-9999',
        statusContrato: 'Ativo em contrato atual',
        servicos: [
          { id: '1', nome: 'Manutenção elétrica', link: '/servicos/1' },
          { id: '2', nome: 'Limpeza industrial', link: '/servicos/2' },
        ],
      };
      setFornecedorInfo(mockFornecedor);
    } else {
      setFornecedorInfo({ servicos: [] }); // Limpa info se cnpj inválido
    }
    setServicoSelecionado('');
  }, [cnpj]);

  const toggleDia = (dia: string) => {
    setDiasControle((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handleOrcamentoChange = (id) => {
  setOrcamentoSelecionado(id);
  const selecionado = orcamentos.find((o) => o.id === parseInt(id));
  setOrcamentoResumo(selecionado || null);
};

  const handleArquivoContratoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setArquivoContrato(e.target.files[0]);
  };

  const handleArquivoDocChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newArquivos = [...arquivosDocumentos];
      newArquivos[index] = e.target.files[0];
      setArquivosDocumentos(newArquivos);
    }
  };

  const handleDescricaoDocChange = (index: number, value: string) => {
    const newDescricoes = [...descricaoDocs];
    newDescricoes[index] = value;
    setDescricaoDocs(newDescricoes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Aqui envia para API ou backend - log só para debug:
    console.log({
      cnpj,
      fornecedorInfo,
      servicoSelecionado,
      objetoContrato,
      valorUnitario,
      unidadeMedida,
      pagamentoTipo,
      periodicidade,
      proximoPagamento,
      diasAposNota,
      dataEncerramento: semDataEncerramento ? 'Sem data' : dataEncerramento,
      controle,
      diasControle,
      necessitaNR,
      arquivoContrato,
      arquivosDocumentos,
      descricaoDocs,
      tipoContrato,
    });
    alert('Contrato salvo (mock)');
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        menuActive ? 'ml-[300px]' : 'ml-[80px]'
      } ${isModalOpen ? 'backdrop-blur-lg' : ''}`}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
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
          onNavClickAction={(tab) => {
            setActiveTab(tab);
            router.push(`/dashboard/${tab}`);
          }}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        

        <main className="p-6 w-full max-w-[1100px] mx-auto overflow-auto">
          <h1 className="text-2xl font-bold text-[#5a0d0d] mb-6">Iniciar Novo Contrato</h1>
          
          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 space-y-8">


          <div >
  <label className="block font-medium text-sm text-gray-700 mb-2">
    Selecionar Orçamento
  </label>
 <div className="flex flex-col md:flex-row gap-4">
        <select
          value={orcamentoSelecionado}
          onChange={(e) => handleOrcamentoChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-[#5a0d0d] outline-none"
        >
          <option value="">-- Selecione --</option>
          {orcamentos.map((orc) => (
            <option key={orc.id} value={orc.id}>
              {orc.numero}
            </option>
          ))}
        </select>

        {orcamentoResumo && (
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
            <p>
              <span className="font-medium">Descrição:</span>{" "}
              {orcamentoResumo.descricao}
            </p>
            <p>
              <span className="font-medium">Fornecedor Vencedor:</span>{" "}
              {orcamentoResumo.fornecedor}
            </p>
            <p>
              <span className="font-medium">Valor:</span> R${" "}
              {orcamentoResumo.valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        )}
      </div>
</div>


            {/* CNPJ do fornecedor */}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

              
              <div>
                <label className="block font-medium text-sm text-gray-700">
                  CNPJ ou CPF do Fornecedor
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-sm text-gray-700">Nome do Fornecedor</label>
                <input
                  type="text"
                  value={fornecedorInfo.nome || ''}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                  placeholder="Preencha o CNPJ"
                />
              </div>

              <div>
                <label className="block font-medium text-sm text-gray-700">Status do Fornecedor</label>
                <input
                  type="text"
                  value={fornecedorInfo.statusContrato || ''}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Endereço e contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-sm text-gray-700">Endereço</label>
                <input
                  type="text"
                  value={fornecedorInfo.endereco || ''}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-medium text-sm text-gray-700">Contato</label>
                <input
                  type="text"
                  value={fornecedorInfo.contato || ''}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-sm text-gray-700">Número do Contato</label>
                <input
                  type="text"
                  value={fornecedorInfo.numeroContato || ''}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-sm text-gray-700">Serviço do Fornecedor</label>
                <select
                  value={servicoSelecionado}
                  onChange={(e) => setServicoSelecionado(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={!fornecedorInfo.servicos || fornecedorInfo.servicos.length === 0}
                >
                  <option value="">Selecione um serviço</option>
                  {fornecedorInfo.servicos?.map((servico) => (
                    <option key={servico.id} value={servico.id}>
                      {servico.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div />
            </div>

            {/* Objeto do contrato */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Objeto do Contrato</label>
              <textarea
                value={objetoContrato}
                onChange={(e) => setObjetoContrato(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                required
              />
            </div>

            {/* Valor Unitário e Unidade de Medida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-sm text-gray-700">Valor Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-sm text-gray-700">Unidade de Medida</label>
                <input
                  type="text"
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: hora, m², unidade..."
                  required
                />
              </div>
            </div>

            {/* Tipo de pagamento */}
            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">Tipo de Pagamento</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pagamentoTipo"
                    value="fixo"
                    checked={pagamentoTipo === 'fixo'}
                    onChange={() => setPagamentoTipo('fixo')}
                  />
                  <span>Fixo por período</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pagamentoTipo"
                    value="nota"
                    checked={pagamentoTipo === 'nota'}
                    onChange={() => setPagamentoTipo('nota')}
                  />
                  <span>Após emissão de Nota Fiscal</span>
                </label>
              </div>
            </div>

            {/* Campos dinâmicos pagamento */}
            {pagamentoTipo === 'fixo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-sm text-gray-700">Periodicidade de Pagamento</label>
                  <select
                    value={periodicidade}
                    onChange={(e) => setPeriodicidade(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
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
                <div>
                  <label className="block font-medium text-sm text-gray-700">Próximo Pagamento</label>
                  <input
                    type="date"
                    value={proximoPagamento}
                    onChange={(e) => setProximoPagamento(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
            )}

            {pagamentoTipo === 'nota' && (
              <div>
                <label className="block font-medium text-sm text-gray-700">
                  Dias para pagamento após emissão da Nota Fiscal
                </label>
                <input
                  type="number"
                  min={0}
                  value={diasAposNota}
                  onChange={(e) => setDiasAposNota(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            )}

            {/* Data de Encerramento */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Data de Encerramento</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={semDataEncerramento ? '' : dataEncerramento}
                  onChange={(e) => setDataEncerramento(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  disabled={semDataEncerramento}
                />
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={semDataEncerramento}
                    onChange={(e) => setSemDataEncerramento(e.target.checked)}
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
                onChange={(e) => setControle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
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

            {/* NR's necessárias */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={necessitaNR}
                  onChange={(e) => setNecessitaNR(e.target.checked)}
                />
                <span>Será necessário NR(s) para realizar o serviço?</span>
              </label>
            </div>

            {/* Anexos */}
            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">Anexar Contrato</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border">
                  <UploadCloud size={18} />
                  <span className="text-sm">Selecionar arquivo</span>
                  <input type="file" onChange={handleArquivoContratoChange} className="hidden" />
                </label>
                {arquivoContrato && <span className="text-sm text-gray-600">{arquivoContrato.name}</span>}
              </div>
            </div>

            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">
                Anexar Documentos Opcionais (até 3)
              </label>
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
<label
  className="flex items-center gap-3 cursor-pointer bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded border text-xs select-none"
  
>
  <UploadCloud size={19} />
  <span className="whitespace-nowrap">Arquivo {idx + 1}</span>
  <input
    type="file"
    onChange={(e) => handleArquivoDocChange(idx, e)}
    className="hidden"
  />
</label>
                  <input
                    type="text"
                    placeholder="Descrição do documento"
                    value={descricaoDocs[idx]}
                    onChange={(e) => handleDescricaoDocChange(idx, e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  {arquivosDocumentos[idx] && (
                    <span className="text-sm text-gray-600">{arquivosDocumentos[idx]?.name}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Tipo de contrato */}
            <div>
              <label className="block font-medium text-sm text-gray-700">Tipo de Contrato</label>
              <select
                value={tipoContrato}
                onChange={(e) => setTipoContrato(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Selecione</option>
                <option>Por demanda</option>
                <option>Mensal</option>
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Diário</option>
                <option>Fixo</option>
                <option>Outro</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-[#5a0d0d] text-white px-6 py-2 rounded hover:bg-[#7a1a1a] transition-all"
            >
              Salvar Contrato
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

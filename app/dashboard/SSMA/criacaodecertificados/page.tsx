'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search } from "lucide-react";
import { supabase } from '@/lib/superbase';
import { useUser } from '@/components/UserContext';
import Select from 'react-select';
import { ArrowLeft,  PlusCircle, Trash2, Calendar, LineChart, Repeat, Package, FilePlus, FolderKanban, Wallet, BarChart3, ClipboardList, FileText } from "lucide-react";

interface Funcionario {
  id: number;
  nome_completo: string;
  cpf: string;
  cargo: string;
}

interface Certificado {
  id: number;
  nome: string;
  link_modelo: string;
  url_imagem_frente: string;
  url_imagem_costa: string;
  carga_horaria: number;
  descricao: string;
}

export default function CriacaoDeCertificados() {
  const [loading, setLoading] = useState(false);
  const { nome } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Certificados');

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [dataInicial, setDataInicial] = useState<string>('');
  const [certSelecionados, setCertSelecionados] = useState<Certificado[]>([]);
  const [funcSelecionados, setFuncSelecionados] = useState<Record<number, number[]>>({});
  const [diasEntreCursos, setDiasEntreCursos] = useState<number>(0);

  // Estado para imagem ampliada no hover/click
  const [previewImage, setPreviewImage] = useState<string | null>(null);

useEffect(() => {
  async function fetchData() {
    // Funcionários ordenados por nome_completo
    const { data: func, error: funcError } = await supabase
      .from("funcionarios")
      .select("*")
      .order("nome_completo", { ascending: true });

    if (funcError) console.error(funcError);
    else setFuncionarios(func as Funcionario[]);

    // Certificados ordenados por nome
    const { data: cert, error: certError } = await supabase
      .from("certificacoes")
      .select("*")
      .order("nome", { ascending: true });

    if (certError) console.error(certError);
    else setCertificados(cert as Certificado[]);
  }

  fetchData();
}, []);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  function ajustarDataInicial(dataStr: string): string {
    const data = new Date(dataStr);
    if (data.getDay() === 0) {
      data.setDate(data.getDate() + 1);
      return data.toISOString().slice(0, 10);
    }
    return dataStr;
  }


// Cria string YYYY-MM-DD no fuso local
function formatarDataISOLocal(data: Date) {
  const d = data;
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}


// Helpers de dias úteis
function ehFimDeSemana(d: Date) {
  const g = d.getDay();
  return g === 0 || g === 6; // 0=Domingo, 6=Sábado
}
function avancarParaProximoDiaUtil(d: Date): Date {
  const nd = new Date(d);
  while (ehFimDeSemana(nd)) {
    nd.setDate(nd.getDate() + 1);
  }
  return nd;
}

function normalizarData(data: Date): Date {
  const nova = new Date(data);
  nova.setHours(0, 0, 0, 0); // zera as horas
  return nova;
}

// dataInicial está em formato YYYY-MM-DD
function criarDataLocal(dataStr: string): Date {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return new Date(ano, mes - 1, dia); // cria já no fuso local
}



// --- Calcula próxima data considerando 8h/dia e fim de semana ---
function calcularProximaData(
  dataAtual: Date,
  cargaHorariaHoras: number,
  horasNoDia: number = 0, // passa as horas já usadas nesse dia
  diasEntreCursos: number = 0
): { novaData: Date; horasNoDia: number } {
  const HORAS_POR_DIA = 8;
  let horasRestantes = cargaHorariaHoras;
  let novaData = new Date(dataAtual);

  // garante início em dia útil
  if (ehFimDeSemana(novaData)) {
    novaData = avancarParaProximoDiaUtil(novaData);
    horasNoDia = 0;
  }

  while (horasRestantes > 0) {
    // se o dia estiver cheio, pula para o próximo dia útil
    if (horasNoDia >= HORAS_POR_DIA) {
      do {
        novaData.setDate(novaData.getDate() + 1);
      } while (ehFimDeSemana(novaData));
      horasNoDia = 0;
    }

    // consome o que cabe no dia
    const disponivel = HORAS_POR_DIA - horasNoDia;
    const consumo = Math.min(horasRestantes, disponivel);
    horasNoDia += consumo;
    horasRestantes -= consumo;

    // se ainda restarem horas, o loop vai automaticamente para o próximo dia
  }

  // aplica pausa entre cursos (dias úteis)
  for (let i = 0; i < diasEntreCursos; ) {
    novaData.setDate(novaData.getDate() + 1);
    if (!ehFimDeSemana(novaData)) i++;
  }

  return { novaData, horasNoDia };
}




async function gerarTodosCertificados() {
  if (!dataInicial) return alert("Selecione a data inicial");

  const funcionariosSelecionadosIds = Object.values(funcSelecionados).flat();
  if (!funcionariosSelecionadosIds.length)
    return alert("Selecione ao menos um funcionário para cada certificado");

  setLoading(true); // INICIO DO LOADING

  // Permite pretérita, mas garante início em dia útil
let dataAtual = avancarParaProximoDiaUtil(
  normalizarData(criarDataLocal(dataInicial))
);
  let horasUsadasNoDia = 0; // controla horas já ocupadas no dia corrente (max 8)

  for (let idx = 0; idx < certSelecionados.length; idx++) {
    const cert = certSelecionados[idx];
    const funcionariosDoCert = funcSelecionados[cert.id] || [];

    // data_inicio é a data do início do curso (pode ser o mesmo dia de outros cursos se couber nas 8h)
    const dataInicioISO = formatarDataISOLocal(dataAtual);

    for (const funcId of funcionariosDoCert) {
      const funcionario = funcionarios.find((f) => f.id === funcId);
      if (!funcionario) continue;

      const payload = {
        funcionario,
        certificado: {
          ...cert,
          link_modelo: `/certificados-modelos/${encodeURIComponent(cert.nome)}.svg`,
        },
        data_inicio: dataInicioISO,
      };

      const res = await fetch("https://intranet12tec.onrender.com/api/gerar-certificados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`Erro ao gerar certificado de ${funcionario.nome_completo}`);
        continue;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Helpers
const formatarDataParaNome = (dataISO: string) => {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia.padStart(2, "0")}.${mes.padStart(2, "0")}.${ano}`; // Ex: 27.08.2025
};
      const sanitizarTexto = (texto: string) => texto.replace(/[\\/:*?"<>|]/g, "").trim();

      const dataFormatada = formatarDataParaNome(dataInicioISO);
      const nomeCertificado = sanitizarTexto(cert.nome);
      const nomeFuncionario = sanitizarTexto(funcionario.nome_completo);
      const nomeArquivo = `${dataFormatada} - ${nomeCertificado} - ${nomeFuncionario}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Aplica consumo de horas + pausa entre cursos (apenas se não for o último curso)
    const pausa = idx < certSelecionados.length - 1 ? diasEntreCursos : 0;
  const prox = calcularProximaData(dataAtual, cert.carga_horaria, horasUsadasNoDia, pausa);
  dataAtual = prox.novaData;
  horasUsadasNoDia = prox.horasNoDia; // importante: mantém as horas usadas do dia
  }

  setLoading(false); // FIM DO LOADING
  alert("Todos os certificados foram gerados!");
}


  // Custom Styles para react-select com gamificação leve
  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      borderRadius: '12px',
      borderColor: '#4ade80', // verde suave
      boxShadow: '0 0 8px #4ade80aa',
      '&:hover': { borderColor: '#22c55e' },
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      backgroundColor: '#1f2937', // bg mais escuro porém suave
      color: 'white',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#dcfce7' : '#f0fdf4',
      color: '#166534',
      cursor: 'pointer',
      fontWeight: state.isSelected ? '700' : '400',
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#bbf7d0',
      color: '#166534',
      borderRadius: '8px',
      padding: '2px 6px',
      fontWeight: '600',
    }),
  };

  return (
    <div className="flex flex-col h-[200v] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
      {/* TopBar */}
      {/* Topbar */}
      <div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              SSMA - Segurança do Trabalho e Saúde 14TEC
            </button>
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

      {/* Conteúdo principal */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main
          ref={containerRef}
          className={`content flex-1 p-8 min-h-screen overflow-y-auto ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}
         
        >
<section className="flex w-full mb-8 items-center justify-between gap-12">
      {/* Coluna direita - conteúdo alinhado à esquerda */}
  <div className="flex flex-col flex-1 items-end justify-center">
    <h2 className="text-green-400 font-extrabold text-3xl md:text-4xl select-none leading-tight tracking-wide text-left">
      🚀 GERADOR<br className="hidden md:block" /> DE CERTIFICADOS
    </h2>
  </div>

  {/* Coluna esquerda - conteúdo alinhado à direita */}
  <div className="flex flex-col flex-1 items-start gap-6">
    {/* Data inicial */}
    <div className="flex flex-col items-start">
      <label className="mb-2 text-green-400 font-bold text-lg select-none text-left">📅 Data inicial</label>
      <input
        type="date"
        value={dataInicial}
        onChange={e => setDataInicial(ajustarDataInicial(e.target.value))}
        className="bg-gray-700 border-2 border-green-500 rounded-xl px-4 py-2 text-white font-semibold hover:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-300 transition"
              />
    </div>

    {/* Dias entre cursos */}
    {certSelecionados.length > 1 && (
      <div className="flex flex-col items-start">
        <label className="mb-2 text-green-400 font-bold text-lg select-none text-left">⏳ Dias entre cursos</label>
        <input
          type="number"
          min={0}
          value={diasEntreCursos}
          onChange={e => setDiasEntreCursos(parseInt(e.target.value) || 0)}
          className="bg-gray-700 border-2 border-green-500 rounded-xl px-4 py-2 text-white font-semibold w-24 text-center hover:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-300 transition"
        />
      </div>
    )}

    {/* Seleção de certificados */}
    <section className="w-full max-w-xl">
      <label className="block mb-2 text-green-400 font-extrabold text-xl select-none text-left">🎓 Selecione os Certificados</label>
      <Select
        isMulti
        options={certificados.map(c => ({ value: c.id, label: c.nome }))}
        onChange={selected => {
          const certs = selected.map(s => certificados.find(c => c.id === s.value)!);
          setCertSelecionados(certs);
          if (certs.length <= 1) setDiasEntreCursos(0);
        }}
        styles={customSelectStyles}
        placeholder="Escolha um ou mais treinamentos..."
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        noOptionsMessage={() => "Nenhum certificado encontrado"}
      />
    </section>
  </div>


</section>



          {/* Cards de Certificados Selecionados */}
          <section className="space-y-10 max-w-5xl mx-auto">
            {certSelecionados.map(cert => (
              <div
                key={cert.id}
                className="bg-gray-700 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center md:items-start gap-8 border-4 border-green-500 hover:border-green-400 transition-all duration-400"
              >
                {/* Imagens empilhadas verticalmente com hover para ampliar */}
                <div className="flex flex-col gap-6 cursor-pointer select-none">
                  {[
                    { label: 'Frente', src: cert.url_imagem_frente },
                    { label: 'Costa', src: cert.url_imagem_costa }
                  ].map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-80 h-40 rounded-xl overflow-hidden shadow-xl border-2 border-green-500 hover:scale-105 hover:shadow-2xl transition-transform duration-300"
                      onClick={() => setPreviewImage(img.src)}
                    >
                      <img
                        src={img.src}
                        alt={`${cert.nome} ${img.label.toLowerCase()}`}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 left-1 bg-green-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold select-none">
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Descrição e seleção de funcionários */}
                <div className="flex-1 text-green-300 flex flex-col justify-between min-w-[280px]">
                  <h3 className="text-3xl font-extrabold mb-4 text-green-400">{cert.nome}</h3>
                  <p className="mb-6 leading-relaxed whitespace-pre-wrap">{cert.descricao}</p>

                  <div className="text-green-200 mb-4">
                    <p><strong>Carga horária:</strong> {cert.carga_horaria} horas</p>
                    <p><strong>Alunos adicionados:</strong> {funcSelecionados[cert.id]?.length || 0}</p>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-green-400">Funcionários</label>
                    <Select
                      isMulti
                      options={funcionarios.map(f => ({ value: f.id, label: f.nome_completo }))}
                      onChange={selected =>
                        setFuncSelecionados(prev => ({
                          ...prev,
                          [cert.id]: selected ? selected.map(s => s!.value) : [],
                        }))
                      }
                      value={funcSelecionados[cert.id]?.map(id => {
                        const f = funcionarios.find(f => f.id === id);
                        return f ? { value: f.id, label: f.nome_completo } : null;
                      }).filter(Boolean) as { value: number; label: string }[]}
                      styles={customSelectStyles}
                      placeholder="Selecione funcionários..."
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      noOptionsMessage={() => "Nenhum funcionário encontrado"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Botão para gerar certificados */}
          <div className="mt-20 flex justify-center">
{/* Botão para gerar certificados */}
<div className="mt-12 flex justify-center">
<button
  onClick={gerarTodosCertificados}
  className={`bg-green-400 hover:bg-green-500 active:bg-green-600 transition rounded-lg px-10 py-3 text-white text-lg font-semibold shadow-md shadow-green-400/40 select-none flex items-center justify-center gap-3`}
  disabled={loading}
  title="Clique para gerar todos os certificados"
>
  {loading ? (
    <>
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Gerando...
    </>
  ) : (
    '🚀 Gerar Todos os Certificados'
  )}
</button>
</div>

          </div>
        </main>
      </div>

      {/* Modal de visualização de imagem ampliada */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Visualização ampliada"
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

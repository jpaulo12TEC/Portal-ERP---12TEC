'use client';  
import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/superbase';
import * as XLSX from 'xlsx';
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";


type RegistroREP = {
  nsr: string;
  tipo: string;
  data: string;
  hora: string;
  pis: string;
  nome?: string;
};

type RegistroFinal = {
  pis: string;
  nome: string;
  data: string;
  dia?: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  esperado?: string;
  horaExtra?: string;
  horaFaltando?: string;
  isWeekend?: boolean;
  autoAdded?: Record<string, boolean>;
};

export default function DashboardREP() {
const componentRef = useRef<HTMLDivElement | null>(null);

  const [menuActive, setMenuActive] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
    const [urlArquivo, setUrlArquivo] = useState('');
    const [activeTab, setActiveTab] = useState<string>('Pessoal');
  const [registros, setRegistros] = useState<RegistroFinal[]>([]);
  const [processando, setProcessando] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

const handlePrint = useReactToPrint({
  contentRef: componentRef,
   documentTitle: `Folha_de_Ponto_${colaboradorSelecionado}_${mesSelecionado}_${anoSelecionado}`,
  pageStyle: `
    @page {
      size: A4;
      margin: 0mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        font-size: 12px; /* antes 10px */
        line-height: 1.4; /* antes 1.2 */
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px; /* antes 9px */
        line-height: 1.3;
      }
      th, td {
        padding: 4px 6px; /* um pouco mais de respiro */
      }
      h1 {
        font-size: 20px;
      }
      h2 {
        font-size: 16px;
      }
      .print\\:hidden {
        display: none;
      }
    }
  `,
});





  const uploadArquivo = async (file: File) => {
  const nomeArquivo = "AFD.txt";
  const caminho = nomeArquivo;

  // Remove o arquivo anterior (sobrescrever)
  await supabase.storage.from('arquivos').remove([caminho]);

  // Faz o upload do novo arquivo
  const { data, error } = await supabase.storage
    .from('arquivos')
    .upload(caminho, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  // Pega a URL pública
  const { data: publicUrl } = supabase.storage.from('arquivos').getPublicUrl(caminho);

  return publicUrl.publicUrl;
};


const registrarArquivoNoBanco = async (url: string) => {
  const { error } = await supabase
    .from('afd')
    .upsert([
      { url, created_at: new Date().toISOString() }
    ]);

  if (error) throw error;
};



   // Ao entrar na página, pegar o último arquivo do Supabase e processar
useEffect(() => {
  const fetchUltimoArquivo = async () => {
    const { data: ultimoArquivo, error } = await supabase
      .from('afd')
      .select('url, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      return;
    }
    if (ultimoArquivo?.url) {
      setUrlArquivo(ultimoArquivo.url);
      processarArquivo(ultimoArquivo.url);

      // Formatando a data legível
      const data = new Date(ultimoArquivo.created_at);
      const formatted = `${String(data.getDate()).padStart(2,'0')}/${
        String(data.getMonth()+1).padStart(2,'0')
      }/${data.getFullYear()} ${String(data.getHours()).padStart(2,'0')}:${
        String(data.getMinutes()).padStart(2,'0')
      }`;
      setUltimaAtualizacao(formatted);
    }
  };
  fetchUltimoArquivo();
}, []);




  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArquivo(e.target.files?.[0] || null);
  };

  const extrairPisENome = (linha: string) => {
    const nomeMatch = linha.match(/[A-ZÀ-Ú][A-ZÀ-Ú\s]+/);
    if (!nomeMatch) return { pis: '', nome: '' };
    const nome = nomeMatch[0].trim();
    const indexNome = linha.indexOf(nome);
    const numerosAntes = linha.slice(0, indexNome).match(/\d{10,11}/g);
    const pis = numerosAntes ? numerosAntes[numerosAntes.length - 1] : '';
    return { pis, nome };
  };
const gerarDiasMesCompleto = (colab: string) => {
  if (!anoSelecionado || !mesSelecionado) return [];
  
  const diasNoMes = new Date(parseInt(anoSelecionado), parseInt(mesSelecionado), 0).getDate();
  const registrosColab = registros.filter(r => r.nome === colab);

  const resultado: RegistroFinal[] = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const diaStr = String(dia).padStart(2, '0');
    const dataISO = `${anoSelecionado}-${mesSelecionado}-${diaStr}`;
    const existente = registrosColab.find(r => r.data === dataISO);



    const diaDate = new Date(parseInt(anoSelecionado), parseInt(mesSelecionado) - 1, dia);
    const diaSemana = diaDate.getDay(); // 0=domingo, 6=sábado
    
    let esperadoPadrao = 9; // segunda a quinta
    if (diaSemana === 5 || diaSemana === 0 || diaSemana === 6) esperadoPadrao = 8;

    if (existente) {
      const batidas = [existente.entrada1, existente.saida1, existente.entrada2, existente.saida2].filter(Boolean);
      const esperado = batidas.length === 4 ? esperadoPadrao.toFixed(2) : '';
      
      let horaFaltando = existente.horaFaltando;
      // Não mostrar hora faltando no fim de semana se não tiver 4 batidas
      if ((diaSemana === 0 || diaSemana === 6) && batidas.length < 4) {
        horaFaltando = '';
      }

      resultado.push({ ...existente, esperado, horaFaltando });
    } else {const mesNum = parseInt(mesSelecionado);
      // Nenhum registro, linha completa
      resultado.push({
        pis: colab,
        nome: colaboradorSelecionado,
dia: diaDate.toLocaleDateString('pt-BR', { weekday: 'long' }),
data: `${String(dia).padStart(2,'0')}/${String(mesNum).padStart(2,'0')}/${anoSelecionado}`,

        entrada1: '',
        saida1: '',
        entrada2: '',
        saida2: '',
        esperado: '',
        horaExtra: '',
        horaFaltando: (diaSemana === 0 || diaSemana === 6) ? '' : esperadoPadrao.toFixed(2),
        autoAdded: {},
        isWeekend: diaSemana === 0 || diaSemana === 6
      });
    }
  }

  return resultado;
};



  const calcularHorasTotais = (horas: string[]) => {
    let total = 0;
    for (let i = 0; i < horas.length; i += 2) {
      if (horas[i] && horas[i + 1]) {
        const [h1, m1] = horas[i].split(':').map(Number);
        const [h2, m2] = horas[i + 1].split(':').map(Number);
        total += (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
      }
    }
    return total;
  };

const processarArquivo = async (urlArquivo?: string) => {
  try {
    setProcessando(true);

    // Buscar arquivo — pode vir do Storage (URL) ou do input local
    let text = '';
    if (urlArquivo) {
      const response = await fetch(urlArquivo);
      if (!response.ok) throw new Error('Erro ao baixar arquivo do Supabase');
      text = await response.text();
    } else if (arquivo) {
      const reader = new FileReader();
      text = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(arquivo);
      });
    } else {
      alert('Nenhum arquivo encontrado!');
      setProcessando(false);
      return;
    }
    const linhas = text.split('\n').filter(l => l.trim() !== '');

    const colaboradores: Record<string, string> = {};
    const registrosMap: Record<string, RegistroREP[]> = {};

    // Extrair colaboradores e organizar registros por pis-data
    linhas.forEach(linha => {
      const nomeMatch = linha.match(/[A-ZÀ-Ú][A-ZÀ-Ú\s]{2,}[A-ZÀ-Ú]/);
      if (nomeMatch) {
        const { pis, nome } = extrairPisENome(linha);
        if (pis && nome) colaboradores[pis] = nome;
        return;
      }

      try {
        const nsr = linha.slice(0, 9);
        const dataRaw = linha.slice(10, 18);
        const horaRaw = linha.slice(18, 22);
        const pisMatch = linha.match(/\d{10,11}/g);
        if (!pisMatch) return;
        const pis = pisMatch[pisMatch.length - 1];

        const ano = parseInt(dataRaw.slice(4, 8));
        const mes = parseInt(dataRaw.slice(2, 4)) - 1;
        const dia = parseInt(dataRaw.slice(0, 2));
        const dataObj = new Date(ano, mes, dia);
        const data = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;

        const hora = `${horaRaw.slice(0, 2)}:${horaRaw.slice(2, 4)}`;
        const key = `${pis}-${data}`;
        if (!registrosMap[key]) registrosMap[key] = [];
        registrosMap[key].push({ nsr, tipo: 'PONTO', data, hora, pis, nome: colaboradores[pis] });
      } catch {}
    });

    const registrosFinal: RegistroFinal[] = [];

    // Função para organizar e inferir batidas com ajuste automático
const ordenarEBaterPontos = (batidas: RegistroREP[], diaDate: Date) => {
  const padrao = ['07:00', '12:00', '13:00', diaDate.getDay() === 5 ? '16:00' : '17:00'];
  const copia: string[] = ['', '', '', ''];
  const autoAdded: Record<string, boolean> = {};

  const totalEmMinutos = (hora: string) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  // Quadrante inicial (meio é único)
  const quadranteInicial = (hora: string) => {
    const min = totalEmMinutos(hora);
    if (min >= 360 && min <= 540) return 0; // entrada1
    if (min > 600 && min <= 840) return 1;  // quadrante do meio
    if (min > 900 && min <= 1020) return 3; // saída2
    return -1;
  }

  // Colocar entrada1 e saída2
  batidas.forEach(b => {
    const q = quadranteInicial(b.hora);
    if(q === 0) copia[0] = b.hora;
    if(q === 3) copia[3] = b.hora;
  });

  // Processar quadrante do meio
  const meio: string[] = batidas
    .filter(b => quadranteInicial(b.hora) === 1)
    .map(b => b.hora)
    .sort();

  if (meio.length === 1) {
    const min = totalEmMinutos(meio[0]);
    copia[min <= 720 ? 1 : 2] = meio[0]; // <=12:00 saída1, >12:00 entrada2
  } else if (meio.length >= 2) {
    copia[1] = meio[0];                  // saída1 = menor
    copia[2] = meio[meio.length - 1];    // entrada2 = maior
  }
const horaString = (minutos: number) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};

  // Ajuste automático se faltar ponto(s)
  const esperado = (diaDate.getDay() === 5 ? 8 : [0,6].includes(diaDate.getDay()) ? 8 : 9) * 60;

  let totalBatido = (copia[1] && copia[0] ? totalEmMinutos(copia[1]) - totalEmMinutos(copia[0]) : 0)
                  + (copia[3] && copia[2] ? totalEmMinutos(copia[3]) - totalEmMinutos(copia[2]) : 0);
 let diferenca = esperado - totalBatido;


  const indicesVazios = copia.map((v,i) => v === '' ? i : -1).filter(i => i !== -1);

if(indicesVazios.length === 1){
  const i = indicesVazios[0];
  const [e1,s1,e2,s2] = copia.map(h => h ? totalEmMinutos(h) : null);

  switch(i){
    case 0: // entrada1
      copia[i] = s1 !== null && e2 !== null && s2 !== null
        ? horaString(Math.max(0, s1 - (esperado - (s2 - e2))))
        : padrao[i];
      break;
    case 1: // saída1
      copia[i] = e1 !== null && e2 !== null && s2 !== null
        ? horaString(e1 + (esperado - (s2 - e2)))
        : padrao[i];
      break;
    case 2: // entrada2
      copia[i] = s2 !== null && e1 !== null && s1 !== null
        ? horaString(s2 - (esperado - (s1 - e1)))
        : padrao[i];
      break;
    case 3: // saída2
      copia[i] = e2 !== null && e1 !== null && s1 !== null
        ? horaString(e2 + (esperado - (s1 - e1)))
        : padrao[i];
      break;
  }

  autoAdded[['entrada1','saida1','entrada2','saida2'][i]] = true;
}
else if(indicesVazios.length > 1){
  const [e1, s1, e2, s2] = copia.map(h => h ? totalEmMinutos(h) : null);
  let restantes = indicesVazios.slice();

  // Preenche os que forem padrões (entrada1 e entrada2)
  for(const i of [0,2]){
    if(restantes.includes(i)){
      copia[i] = padrao[i];
      autoAdded[['entrada1','saida1','entrada2','saida2'][i]] = true;
      restantes = restantes.filter(x => x !== i);
    }
  }

  // Compensa o último ponto restante
  if(restantes.length){
    const i = restantes[0];

    switch(i){
      case 1: // saída1
        copia[i] = e1 !== null && e2 !== null && s2 !== null
          ? horaString(e1 + (esperado - (s2 - e2)))
          : padrao[i];
        break;
      case 3: // saída2
        copia[i] = e2 !== null && e1 !== null && s1 !== null
          ? horaString(e2 + (esperado - (s1 - e1)))
          : padrao[i];
        break;
    }
    autoAdded[['entrada1','saida1','entrada2','saida2'][i]] = true;
  }
}


  return { copia, autoAdded };
}




    // Processar cada conjunto de batidas
    Object.values(registrosMap).forEach(arr => {
      if (!arr[0].nome) return;

      arr.sort((a, b) => a.hora.localeCompare(b.hora));
      const [ano, mes, dia] = arr[0].data.split('-').map(Number);
      const diaDate = new Date(ano, mes - 1, dia);
      const isWeekend = [0, 6].includes(diaDate.getDay());

      const { copia, autoAdded } = isWeekend ? {
        copia: [...arr.slice(0,4).map(r => r.hora), ...Array(Math.max(0, 4 - arr.length)).fill('')],
        autoAdded: {}
      } : ordenarEBaterPontos(arr, diaDate);

      const total = calcularHorasTotais(copia.filter(Boolean) as string[]);
      const esperado = (diaDate.getDay() === 5 ? 8 : [0,6].includes(diaDate.getDay()) ? 8 : 9) * 60;

      
      const esperadoHoras = (diaDate.getDay() === 5 || [0,6].includes(diaDate.getDay()) ? 8 : 9);
const totalHoras = calcularHorasTotais(copia.filter(Boolean) as string[]); // já em horas
const horaExtra = totalHoras > esperadoHoras ? (totalHoras - esperadoHoras).toFixed(2) : '';
const horaFaltando = totalHoras < esperadoHoras ? (esperadoHoras - totalHoras).toFixed(2) : '';


      registrosFinal.push({
        pis: arr[0].pis,
        nome: arr[0].nome || '',
        data: arr[0].data,
        dia: diaDate.toLocaleDateString('pt-BR', { weekday: 'long' }),
        entrada1: copia[0] || '',
        saida1: copia[1] || '',
        entrada2: copia[2] || '',
        saida2: copia[3] || '',
        esperado: esperado.toFixed(2),
        horaExtra,
        horaFaltando,
        isWeekend,
        autoAdded
      });
    });

    setRegistros(registrosFinal);
  } catch (err) {
    console.error('Erro ao processar arquivo:', err);
    alert('Falha ao processar o arquivo!');
  } finally {
    setProcessando(false);
  }
};







  const anos = Array.from(new Set(registros.map(r => r.data.slice(0, 4)))).sort();
  const mesesDoAno = anoSelecionado
    ? Array.from(new Set(
        registros.filter(r => r.data.slice(0, 4) === anoSelecionado).map(r => r.data.slice(5, 7))
      )).sort()
    : [];

  const colaboradoresDoMes = mesSelecionado
    ? Array.from(new Set(
        registros.filter(r => r.data.startsWith(`${anoSelecionado}-${mesSelecionado}`)).map(r => r.nome)
      )).filter(Boolean)
    : [];

  const gerarDiasMes = (colab: string) =>
    registros.filter(r => r.nome === colab && r.data.startsWith(`${anoSelecionado}-${mesSelecionado}`));

  const resumoColaborador = (colab: string) => {
    const dias = gerarDiasMesCompleto(colab);
    const pontosIncompletos = dias.filter(d => {
      const batidas = [d.entrada1, d.saida1, d.entrada2, d.saida2].filter(Boolean);
      return batidas.length < 4;
    }).length;
    const totalHoras = dias.reduce((acc, d) => acc + parseFloat(d.horaExtra || '0') + parseFloat(d.esperado || '0') - parseFloat(d.horaFaltando || '0'), 0);
    const totalExtras = dias.reduce((acc, d) => acc + parseFloat(d.horaExtra || '0'), 0);
    const totalFaltando = dias.reduce((acc, d) => acc + parseFloat(d.horaFaltando || '0'), 0);

    return { pontosIncompletos, totalHoras, totalExtras, totalFaltando };
  };

  const exportarExcel = () => {
    if (!colaboradorSelecionado) return alert('Selecione um colaborador!');
    const dados = gerarDiasMesCompleto(colaboradorSelecionado).map(r => ({
      Data: r.data,
      Dia: r.dia,
      Entrada1: r.entrada1,
      Saída1: r.saida1,
      Entrada2: r.entrada2,
      Saída2: r.saida2,
      Esperado: r.esperado,
      'Horas Extras': r.horaExtra,
      'Horas Faltando': r.horaFaltando,
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'REP');
    XLSX.writeFile(wb, `${colaboradorSelecionado}_${anoSelecionado}-${mesSelecionado}.xlsx`);
  };

  const resumo = colaboradorSelecionado ? resumoColaborador(colaboradorSelecionado) : null;

return (
  <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
    {/* Topbar permanece igual */}
    <div className="flex items-center justify-between bg-[#200101] p-2 text-white shadow-md">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 bg-[#5a0d0d] hover:bg-[#7a1a1a] px-3 py-1 rounded-full transition"
      >
        <ArrowLeft size={18}/> Voltar
      </button>
      <h2 className="text-lg font-semibold">Dashboard REP</h2>
      {colaboradorSelecionado && (
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-full"
        >
          <FileSpreadsheet size={18}/> Exportar
        </button>
      )}
    </div>

    <div className="flex flex-1">
      <Sidebar
        menuActive={menuActive}
        setMenuActive={setMenuActive}
        activeTab="Pessoal"
        onNavClickAction={() => {}}
      />

      {/* Conteúdo principal */}
      <div className="p-8 w-full max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho da página */}
<div className="text-center border-b pb-4">
  <h1 className="text-2xl font-bold text-gray-800">Análise e Controle de Ponto</h1>
  <p className="text-sm text-gray-500 mt-1">
    Última atualização do arquivo: {ultimaAtualizacao || 'Carregando...'}
  </p>
</div>

        {/* Bloco de upload e processamento */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="p-2 border rounded bg-white shadow-sm text-sm"
            />
<button
  onClick={async () => {
    if (!arquivo) {
      alert('Selecione um arquivo primeiro!');
      return;
    }

    try {
      setProcessando(true);
      const url = await uploadArquivo(arquivo);
      await registrarArquivoNoBanco(url);
      setUrlArquivo(url);
      await processarArquivo(url);
      alert('Arquivo enviado e processado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar o arquivo!');
    } finally {
      setProcessando(false);
    }
  }}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
>
  {arquivo ? "Atualizar arquivo" : "Inserir arquivo"}
</button>

          </div>

          {processando && (
            <p className="text-blue-600 font-semibold whitespace-nowrap">
              Processando arquivo...
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            onChange={e => setAnoSelecionado(e.target.value)}
            value={anoSelecionado}
            className="p-2 border rounded bg-white shadow-sm"
          >
            <option value="">Ano</option>
            {anos.map(a => <option key={a}>{a}</option>)}
          </select>

          {anoSelecionado && (
            <select
              onChange={e => setMesSelecionado(e.target.value)}
              value={mesSelecionado}
              className="p-2 border rounded bg-white shadow-sm"
            >
              <option value="">Mês</option>
              {mesesDoAno.map(m => <option key={m}>{m}</option>)}
            </select>
          )}
        </div>

        {/* Lista de colaboradores */}
        {mesSelecionado && colaboradoresDoMes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {colaboradoresDoMes.map(c => (
              <button
                key={c}
                onClick={() => setColaboradorSelecionado(c)}
                className={`
                  px-3 py-1 border text-sm transition rounded-md
                  ${colaboradorSelecionado === c
                    ? 'bg-red-800 text-white border-red-800 shadow-sm'
                    : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-red-100 hover:text-red-900'}
                `}
              >
                {c}
              </button>
            ))}
          </div>
        )}

<div ref={componentRef}>
  {/* Folha de ponto individual */}
  {colaboradorSelecionado && (
    <div ref={componentRef} className="p-6 border rounded-lg shadow-lg bg-white print:bg-white max-w-[300mm] mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">12 TEC Engenharia</h1>
          <h2 className="text-lg font-semibold">
            Folha de Ponto | {mesSelecionado}/{anoSelecionado}
          </h2>
        </div>
        <img src="/12tec.png" alt="Logo" className="h-19" />
      </div>

      <p className="font-medium mb-4">Colaborador: {colaboradorSelecionado}</p>

      {/* Tabela */}
      <table className="w-full border-collapse text-sm mb-4">
        <thead className="bg-gray-200">
          <tr>
            {["Data", "Dia", "Entrada 1", "Saída 1", "Entrada 2", "Saída 2", "Esperado", "Hora Extra", "Faltando"].map((th) => (
              <th key={th} className="p-2 border">{th}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gerarDiasMesCompleto(colaboradorSelecionado).map((r, i) => {
            const batidas = [r.entrada1, r.saida1, r.entrada2, r.saida2].filter(Boolean);
            const incompleto = batidas.length < 4;
            const isWeekend = r.isWeekend;
            return (
              <tr key={i} className={`${incompleto ? 'bg-red-100' : i % 2 ? 'bg-gray-50' : ''} ${isWeekend ? 'bg-yellow-50' : ''}`}>
                <td className="p-2 border">{r.data}</td>
                <td className="p-2 border capitalize">{r.dia}</td>
                {(['entrada1','saida1','entrada2','saida2'] as const).map((col, key) => (
                  <td key={key} className={`p-2 border ${r.autoAdded?.[col] ? 'text-red-600 font-semibold' : ''}`}>
                    {r[col] || ''}
                  </td>
                ))}
                <td className="p-2 border">{r.esperado}</td>
                <td className="p-2 border text-green-700">{r.horaExtra}</td>
                <td className="p-2 border text-red-600">{r.horaFaltando}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Resumo e assinatura */}
      <div className="flex justify-between items-start mt-4">
        {resumo && (
          <div className="bg-gray-100 p-4 w-2/3 text-sm rounded shadow-sm">
            <p><strong>Dias incompletos:</strong> {resumo.pontosIncompletos}</p>
            <p><strong>Total horas:</strong> {resumo.totalHoras.toFixed(2)}</p>
            <p><strong>Horas extras:</strong> {resumo.totalExtras.toFixed(2)}</p>
            <p><strong>Horas faltando:</strong> {resumo.totalFaltando.toFixed(2)}</p>
          </div>
        )}
        <div className="flex flex-col mt-10 ml-5">
          <span>__________________________________________________</span>
          <small>Assinatura do colaborador</small>
        </div>
      </div>

      {/* Botão de imprimir PDF */}
      
        {colaboradorSelecionado && componentRef.current && (
          <div className="mt-6 text-right">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
            >
              Imprimir PDF
            </button>
          </div>
        )}
      </div>
    
  )}
</div>

      </div>
    </div>
  </div>
);

}

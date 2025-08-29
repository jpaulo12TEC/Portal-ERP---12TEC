'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search } from "lucide-react";
import { supabase } from '@/lib/superbase';
import { useUser } from '@/components/UserContext';
import Select from 'react-select';

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
}

export default function CriacaoDeCertificados() {
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

  // Buscar dados do Supabase
  useEffect(() => {
    async function fetchData() {
      const { data: func, error } = await supabase.from('funcionarios').select('*');
      if (error) console.error(error);
      setFuncionarios(func as Funcionario[]);

      const { data: cert } = await supabase.from('certificacoes').select('*');
      setCertificados(cert as Certificado[]);
    }
    fetchData();
  }, []);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  // Função para calcular próxima data considerando carga horária e pulando finais de semana
  function calcularProximaData(dataAtual: Date, cargaHoraria: number): Date {
    const proximaData = new Date(dataAtual);
    proximaData.setDate(proximaData.getDate() + cargaHoraria);

    if (proximaData.getDay() === 6) proximaData.setDate(proximaData.getDate() + 2); // sábado
    if (proximaData.getDay() === 0) proximaData.setDate(proximaData.getDate() + 1); // domingo

    return proximaData;
  }

  // Função para gerar todos os certificados
  async function gerarTodosCertificados() {
    if (!dataInicial) return alert("Selecione a data inicial");

    const funcionariosSelecionadosIds = Object.values(funcSelecionados).flat();
    if (!funcionariosSelecionadosIds.length) return alert("Selecione ao menos um funcionário para cada certificado");

    let dataAtual = new Date(dataInicial);

    for (const cert of certSelecionados) {
      const funcionariosDoCert = funcSelecionados[cert.id] || [];

      for (const funcId of funcionariosDoCert) {
        const funcionario = funcionarios.find(f => f.id === funcId);
        if (!funcionario) continue;

        const payload = {
          funcionario,
          certificado: cert,
          data_inicio: dataAtual.toISOString().slice(0, 10)
        };

        const res = await fetch("/api/gerar-certificados", {
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
        const a = document.createElement("a");
        a.href = url;
        a.download = `${funcionario.nome_completo}-${cert.nome}.pptx`;
        a.click();
        URL.revokeObjectURL(url);
      }

      dataAtual = calcularProximaData(dataAtual, cert.carga_horaria);
    }

    alert("Todos os certificados foram gerados!");
  }

  return (
    <div className="flex flex-col h-screen">
      {/* TopBar */}
      <div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"} `}>
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm">
            <span className="text-sm font-medium">INTRANET 12 TEC</span>
          </button>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"/>
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

        <div 
          ref={containerRef} 
          className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`} 
          style={{ backgroundImage: 'url("/12TEC.png")', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', transition: 'background 0.5s ease-in-out'}}
        >
          {/* Data Inicial */}
          <div className="mb-4">
            <label className="block mb-1 text-white font-semibold">Data inicial:</label>
            <input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} className="border p-2 rounded"/>
          </div>

          {/* Seleção múltipla de certificados */}
          <div className="mb-6">
            <label className="block mb-1 text-white font-semibold">Selecione os Certificados:</label>
            <Select
              isMulti
              options={certificados.map(c => ({ value: c.id, label: c.nome }))}
              onChange={selected => {
                const certs = selected.map(s => certificados.find(c => c.id === s.value)!);
                setCertSelecionados(certs);
              }}
            />
          </div>

          {/* Cards de certificados */}
          {certSelecionados.map(cert => (
            <div key={cert.id} className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h4 className="text-lg font-semibold mb-3">{cert.nome}</h4>
              <div className="flex gap-4">
                <img src={cert.url_imagem_frente} alt="Frente" className="w-1/2 border rounded"/>
                <img src={cert.url_imagem_costa} alt="Costa" className="w-1/2 border rounded"/>
              </div>

              {/* Seleção dos funcionários */}
              <div className="mt-4">
                <h5 className="font-medium mb-2">Funcionários</h5>
                <Select
                  isMulti
                  options={funcionarios.map(f => ({ value: f.id, label: f.nome_completo }))}
                  onChange={selected =>
                    setFuncSelecionados(prev => ({
                      ...prev,
                      [cert.id]: selected.map(s => s.value)
                    }))
                  }
                />
                <p className="mt-2 text-sm text-gray-600">
                  {funcSelecionados[cert.id]?.length || 0} funcionários selecionados
                </p>
              </div>
            </div>
          ))}

          {/* Botão único para gerar todos os certificados */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={gerarTodosCertificados}
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Gerar Todos os Certificados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/UserContext';
import { supabase } from '@/lib/superbase';
import { ArrowLeft, PlusCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Funcionario = { id: string; nome_completo: string };

export default function ApontamentosPage() {
  const { nome } = useUser();
  const router = useRouter();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcSelecionado, setFuncSelecionado] = useState<string>('');
  const [tipoApontamento, setTipoApontamento] = useState<string>('Férias');
  const [loading, setLoading] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [diasSuspensao, setDiasSuspensao] = useState<number | ''>('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [datasFalta, setDatasFalta] = useState('');

  const tiposApontamento = ['Férias','Advertência','Suspensão','Demissão','Falta','Afastamento','Aviso Prévio'];

  useEffect(() => {
    async function carregar() {
      const { data: funcs } = await supabase.from('funcionarios').select('id, nome_completo').eq('situacao', 'Ativo');
      if (funcs) setFuncionarios(funcs);
    }
    carregar();
  }, []);

  const handleAdicionar = async () => {
    if (!funcSelecionado) return alert('Selecione um funcionário');

    let observacoes: string | null = null;
    switch(tipoApontamento){
      case 'Férias': 
        if(!dataInicio || !dataFim) return alert('Informe o período'); 
        observacoes = `Férias de ${dataInicio} a ${dataFim}`; 
        break;
      case 'Suspensão': 
        if(!diasSuspensao) return alert('Informe os dias'); 
        observacoes = `Suspensão por ${diasSuspensao} dias`; 
        break;
      case 'Aviso Prévio': 
        if(!dataEncerramento) return alert('Informe a data'); 
        observacoes = `Aviso prévio até ${dataEncerramento}`; 
        break;
      case 'Falta': 
        if(!datasFalta) return alert('Informe datas'); 
        observacoes = `Falta(s) na(s) data(s): ${datasFalta}`; 
        break;
      default: observacoes = null;
    }

    setLoading(true);

    const funcionario = funcionarios.find(f => f.id === funcSelecionado);
    if (funcionario) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const nomeDoc = `${tipoApontamento} - ${funcionario.nome_completo} - ${today}`;

      const { error: docError } = await supabase.from('documentoscolaboradores').insert([{
        funcionario_id: funcSelecionado,
        nome_colaborador: funcionario.nome_completo,
        tipo_documento: "RH",
        nome_documento: nomeDoc,
        vencimento: null,
        comentario: observacoes,
        postado_por: nome,
        created_at: new Date().toISOString(),
        valido: true,
        Visualizar_menu: true,
        nome_arquivo: null,
        ultima_atualizacao: new Date().toISOString()
      }]);

      if (docError) console.error('Erro ao criar documento:', docError);
      else alert('Documento criado com sucesso!');
    }

    // Resetar campos
    setTipoApontamento('Férias'); 
    setFuncSelecionado(''); 
    setDataInicio(''); 
    setDataFim(''); 
    setDiasSuspensao(''); 
    setDataEncerramento(''); 
    setDatasFalta('');
    setLoading(false);
  };

  return (
    <div className={`flex h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      <Sidebar menuActive={menuActive} setMenuActive={setMenuActive} activeTab="" onNavClickAction={()=>{}} />
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between bg-[#200101] p-2 text-white shadow-md">
          <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full text-sm">
            <ArrowLeft size={18}/> Voltar
          </button>
          <div className="relative w-full max-w-xs">
            <input type="text" placeholder="Buscar..." className="pl-9 pr-3 py-1 rounded-full w-full text-black"/>
            <Search className="absolute left-2 top-1.5 text-gray-500" size={16}/>
          </div>
          <img src="/Logobranca.png" className="h-10 w-auto"/>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto">
          <h1 className="text-2xl font-semibold text-[#5a0d0d] mb-6">Apontamentos de RH</h1>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="font-semibold text-lg mb-4">Adicionar Documento</h2>
            <div className="flex flex-col gap-4">
              <select value={funcSelecionado} onChange={(e)=>setFuncSelecionado(e.target.value)} className="border px-3 py-2 rounded">
                <option value="">Selecione um funcionário</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome_completo}</option>)}
              </select>

              <select value={tipoApontamento} onChange={(e)=>setTipoApontamento(e.target.value)} className="border px-3 py-2 rounded">
                {tiposApontamento.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>

              {tipoApontamento==='Férias' && <div className="flex gap-2">
                <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className="border px-3 py-2 rounded"/>
                <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} className="border px-3 py-2 rounded"/>
              </div>}
              {tipoApontamento==='Suspensão' && <input type="number" value={diasSuspensao} onChange={e=>setDiasSuspensao(Number(e.target.value))} className="border px-3 py-2 rounded" placeholder="Número de dias"/>}
              {tipoApontamento==='Aviso Prévio' && <input type="date" value={dataEncerramento} onChange={e=>setDataEncerramento(e.target.value)} className="border px-3 py-2 rounded"/>}
              {tipoApontamento==='Falta' && <input type="text" value={datasFalta} onChange={e=>setDatasFalta(e.target.value)} className="border px-3 py-2 rounded" placeholder="Digite as datas separadas por vírgula"/>}

              <button onClick={handleAdicionar} disabled={loading} className="flex items-center gap-2 bg-[#5a0d0d] text-white px-4 py-2 rounded hover:bg-[#7a1a1a]">
                <PlusCircle size={16}/> Criar Documento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

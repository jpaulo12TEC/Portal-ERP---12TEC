'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Search } from "lucide-react";
import { supabase } from '../../lib/superbase';
import { useUser } from '@/components/UserContext';
import { useRef } from 'react';

interface Aniversariante {
  nome: string;
  data_nascimento: string; // formato: 'YYYY-MM-DD'
}

interface Aviso {
  id?: string;
  emoji: string;
  mensagem: string;
  data_evento: string;
  valido: boolean;
  criado_por?:string;
}

export default function Dashboard() {
  const { nome } = useUser();
  const [currentPage, setCurrentPage] = useState('Início'); // Página atual
  const [menuActive, setMenuActive] = useState(false); // Para controlar se o menu está aberto ou não
  const [activeTab, setActiveTab] = useState('Início'); // Estado para o tab ativo
  const [showMurals, setShowMurals] = useState(false); // Controle de visibilidade dos murais
  const router = useRouter();
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [avisoSelecionado, setAvisoSelecionado] = useState<Aviso | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEmojiList, setShowEmojiList] = useState(false);
  const [novoAviso, setNovoAviso] = useState<Aviso>({
    emoji: '',
    mensagem: '',
    data_evento: '',
    valido: true,
  });
  const emojis = [
    "🚨", "⚠️", "📢", "🔔", "🛑", "📝", "💼", "📅", "🔒", "💡", 
    "🔍", "📞", "👥", "📊", "🗣️", "✅", "❌", "❓", "📍", "🔧", 
    "📈", "📉", "🛠️", "⚙️", "🔄", "📎", "🧑‍💻", "🏢"
  ];
  
  const removerAviso = async () => {
    if (!avisoSelecionado) return;
    const { error } = await supabase
      .from('avisos')
      .update({ valido: false })
      .eq('id', avisoSelecionado.id);
  
    if (!error) {
      setModalRemoverAberto(false);
      setAvisoSelecionado(null);
      buscarAvisos();
    } else {
      console.error('Erro ao remover aviso:', error);
    }
  };


  

  useEffect(() => {
    buscarAvisos();
  }, []);

  const buscarAvisos = async () => {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .eq('valido', true)
      .order('data_evento', { ascending: false });

    if (!error && data) setAvisos(data);
  };

  const adicionarAviso = async () => {
    // Validação dos campos obrigatórios
    if (!novoAviso.emoji || !novoAviso.mensagem) {
      alert('Por favor, preencha os campos obrigatórios: emoji e mensagem.');
      return;
    }
  
    // Prepara os dados a serem enviados
    const avisoParaEnviar = {
      emoji: novoAviso.emoji,
      mensagem: novoAviso.mensagem,
      criado_por: nome,
      valido: true,
      data_evento: novoAviso.data_evento || null
    };
  
    // Só adiciona data_evento se estiver preenchido
    if (novoAviso.data_evento) {
      avisoParaEnviar.data_evento = novoAviso.data_evento;
    }
  
    // Envia para o banco
    const { error } = await supabase.from('avisos').insert([avisoParaEnviar]);
  
    if (error) {
      console.error('Erro ao adicionar aviso:', error);
      alert('Erro ao adicionar aviso. Verifique o console para mais detalhes.');
    } else {
      alert('Aviso adicionado com sucesso!');
      setModalAberto(false);
      setNovoAviso({ emoji: '', mensagem: '', data_evento: '', valido: true });
      buscarAvisos();
    }
  };

  useEffect(() => {
    const buscarAniversariantes = async () => {
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('nome, data_nascimento');

      if (error) {
        console.error('Erro ao buscar aniversariantes:', error);
        return;
      }

      const mesAtual = new Date().getMonth() + 1; // Janeiro = 0, por isso +1

      const filtrados = data.filter((item) => {
        const mesNascimento = new Date(item.data_nascimento).getMonth() + 1;
        return mesNascimento === mesAtual;
      });

      setAniversariantes(filtrados);
    };

    buscarAniversariantes();
  }, []);

  const handleNavClick = async (tab: string) => {
    try {
      setActiveTab(tab); // Atualiza o tab ativo
      setCurrentPage(tab); // Atualiza a página atual
      router.push(`/dashboard/${tab}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
    }
  };
  const handleEmojiClick = (emoji: string) => {
    setNovoAviso({ ...novoAviso, emoji });
    setShowEmojiList(false); // Fecha a lista de emojis depois de selecionar
  };
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      setShowMurals(true); // Mostra os murais só se clicar fora dos cards
    }
  };

  return (
    <div className={`flex flex-col h-screen `}>
       {/* Topbar */}
<div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"} `}>
  <div className="flex space-x-4  w-full h-[40px] items-center">
    
    {/* Botão de retorno estilizado */}
    <button
   
      className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
    >
      
      <span className="text-sm font-medium"
      onClick={() => setShowMurals((prev) => !prev)}>INTRANET 12 TEC</span>
    </button>

    <div className="px-3 py-3 h-[50px]">
      <button className="w-full text-left hover:text-gray-300">
        
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

      <div className="flex flex-1">
        <Sidebar 
          onNavClickAction={handleNavClick} 
          className="h-full" 
          menuActive={menuActive} // Passando o estado menuActive
          setMenuActive={setMenuActive} // Passando a função setMenuActive
          activeTab={activeTab} // Passando o estado da tab ativa
        />

 {/* Container que irá exibir a imagem de fundo */}
 <div
 ref={containerRef}
          className={`content flex-1 p-6 min-h-screen  ${showMurals ? 'bg-gray-100' : ''}`}
          style={{
            backgroundImage: 'url("/12TEC.png")',
            
            backgroundRepeat: 'no-repeat',  // Evita que a imagem se repita
            backgroundPosition: 'center',
            transition: 'background 0.5s ease-in-out',
            height: showMurals ? 'auto' : '100vh', // Mudando a altura ao clicar
          }}
          onClick={handleImageClick}
        >
        
        {showMurals && (
<div className={`content flex-1 p-6 min-h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'} bg-gray-100`}>
  <h1 className="text-3xl font-bold text-[#8B0000] mb-8"></h1>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
    
{/* Mural de Aniversariantes */}
<div className="bg-white shadow-lg rounded-2xl p-6 border-l-8 border-[#8B0000] hover:shadow-xl transition">
  <h2 className="text-xl font-semibold text-[#8B0000] mb-4">🎉 Aniversariantes do Mês</h2>
  <ul className="space-y-2 text-gray-800">
    {aniversariantes.length > 0 ? (
      aniversariantes.map((aniver, index) => {
        const data = new Date(aniver.data_nascimento);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        return (
          <li key={index}>
            <strong>{aniver.nome}</strong> - {dataFormatada}
          </li>
        );
      })
    ) : (
      <li>Nenhum aniversariante neste mês.</li>
    )}
  </ul>
</div>

    {/* Mural de Avisos */}
    <div className="bg-white shadow-lg rounded-2xl p-6 border-l-8 border-[#B22222] hover:shadow-xl transition relative">
        <h2 className="text-xl font-semibold text-[#B22222] mb-4 flex justify-between items-center">
          📢 Avisos
          {nome === 'Jonas' && (
            <button
              className="text-sm bg-[#B22222] text-white px-3 py-1 rounded hover:bg-red-700"
              onClick={() => setModalAberto(true)}
            >
              + Adicionar
            </button>
          )}
        </h2>
        <ul className="space-y-2 text-gray-800">
  {avisos.map((aviso, index) => (
    <li key={index} className="flex justify-between items-center bg-gray-100 rounded p-2">
      <div>
        {aviso.emoji} {aviso.mensagem}
        {aviso.data_evento && (
          <> na data de <strong>{new Date(aviso.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></>
        )}
      </div>
  {/* Mostrar os botões de remoção apenas para o usuário autorizado */}
  {nome === 'Jonas' && (
                <div className="flex space-x-2">
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => {
                      setAvisoSelecionado(aviso);
                      setModalRemoverAberto(true);
                    }}
                  >
                    Remover
                  </button>
                </div>
              )}
    </li>
  ))}
</ul>
      </div>

      {modalRemoverAberto && avisoSelecionado && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
      <h2 className="text-lg font-bold text-red-700 mb-4">Remover Aviso</h2>
      <p className="text-gray-800 mb-6">
        Tem certeza que deseja remover este aviso?
        <br />
        <strong>{avisoSelecionado.emoji} {avisoSelecionado.mensagem}</strong>
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setModalRemoverAberto(false)}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
        >
          Cancelar
        </button>
        <button
          onClick={removerAviso}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
        >
          Remover
        </button>
      </div>
    </div>
  </div>
)}


      {modalAberto && (
         <div className="fixed inset-0 backdrop-blur-sm bg-opacity-30 flex items-center justify-center z-50">
         <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
           <h3 className="text-lg font-semibold mb-4">Novo Aviso</h3>
           <div className="space-y-3">
             {/* Campo de emoji */}
             <div className="relative">
               <input
                 type="text"
                 placeholder="Emoji (ex: 🚨)"
                 className="w-full border px-3 py-2 rounded"
                 value={novoAviso.emoji}
                 onClick={() => setShowEmojiList(!showEmojiList)} // Alterna a visibilidade da lista
                 onChange={(e) => setNovoAviso({ ...novoAviso, emoji: e.target.value })}
               />
               {showEmojiList && (
                 <div className="absolute bg-white border rounded mt-2 w-full max-h-40 overflow-y-auto z-10">
                   {emojis.map((emoji, index) => (
                     <div
                       key={index}
                       className="cursor-pointer p-2 hover:bg-gray-200"
                       onClick={() => handleEmojiClick(emoji)}
                     >
                       {emoji}
                     </div>
                   ))}
                 </div>
               )}
             </div>
   
             {/* Outros campos */}
             <input
               type="text"
               placeholder="Mensagem"
               className="w-full border px-3 py-2 rounded"
               value={novoAviso.mensagem}
               onChange={(e) => setNovoAviso({ ...novoAviso, mensagem: e.target.value })}
             />
             <input
               type="date"
               className="w-full border px-3 py-2 rounded"
               value={novoAviso.data_evento}
               onChange={(e) => setNovoAviso({ ...novoAviso, data_evento: e.target.value })}
             />
             
           </div>
           <div className="flex justify-end mt-4 gap-2">
             <button
               className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
               onClick={() => setModalAberto(false)}
             >
               Cancelar
             </button>
             <button
               className="px-4 py-2 rounded bg-[#B22222] text-white hover:bg-red-700"
               onClick={adicionarAviso}
             >
               Salvar
             </button>
           </div>
         </div>
       </div>
      )}

      

     {/* Mural de Vencimento de ASO's e NR's */}
     <div className="bg-white shadow-lg rounded-2xl p-6 border-l-8 border-[#8B0000] hover:shadow-xl transition col-span-2">
          <h2 className="text-xl font-semibold text-[#8B0000] mb-4">📝 Vencimento de ASO's e NR's</h2>
          <ul className="space-y-2 text-gray-800">
            <li><strong>Lucas Marques</strong> - NR 12 - Vencimento: <strong>16/05/2025</strong></li>
            <li><strong>Tiago dos Santos Silva</strong> - NR 06 - Vencimento: <strong>31/05/2025</strong></li>
            <li><strong>João Paulo Santana</strong> - NR 18 - Vencimento: <strong>03/11/2025</strong></li>
            <li><strong>Maria Oliveira</strong> - ASO periodico: <strong>14/06/2025</strong></li>
          </ul>
        </div>

    {/* Mural de Logística de Veículos */}
<div className="bg-white shadow-lg rounded-2xl p-6 border-l-8 border-[#A52A2A] hover:shadow-xl transition col-span-2">
  <h2 className="text-xl font-semibold text-[#A52A2A] mb-4">🚗 Logística de Veículos (Semanal)</h2>

  <div className="overflow-x-auto">
    <table className="min-w-full table-auto border-collapse text-sm text-gray-800">
      <thead>
        <tr className="bg-[#FBE9E7] text-[#A52A2A]">
          <th className="border px-4 py-2 text-left">Veículo</th>
          <th className="border px-4 py-2 text-center">Segunda</th>
          <th className="border px-4 py-2 text-center">Terça</th>
          <th className="border px-4 py-2 text-center">Quarta</th>
          <th className="border px-4 py-2 text-center">Quinta</th>
          <th className="border px-4 py-2 text-center">Sexta</th>
          <th className="border px-4 py-2 text-center">Sábado</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {/* STRADA */}
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2 font-semibold">STRADA</td>
          <td className="border px-4 py-2 text-sm">IDA para a MOSAIC 07h<br/>Retorna 11h</td>
          <td className="border px-4 py-2 text-sm">Disponível até 14h<br/>IDA GE após</td>
          <td className="border px-4 py-2 text-sm">Manutenção</td>
          <td className="border px-4 py-2 text-sm">IDA para buscar material</td>
          <td className="border px-4 py-2 text-sm">Retorna da GE 10h<br/>Disponível à tarde</td>
          <td className="border px-4 py-2 text-sm">Livre</td>
        </tr>

        {/* L200 */}
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2 font-semibold">L200</td>
          <td className="border px-4 py-2 text-sm">Alocado para GE</td>
          <td className="border px-4 py-2 text-sm">IDA para a MOSAIC</td>
          <td className="border px-4 py-2 text-sm">Disponível</td>
          <td className="border px-4 py-2 text-sm">Retorna da MOSAIC 12h</td>
          <td className="border px-4 py-2 text-sm">Revisão</td>
          <td className="border px-4 py-2 text-sm">Disponível</td>
        </tr>

        {/* PEUGEOT */}
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2 font-semibold">PEUGEOT</td>
          <td className="border px-4 py-2 text-sm">IDA para buscar equipamento</td>
          <td className="border px-4 py-2 text-sm">Livre</td>
          <td className="border px-4 py-2 text-sm">IDA para a GE</td>
          <td className="border px-4 py-2 text-sm">Retorno da GE 15h</td>
          <td className="border px-4 py-2 text-sm">Disponível</td>
          <td className="border px-4 py-2 text-sm">Livre</td>
        </tr>

        {/* MOTO */}
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2 font-semibold">MOTO</td>
          <td className="border px-4 py-2 text-sm">Entrega interna</td>
          <td className="border px-4 py-2 text-sm">Alocada para coleta rápida</td>
          <td className="border px-4 py-2 text-sm">Disponível</td>
          <td className="border px-4 py-2 text-sm">IDA para banco</td>
          <td className="border px-4 py-2 text-sm">Entrega GE</td>
          <td className="border px-4 py-2 text-sm">Livre</td>
        </tr>

        {/* HB20 */}
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2 font-semibold">HB20</td>
          <td className="border px-4 py-2 text-sm">Alocado diretoria</td>
          <td className="border px-4 py-2 text-sm">Disponível</td>
          <td className="border px-4 py-2 text-sm">IDA e volta MOSAIC</td>
          <td className="border px-4 py-2 text-sm">Livre</td>
          <td className="border px-4 py-2 text-sm">Entrega documentos</td>
          <td className="border px-4 py-2 text-sm">Não disponível</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

{/* Mural de Precisão de Entrega */}
<div className="bg-white shadow-lg rounded-2xl p-6 border-l-8 border-[#800000] hover:shadow-xl col-span-2 transition">
  <h2 className="text-xl font-semibold text-[#800000] mb-4">📦 Previsão de Entrega</h2>

  <div className="overflow-x-auto">
    <table className="min-w-full table-auto border-collapse text-sm text-gray-800">
      <thead>
        <tr className="bg-[#FBE9E7] text-[#800000]">
          <th className="border px-4 py-2">Código de Rastreio</th>
          <th className="border px-4 py-2">Material</th>
          <th className="border px-4 py-2">Destino</th>
          <th className="border px-4 py-2">Rastreamento/Contato</th>
          <th className="border px-4 py-2">NF</th>
          <th className="border px-4 py-2">Transportadora</th>
          <th className="border px-4 py-2">Fornecedor</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2">XPTO001</td>
          <td className="border px-4 py-2">Tubo PVC 150mm</td>
          <td className="border px-4 py-2">GE</td>
          <td className="border px-4 py-2 text-blue-600 underline">
            <a href="https://www.correios.com.br" target="_blank" rel="noopener noreferrer">
              Ver no site
            </a>
          </td>
          <td className="border px-4 py-2">NF 124578</td>
          <td className="border px-4 py-2">Correios</td>
          <td className="border px-4 py-2">Tubos Brasil LTDA</td>
        </tr>

        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2">XPTO002</td>
          <td className="border px-4 py-2">Filtro de ar</td>
          <td className="border px-4 py-2">STANZA</td>
          <td className="border px-4 py-2">Contato: João (📞 71 99999-1234)</td>
          <td className="border px-4 py-2">NF 125412</td>
          <td className="border px-4 py-2">Transp. Rápido</td>
          <td className="border px-4 py-2">Auto Peças Nordeste</td>
        </tr>

        <tr className="hover:bg-[#FFF5F5]">
          <td className="border px-4 py-2">XPTO003</td>
          <td className="border px-4 py-2">Painel elétrico</td>
          <td className="border px-4 py-2">MOSAIC</td>
          <td className="border px-4 py-2 text-blue-600 underline">
            <a href="https://transportadora.com.br/rastreio/XPTO003" target="_blank" rel="noopener noreferrer">
              Ver rastreamento
            </a>
          </td>
          <td className="border px-4 py-2">NF 127890</td>
          <td className="border px-4 py-2">Transportadora Silva</td>
          <td className="border px-4 py-2">Elétrica Mais</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

  </div>
</div>
)}
</div>



      </div>
    </div>
  );
}

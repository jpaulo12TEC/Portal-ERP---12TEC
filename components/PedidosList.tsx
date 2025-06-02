'use client'
import { useEffect, useState, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { X } from 'lucide-react'
import { useUser } from '@/components/UserContext';
import { supabase } from '../lib/superbase';
import { useRouter } from 'next/navigation';

type Orcamento = {
  nome_arquivo: string;
  enviado_por: string;
  signedUrl?: string; // Adiciona a propriedade signedUrl como opcional
};

type Material = {
  nome_material: string
  quantidade: string 
}

type Observacao = {
  descricao: string
  autor: string
  data: string
  dataOriginal: string
  
}

type Pedido = {
  id: number
  nome_pedido: string
  solicitado_por: string
  status: string
  data: string
  orcamento_urls: Orcamento[]
  materiais: Material[]
  observacao: Observacao []
  provisionado: string
}


type Parcela = {
  valor: string;
  empresa: string;
  venceEm: string;
};

export default function PedidosList() {
  
  const { nome } = useUser(); // Esse nome será usado como autor da observação
  const { nivelAcesso } = useUser()
  
  const [selectedOrcamentoIndex, setSelectedOrcamentoIndex] = useState(0);
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [forceRender, setForceRender] = useState(0); // Estado adicional para forçar re-renderização
  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [currentPage, setCurrentPage] = useState(1);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarModalProvisionamento, setMostrarModalProvisionamento] = useState(false);
  const [parcelas, setParcelas] = useState<Parcela[]>([
    { valor: '', empresa: '', venceEm: '' }
  ]);
  const [orcamentos, setOrcamentos] = useState<File[]>([]);
  const [pedidon, setPedidoN] = useState<string>(""); // Estado para armazenar o pedido ID
  const router = useRouter(); // Hook para navegação do Next.js



  const ITEMS_PER_PAGE = 12;
  // 1) filtra
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p =>
      p.nome_pedido.toLowerCase().includes(filtro.toLowerCase()) &&
      (statusFiltro === "Todos" || p.status === statusFiltro) &&
      (!dataInicio || new Date(p.data) >= new Date(dataInicio)) &&
      (!dataFim    || new Date(p.data) <= new Date(dataFim))
    );
  }, [pedidos, filtro, statusFiltro, dataInicio, dataFim]);

  // 2) recalcula total de páginas
  const totalPages = Math.max(Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE), 1);

  // 3) ajusta a lista exibida
  const displayedPedidos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPedidos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPedidos, currentPage]);

  // 4) toda vez que o filtro mudar, volta pra página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, statusFiltro, dataInicio, dataFim]);





  const handleCompraRealizada = () => {
    handleCompraRealizadaStatus();
    // Salvando o objeto completo de pedidoSelecionado no localStorage
    if (pedidoSelecionado) {
      localStorage.setItem('pedidoSelecionado', JSON.stringify(pedidoSelecionado)); // Armazenando o objeto completo
    }
    router.push('/dashboard/setordecompras/novacompra'); // Navegando para a próxima página
  };

  const handleCompraRealizadaStatus = async () => {
    if (!pedidoSelecionado) return;
  
    const confirmacao = window.confirm("Tem certeza que deseja marcar este pedido como 'Compra Efetuada'?");
    if (!confirmacao) return;
  
    setLoading(true);
  
    // Atualizando o status no banco de dados
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: 'Compra Efetuada' }) // Atualiza o status para "Compra Efetuada"
      .eq('id', pedidoSelecionado.id);
  
    // Adicionando a nova observação
    await handleNovaObservacao("Compra Efetuada!");
  
    setLoading(false);
  
    if (!error) {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoSelecionado.id ? { ...p, status: 'Compra Efetuada' } : p
        )
      );
      // Redireciona para a próxima página, conforme o fluxo desejado
      router.push('/dashboard/setordecompras/novacompra');
    } else {
      alert('Erro ao atualizar o status do pedido.');
      console.error(error);
    }
  };
  





  function parseObservacoes(obsStr: string): Observacao[] {
    if (!obsStr) return [];
    return obsStr
      .split(";")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const [descricao, autor, dataOriginal] = item.split("|||").map(s => s.trim());
        return { descricao, autor, dataOriginal, data: dataOriginal }; // você pode guardar tanto o ISO (dataOriginal) quanto uma versão formatada em data
      });
  }


  const gerarProtocolo = () => {
    const agora = new Date();
    const YY = String(agora.getFullYear()).slice(-2); // Ano (24)
    const MM = String(agora.getMonth() + 1).padStart(2, "0"); // Mês (03)
    const DD = String(agora.getDate()).padStart(2, "0"); // Dia (19)
    const HH = String(agora.getHours()).padStart(2, "0"); // Hora (15)
    const SS = String(agora.getSeconds()).padStart(2, "0"); // Segundos (30)
    const random = Math.floor(1000 + Math.random() * 9000); // Número aleatório de 4 dígitos
  
    return `${YY}${MM}${DD}${HH}${SS}${random}`; // <- Corrigido aqui com crase
  };
  const [protocolo, setProtocolo] = useState("");
  useEffect(() => {
    setProtocolo(gerarProtocolo());
  }, []);

  const forceUpdate = () => {
    setForceRender((prev) => prev + 1); // Atualiza o valor para forçar a re-renderização
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); // Converte FileList em array
    setOrcamentos((prev) => [...prev, ...files]); // Atualiza o estado com os novos arquivos
  };

  const handleSave = async () => {
    if (orcamentos.length === 0) {
      alert("Nenhum arquivo selecionado.");
      return;
    }
  
    try {
      await salvarComUploadDeOrcamentos(orcamentos);
      await handleNovaObservacao("Novo orçamento enviado!");
      alert("Orçamentos enviados com sucesso!");
  
      setOrcamentos([]);
      forceUpdate();
    } catch (error) {
      alert("Erro ao salvar os orçamentos.");
      console.error(error);
    }
  };

  const uploadOrcamentos = async (nome: string, arquivos: File[]): Promise<string[]> => {
    const nomesSalvos: string[] = [];
  
    for (let i = 0; i < arquivos.length; i++) {
      const file = arquivos[i];
      if (!file) continue;
  
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `orcamento_${timestamp}_${i + 1}.pdf`;
  
      try {
        const { error } = await supabase.storage
          .from("orcamentos")
          .upload(fileName, file);
  
        if (error) {
          console.error(`Erro ao subir o arquivo ${i + 1}:`, error.message);
          alert(`Erro ao subir o arquivo do orçamento ${i + 1}`);
          continue;
        }
  
        nomesSalvos.push(`${fileName}, ${nome}`);
      } catch (err) {
        console.error(`Erro inesperado ao subir o arquivo ${i + 1}:`, err);
        alert(`Erro inesperado ao subir o arquivo ${i + 1}`);
      }
    }
  
    return nomesSalvos;
  };
  
  /**
   * Salva os nomes dos arquivos de orçamento associados a uma solicitação.
   */
  const salvarOrcamentosNaSolicitacao = async (orcamentoNomes: string[]): Promise<void> => {
    try {
      if (!pedidoSelecionado?.id) {
        console.error("ID da solicitação não encontrado");
        alert("Solicitação não encontrada.");
        return;
      }
  
      // Busca os orçamentos existentes
      const { data, error: fetchError } = await supabase
        .from("solicitacoes")
        .select("orcamento_urls")
        .eq("id", pedidoSelecionado.id)
        .single();
  
      if (fetchError) {
        console.error("Erro ao buscar os orçamentos:", fetchError.message);
        throw fetchError;
      }
  
      const orcamentosExistentes = data?.orcamento_urls || "";
      const novosOrcamentos = orcamentoNomes.join("; ");
      const orcamentoFinal = orcamentosExistentes
        ? `${orcamentosExistentes}; ${novosOrcamentos}`
        : novosOrcamentos;
  
      console.log("Orçamentos a serem salvos:", orcamentoFinal);
  
      // Atualiza a solicitação com os novos orçamentos
      const { error: updateError } = await supabase
        .from("solicitacoes")
        .update({ orcamento_urls: orcamentoFinal })
        .eq("id", pedidoSelecionado.id);
  
      if (updateError) {
        console.error("Erro ao atualizar os orçamentos na solicitação:", updateError.message);
        throw updateError;
      }
  
      console.log("Orçamentos atualizados com sucesso.");
    } catch (err) {
      if (err instanceof Error) {
        console.error("Erro ao salvar orçamentos na solicitação:", err.message);
        alert("Erro ao salvar os orçamentos na solicitação.");
      } else {
        console.error("Erro inesperado (tipo desconhecido):", err);
        alert("Erro desconhecido ao salvar os orçamentos.");
      }
    }
  };
  
  /**
   * Executa o processo completo de upload e associação de orçamentos à solicitação.
   */
  const salvarComUploadDeOrcamentos = async (arquivos: File[]): Promise<void> => {
    const nomesArquivos = await uploadOrcamentos(nome, arquivos);
  
    if (!nomesArquivos.length) {
      alert("Nenhum arquivo foi enviado com sucesso.");
      return;
    }
  
    // Exibe os arquivos selecionados para salvar na solicitação
    console.log("Arquivos enviados:", nomesArquivos);
  
    await salvarOrcamentosNaSolicitacao(nomesArquivos);
  };


  const atualizarParcela = (index: number, campo: keyof Parcela, valor: string) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index][campo] = valor;
    setParcelas(novasParcelas);
  };
  const excluirParcela = (index: number) => {
    const novaLista = parcelas.filter((_, i) => i !== index);
    setParcelas(novaLista);
  };

  const salvarProvisionamento = async () => {
    console.log("Parcelas provisionadas:", parcelas);
    setMostrarModalProvisionamento(false);
  
    if (!pedidoSelecionado?.id) {
      console.error("ID da solicitação não encontrado.");
      alert("Não foi possível salvar o provisionamento: ID da solicitação ausente.");
      return;
    }
  
    // Verifica se todos os campos necessários estão preenchidos
    for (let parcela of parcelas) {
      if (!parcela.empresa || !parcela.venceEm || !parcela.valor) {
        alert("Erro: Todos os campos da parcela (empresa, vencimento e valor) devem ser preenchidos.");
        return; // Interrompe a execução se algum campo estiver vazio
      }
    }
  
    try {
      const timestampAtual = new Date().toISOString(); // Para o campo `lancadoem`
      const protocoloGerado = gerarProtocolo();
      const totalValor = parcelas.reduce(
        (total, p) => total + parseFloat(p.valor || "0"),
        0
      );
      const quantidadeParcelas = parcelas.length;
  
      // Insere todas as parcelas na tabela 'provisao_pagamentos'
      const novasLinhas = parcelas.map((parcela, index) => ({
        codigo: protocoloGerado,
        periodicidade: "Avulso",
        origem: "Provisão de pedidos",
        data_compra: null,
        empresa: parcela.empresa || null,
        cnpj: null,
        valor: parseFloat(parcela.valor),
        boleto: null,
        valor_total: totalValor,
        lancadopor: nome, // vindo do useUser()
        venceem: parcela.venceEm || null,
        pagoem: null,
        nparcelas: index + 1, // Aqui: número da parcela (1, 2, 3...)
        qtdparcelas: quantidadeParcelas, // Total de parcelas
        formapagamento: null,
        formaaserpago: null,
        lancadoem: timestampAtual,
        pedidon: pedidoSelecionado.id,
      }));
  
      const { error: insertError } = await supabase
        .from("provisao_pagamentos")
        .insert(novasLinhas);
  
      if (insertError) {
        console.error("Erro ao inserir linhas em provisao_pagamentos:", insertError.message);
        alert("Erro ao salvar o provisionamento.");
        return;
      }
  
      // Atualiza a solicitação
      const { error: updateError } = await supabase
        .from("solicitacoes")
        .update({ provisionado: "sim" })
        .eq("id", pedidoSelecionado.id);
  
      if (updateError) {
        console.error(`Erro ao atualizar solicitação ID ${pedidoSelecionado.id}:`, updateError.message);
      } else {
        console.log("Provisionamento atualizado com sucesso.");
        alert('Provisionamento atualizado com sucesso.');
        setPedidoSelecionado(null); // Fecha o modal
      }
  
    } catch (err) {
      console.error("Erro ao salvar provisionamento:", err);
    }
  };
  

  console.log(pedidoSelecionado); // Verifique o que está vindo aqui

  
  useEffect(() => {
    if (!pedidoSelecionado?.id) return;
  
    const channel = supabase
      .channel(`orcamentos-listener-${pedidoSelecionado.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "solicitacoes",
          filter: `id=eq.${pedidoSelecionado.id}`,
        },
        (payload) => {
          console.log("Realtime - Dados atualizados:", payload);
          const updatedData = payload.new;
  
          try {
            // Tenta extrair e parsear orcamento_urls (caso venha como string)
            const orcamentoUrlsAtualizados =
              typeof updatedData.orcamento_urls === "string"
                ? JSON.parse(updatedData.orcamento_urls)
                : updatedData.orcamento_urls;
  
            // Atualiza diretamente o pedido selecionado com os novos orçamentos
            setPedidoSelecionado((prev) =>
              prev
                ? {
                    ...prev,
                    orcamento_urls: orcamentoUrlsAtualizados,
                  }
                : prev
            );
             // Força a re-renderização após a atualização
             forceUpdate();
          } catch (e) {
            console.error("Erro ao parsear orcamento_urls:", e);
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoSelecionado?.id]);




  useEffect(() => {
    if (!pedidoSelecionado?.id) return;
  
    const channel = supabase
      .channel(`observacao-updates-${pedidoSelecionado.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitacoes',
          filter: `id=eq.${pedidoSelecionado.id}`,
        },
        (payload) => {
          const novaString = payload.new.observacao;
          if (novaString) {
            const partes = novaString
  .split(';')
  .map((obs: string) => {
    const [descricao, autor, data] = obs.split('|||').map(p => p.trim());

    let  dataHora = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'America/Sao_Paulo'
    }).format(new Date(data));
    let dataOriginal = data;

    try {
      const dataFormatada = new Date(data);
      if (!isNaN(dataFormatada.getTime())) {
        dataHora = dataFormatada.toLocaleString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }
    } catch (e) {
      console.error('Erro ao converter data da observação:', data);
    }

    return { descricao, autor, data: dataHora, dataOriginal };
  });
  
            setPedidoSelecionado((prev) =>
              prev ? { ...prev, observacao: partes } : prev
            );
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoSelecionado?.id]);
  
  

  useEffect(() => {
    const fetchPedidos = async () => {
      const params = new URLSearchParams()
      if (statusFiltro !== 'Todos') params.append('status', statusFiltro)
      if (filtro) params.append('q', filtro)
      if (dataInicio) params.append('data_inicio', dataInicio)
      if (dataFim) params.append('data_fim', dataFim)

      const res = await fetch(`/api/pedidos?${params.toString()}`)
      const data = await res.json()
      setPedidos(data)
    }

    fetchPedidos()
  }, [filtro, statusFiltro, dataInicio, dataFim])




  const handleAprovacao = async (novoStatus: 'Aprovado' | 'Rejeitado') => {
    if (!pedidoSelecionado) return;
  
    const confirmacao = window.confirm(`Tem certeza que deseja marcar este pedido como ${novoStatus}?`);
    if (!confirmacao) return;
  
    setLoading(true);
  
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: novoStatus })
      .eq('id', pedidoSelecionado.id);

      await handleNovaObservacao("Compra aprovada!");
      
    setLoading(false);
  
    if (!error) {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoSelecionado.id ? { ...p, status: novoStatus } : p
        )
      );
      if (novoStatus === 'Aprovado') {
        const desejaProvisionar = window.confirm('Gostaria de provisionar esta compra?');
        if (desejaProvisionar) {
          setMostrarModalProvisionamento(true);
        }
      }
    } else {
      alert('Erro ao atualizar o status do pedido.');
      console.error(error);
    }
  };


  const handleNovaObservacao = async (mensagem?: string) => {
    const descricao = mensagem || novaObservacao.trim();
    if (!descricao) return;
  
    const novaData = new Date().toISOString();
    const novaObsString = `${descricao}|||${nome.trim()}|||${novaData}`;
  
    const observacaoAtual = pedidoSelecionado?.observacao || [];
  
    const todasObservacoes = [
      novaObsString,
      ...observacaoAtual.map(obs => {
        const dataOriginal = obs.dataOriginal || obs.data;
        return `${obs.descricao.trim()}|||${obs.autor.trim()}|||${dataOriginal}`;
      })
    ].join(';');
  
    const { error } = await supabase
      .from('solicitacoes')
      .update({ observacao: todasObservacoes })
      .eq('id', pedidoSelecionado?.id);
  
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
  
      setPedidoSelecionado(prev =>
        prev ? { ...prev, observacao: novaListaObservacoes } : prev
      );
  
      if (!mensagem) setNovaObservacao('');
    } else {
      alert('Erro ao adicionar observação');
      console.error(error);
    }
  };







  

  return (
    <>
     <div className="flex flex-col h-screen">
 {/* Sticky Filters */}
 <div className="sticky top-4 z-20 bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Pesquisar pedidos</h3>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            placeholder="🔍 Pesquisar por nome..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-indigo-200"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
          <select
            className="w-full md:w-1/4 border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-indigo-200"
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
          >
            <option value="Todos">Todos os status</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Pendente">Pendente</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>
          <input
            type="date"
            className="w-full md:w-1/6 border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-indigo-200"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
          <input
            type="date"
            className="w-full md:w-1/6 border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-indigo-200"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedPedidos.map(pedido => {
          let corBg = 'bg-gray-100'
          let corText = 'text-gray-600'
          let corBorda = 'border-gray-300'
          

          if (pedido.status === 'Aprovado') {
            corBg = 'bg-green-300';
            corText = 'text-green-700';
            corBorda = 'border-green-400';
        } else if (pedido.status === 'Pendente') {
            corBg = 'bg-yellow-300';
            corText = 'text-yellow-700';
            corBorda = 'border-yellow-400';
        } else if (pedido.status === 'Rejeitado') {
            corBg = 'bg-red-300';
            corText = 'text-red-700';
            corBorda = 'border-red-400';
        } else if (pedido.status === 'Compra Efetuada') {
            corBg = 'bg-blue-200';
            corText = 'text-blue-800';
            corBorda = 'border-blue-300';
        }

          const observacoes: Observacao[] = Array.isArray(pedido.observacao)
          ? pedido.observacao
          : parseObservacoes(pedido.observacao as unknown as string);
      
        // 2) agora extraia a última observação com segurança:
        const ultimaObservacao = (() => {
          if (observacoes.length === 0) return null;
          const u = observacoes[0];
          return {
            texto:  (u.descricao   ?? "").trim(),
            nome:   (u.autor       ?? "").trim(),
            data:   u.dataOriginal ?? u.data ?? "",
          };
        })();

          return (
            <div
  key={pedido.id}
  onClick={() => setPedidoSelecionado(pedido)}
  className={`
    group
    rounded-xl
    ${corBorda} border-l-4
    p-5
    shadow-sm hover:shadow-md
    transition-shadow duration-300
    cursor-pointer
    flex flex-col
  `}
  style={{
    backgroundImage: pedido.status === 'Rejeitado'
      ? "linear-gradient(135deg, rgba(241, 184, 184, 0.3), rgba(248, 113, 113, 0.2))"
      : pedido.status === 'Aprovado'
      ? "linear-gradient(135deg, rgba(188, 247, 209, 0.3), rgba(74, 222, 128, 0.2))"
      : pedido.status === 'Pendente'
      ? "linear-gradient(135deg, rgba(243, 224, 130, 0.16), rgba(250, 204, 21, 0.2))"
      : pedido.status === 'Compra Efetuada'
      ? "linear-gradient(135deg, rgba(173, 216, 230, 0.3), rgba(100, 149, 237, 0.2))"
      : "none"
  }}
>
  {/* 1. HEADER */}
  <div className="flex items-start justify-between mb-3">
    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
      📝 <span>Pedido #{pedido.id}</span>
    </h2>
    <p className="text-base font-medium text-indigo-600 truncate max-w-xs">
      {pedido.nome_pedido}
    </p>
  </div>

  {/* 2. BADGES */}
  <div className="flex items-center justify-end gap-2 mb-4">
    <span
      className={`
        inline-block px-3 py-1 text-xs font-medium rounded-full
        ${corBg} ${corText}
      `}
    >
      {pedido.status}
    </span>
    {pedido.provisionado === 'sim' && (
      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        Provisionado
      </span>
    )}
  </div>

  {/* 3. METADADOS */}
  <div className="flex items-center text-sm text-gray-500 mb-2">
    <svg
      className="w-4 h-4 mr-1 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <span> {new Date(pedido.data).toLocaleDateString('pt-BR')} </span>
  </div>

  {/* 4. ÚLTIMA OBSERVAÇÃO */}
  {ultimaObservacao && (
    <div className="flex items-start text-sm text-gray-600">
      <svg
        className="w-4 h-4 mr-1 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-5-5H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v8a2 2 0 01-2 2h-3l-5 5z" />
      </svg>
      <div>
        <p className="font-medium">{ultimaObservacao.texto}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          ✍️ Por {ultimaObservacao.nome} em{' '}
          {new Date(ultimaObservacao.data).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )}

  {/* 5. BOTÃO DETALHES */}
  <button
    onClick={(e) => {
      e.stopPropagation()
      setPedidoSelecionado(pedido)
    }}
    className="mt-4 self-end inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-300"
  >
    Ver detalhes
    <svg
      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </button>
</div>
          )
        })}





      </div>
      </div>


        {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
      </div>

{/* Modal */}
{pedidoSelecionado && (
     <Dialog
     open={!!pedidoSelecionado}
     onClose={() => setPedidoSelecionado(null)}
     className="fixed inset-0 z-50 overflow-y-auto"
   >
     <div className="flex items-center justify-center min-h-screen px-4">
       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
       <Dialog.Panel className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-auto p-0 overflow-hidden">
         <div className="flex h-[80vh]">
           {/* Painel esquerdo com informações do pedido */}
           <div className="flex-1 p-8 overflow-y-auto">
             <div className="flex justify-between items-center border-b pb-4 mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Pedido #{pedidoSelecionado.id}</h2>
               <button onClick={() => setPedidoSelecionado(null)} className="text-gray-500 hover:text-gray-800">
                 <X className="w-6 h-6" />
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div>
                 <p className="text-sm text-gray-500">Solicitado por:</p>
                 <p className="text-lg font-semibold text-gray-900">{pedidoSelecionado.solicitado_por}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Apelido do pedido:</p>
                 <p className="text-lg font-semibold text-gray-900">{pedidoSelecionado.nome_pedido}</p>
               </div>
             </div>

             <div className="mb-8">
               <p className="text-sm text-gray-500 mb-2">Materiais Solicitados:</p>
               <ul className="list-disc list-inside text-gray-800">
                 {pedidoSelecionado.materiais.length > 0 ? (
                   pedidoSelecionado.materiais.map((mat, idx) => (
                     <li key={idx} className="text-sm">{mat.nome_material} - {mat.quantidade}</li>
                   ))
                 ) : (
                   <li className="text-sm text-gray-500">Nenhum material listado</li>
                 )}
               </ul>
             </div>

             <div className="mb-8">
               <p className="text-sm text-gray-500 mb-2">Orçamentos:</p>
               <ul className="space-y-2">
                 {Array.isArray(pedidoSelecionado.orcamento_urls) && pedidoSelecionado.orcamento_urls.length > 0 ? (
                   pedidoSelecionado.orcamento_urls.map((orc, idx) => (
                     <li
                       key={idx}
                       className={`flex items-center justify-between px-4 py-2 rounded-lg border ${idx === selectedOrcamentoIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                     >
                       <a href={orc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                         {orc.nome_arquivo}
                       </a>
                       <span className="text-xs text-gray-500">Enviado por: {orc.enviado_por}</span>
                       <button
                         onClick={() => window.open(orc.signedUrl, '_blank')}
                         className="ml-2 text-blue-500 text-xs hover:underline"
                       >
                         Visualizar
                       </button>
                     </li>
                   ))
                 ) : (
                   <li className="text-sm text-gray-500">Nenhum orçamento listado</li>
                 )}
               </ul>
             </div>

             {pedidoSelecionado.orcamento_urls?.length > 0 && (
               <div className="mt-6">
                 <p className="text-sm text-gray-500 mb-2">Visualização do Orçamento:</p>
                 <div className="flex justify-center">
                   {pedidoSelecionado.orcamento_urls[selectedOrcamentoIndex].nome_arquivo.endsWith('.pdf') ? (
                     <iframe
                       src={pedidoSelecionado.orcamento_urls[selectedOrcamentoIndex].signedUrl}
                       className="w-full h-64 rounded-md border border-gray-300"
                       title="Orçamento Preview"
                     ></iframe>
                   ) : (
                     <img
                       src={pedidoSelecionado.orcamento_urls[selectedOrcamentoIndex].signedUrl}
                       alt="Orçamento"
                       className="w-full max-w-md rounded-md border border-gray-300"
                     />
                   )}
                 </div>
               </div>
             )}

             {pedidoSelecionado.orcamento_urls.length > 1 && (
               <div className="flex justify-between mt-6">
                 <button
                   onClick={() => setSelectedOrcamentoIndex(prev => Math.max(prev - 1, 0))}
                   className="text-blue-600 hover:underline text-sm"
                 >
                   Anterior
                 </button>
                 <button
                   onClick={() => setSelectedOrcamentoIndex(prev => Math.min(prev + 1, pedidoSelecionado.orcamento_urls.length - 1))}
                   className="text-blue-600 hover:underline text-sm"
                 >
                   Próximo
                 </button>

               </div>
             )}
                   <div className="mt-6 p-4 border rounded-xl shadow-sm bg-white space-y-6">
  {/* Input e botão alinhados horizontalmente */}
  <div className="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between gap-4">
    {/* Input de arquivos */}
    <label className="flex-1 cursor-pointer">
      <span className="block mb-1 text-sm font-medium text-gray-700">
        Selecionar Arquivos
      </span>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </label>

    {/* Botão de salvar */}
    <button
      onClick={handleSave}
      className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
    >
      Salvar Orçamentos
    </button>
  </div>

  {/* Lista de arquivos selecionados */}
  {orcamentos.length > 0 && (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Arquivos Selecionados:</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
        {orcamentos.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>
    </div>
  )}
</div>

{nivelAcesso === 'Adminmaster' && (
  <div className="flex justify-end mt-6 space-x-4">
    {pedidoSelecionado?.status === 'Aprovado' && (
      <>
        {pedidoSelecionado?.provisionado === 'Não' && (
          <button
            onClick={() => setMostrarModalProvisionamento(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition"
          >
            Provisionar Compra
          </button>
        )}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          onClick={handleCompraRealizada}
        >
          
          Compra Realizada
        </button>
      </>
    )}
    {pedidoSelecionado?.status === 'Pendente' && (
      <>
        <button
          onClick={() => handleAprovacao('Rejeitado')}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Rejeitar
        </button>
        <button
          onClick={() => handleAprovacao('Aprovado')}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
        >
          Aprovar
        </button>
      </>
    )}
  </div>
)}
           </div>

           {/* Painel direito com observações estilo chat */}
           <div className="w-[28%] bg-gray-50 border-l border-gray-200 p-4 flex flex-col">
             <h3 className="text-lg font-semibold text-gray-700 mb-4">Observações</h3>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
               {pedidoSelecionado.observacao && pedidoSelecionado.observacao.length > 0 ? (
                 pedidoSelecionado.observacao.map((obs, index) => (
                   <div key={index} className="flex items-start space-x-3">
                     <div className="flex flex-col items-center">
                       <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                         {obs.autor[0]}
                       </div>
                       <span className="text-xs text-gray-500 mt-1 text-center max-w-[60px] truncate">
                         {obs.autor}
                       </span>
                     </div>
                     <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-full">
                       <p className="text-sm text-gray-800 mb-1">{obs.descricao}</p>
                       <span className="text-xs text-gray-400">{obs.data}</span>
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-gray-500">Nenhuma observação disponível.</p>
               )}
             </div>
               {/* Caixa para nova observação */}
  <div className="flex gap-2 items-center">
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
         </div>
       </Dialog.Panel>
     </div>
   </Dialog>
      )}

{mostrarModalProvisionamento && (
  <Dialog
    open={mostrarModalProvisionamento}
    onClose={() => setMostrarModalProvisionamento(false)}
    className="fixed inset-0 z-50 flex items-center justify-center"
  >
    {/* Fundo escurecido com blur */}
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

    {/* Modal principal */}
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full z-50 p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Provisionar Compra</h2>
        <button onClick={() => setMostrarModalProvisionamento(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Lista de parcelas */}
      {parcelas.map((parcela, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center border p-4 rounded-lg shadow-sm"
        >
          <input
            type="number"
            placeholder="Valor"
            className="border px-3 py-2 rounded-md w-full"
            value={parcela.valor}
            onChange={(e) => atualizarParcela(index, 'valor', e.target.value)}
          />
          <input
            type="text"
            placeholder="Empresa"
            className="border px-3 py-2 rounded-md w-full"
            value={parcela.empresa}
            onChange={(e) => atualizarParcela(index, 'empresa', e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <input
              type="date"
              className="border px-3 py-2 rounded-md w-full"
              value={parcela.venceEm}
              onChange={(e) => atualizarParcela(index, 'venceEm', e.target.value)}
            />
            <button
              onClick={() => excluirParcela(index)}
              className="text-red-500 hover:text-red-700"
              title="Excluir parcela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      {/* Botões */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setParcelas([...parcelas, { valor: '', empresa: '', venceEm: '' }])}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          ➕ Nova Parcela
        </button>

        <button
          onClick={salvarProvisionamento}
          className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
        >
          Salvar Provisionamento
        </button>
      </div>
    </div>
  </Dialog>
)}

    </>
  )
}

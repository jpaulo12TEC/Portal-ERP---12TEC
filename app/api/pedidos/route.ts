import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = getSupabase() // pega o Supabase vinculado aos cookies da request

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const busca = searchParams.get('q')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')

  let query = supabase.from('solicitacoes').select('*')

  if (status && status !== 'Todos') {
    query = query.eq('status', status)
  }

  if (busca) {
    query = query.ilike('nomedo_pedido', `%${busca}%`)
  }

  if (dataInicio) {
    query = query.gte('data', dataInicio)
  }

  if (dataFim) {
    query = query.lte('data', dataFim)
  }

  const { data, error } = await query.order('id', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Função para gerar o link assinado
  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase
      .storage
      .from('orcamentos') // Nome do seu bucket
      .createSignedUrl(filePath, 6000) // 60 segundos de validade para o link

    if (error) {
      console.error('Erro ao gerar link assinado:', error)
      return null
    }
    return data.signedUrl
  }

  // Processa os dados retornados do Supabase
  const resultadoFormatado = await Promise.all(
    data.map(async (item) => {
      const materiais = item.materiais
        ?.split(';')
        .map((m: string) => m.trim())
        .filter(Boolean)
        .map((str: string) => {
          const [nome, qtd] = str.split(',').map((s: string) => s.trim());
  
          return {
            nome_material: nome,
            quantidade: qtd // mantém a unidade junto, como string
          };
        });
        const orcamentos = await Promise.all(
          item.orcamento_urls
            ?.split(';')
            .map((m: string) => m.trim())
            .filter(Boolean)
            .map(async (str: string) => {
              const [nome_arquivo, enviado_por] = str.split(',').map((s: string) => s.trim())
              const signedUrl = await getSignedUrl(nome_arquivo)
              return {
                nome_arquivo,
                enviado_por,
                signedUrl // Link assinado para o arquivo
              }
            }) || []
        );

        const observacao = item.observacao
        ?.split(';')
        .map((o: string) => o.trim())
        .filter(Boolean)
        .map((str: string) => {
          const [descricao, autor, data] = str.split('|||').map((s: string) => s.trim());
        
          // Verifica se a data é válida antes de tentar convertê-la
          let dataFormatada;
          let dataOriginal = data; // Mantém a data original (em formato ISO)
          try {
            dataFormatada = new Date(data);
            if (isNaN(dataFormatada.getTime())) {
              throw new Error('Data inválida');
            }
          } catch (e) {
            console.error('Erro ao converter a data:', data);
            dataFormatada = new Date(); // Caso haja erro, usa a data atual
          }
      
          // Formata a data com hora, minuto e segundo
          const dataHora = dataFormatada.toLocaleString('pt-BR', {
            weekday: 'long', // opcional, para mostrar o dia da semana
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 24 horas
          });
      
          return {
            descricao,
            autor,
            data: dataHora, // Exibe a data formatada
            dataOriginal // Mantém a data original no formato ISO
          };
        }) || [];

      return {
        ...item,
        materiais,
        orcamento_urls: orcamentos,
        observacao // Agora 'orcamentos_urls' está correto
      }
    })
  )

  return NextResponse.json(resultadoFormatado)
}

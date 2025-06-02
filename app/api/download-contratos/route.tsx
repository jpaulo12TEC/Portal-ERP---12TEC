import { getSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('contratos_definicoes')
    .select(`
      id,
      nomedocontrato,
      cnpjcpf,
      nomedaempresa,
      objetodocontrato,
      clausulasadicionais,
      responsabilidade,
      termo,
      datafinal,
      parcela,
      procimovencimento,
      pediodicidade,
      formadepagamento,
      dadosbancarios,
      versao,
      documento
    `);

  if (error) {
    console.error("Erro na consulta ao Supabase:", error);
    return NextResponse.json({ error: 'Erro ao buscar contratos', details: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Nenhum dado encontrado' }, { status: 404 });
  }

  const contratosComUrl = await Promise.all(
    data.map(async (contrato) => {
      if (!contrato.documento) {
        return {
          ...contrato,
          url: null,
          erro: 'Contrato sem documento',
        };
      }

      const { data: signed, error: urlError } = await supabase.storage
        .from('contratos-gerados') // nome corrigido
        .createSignedUrl(`contratos/${contrato.documento}`, 300); // caminho correto

      return {
        ...contrato,
        url: signed?.signedUrl ?? null,
        erro: urlError?.message ?? null,
      };
    })
  );

  return NextResponse.json(contratosComUrl);
}

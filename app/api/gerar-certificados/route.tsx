import { NextResponse } from 'next/server';
import PPTXAutomizer from 'pptx-automizer';
import { format } from 'date-fns';

export async function POST(req: Request) {
  console.log('API gerar-certificado chamada');
  
  let body;
  try {
    body = await req.json();
    console.log('Body recebido:', body);
  } catch (err) {
    console.error('Erro ao ler JSON do request:', err);
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { funcionario, certificado, data_inicio } = body;

  if (!funcionario || !certificado || !data_inicio) {
    console.error('Dados incompletos:', { funcionario, certificado, data_inicio });
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  try {
    console.log('Buscando modelo do certificado:', certificado.link_modelo);
    const res = await fetch(certificado.link_modelo);

    if (!res.ok) {
      console.error('Erro ao buscar o modelo:', res.status, res.statusText);
      return NextResponse.json({ error: `Erro ao buscar modelo: ${res.status}` }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    console.log('Modelo baixado, tamanho do buffer:', buffer.byteLength);

    // Inicializa PPTXAutomizer
    const pptx: any = new PPTXAutomizer({});
    console.log('Carregando modelo no PPTXAutomizer...');
    await pptx.load(buffer);
    console.log('Modelo carregado');

    // Substitui textos
    console.log('Substituindo placeholders...');
    pptx.replaceText('{NOME}', funcionario.nome);
    pptx.replaceText('{CPF}', funcionario.cpf);
    pptx.replaceText('{CARGO}', funcionario.cargo);
    pptx.replaceText('{DATA}', format(new Date(data_inicio), 'dd/MM/yyyy'));
    console.log('Placeholders substituídos');

    // Gera o arquivo
    console.log('Gerando PPTX final...');
    const pptxBuffer = await pptx.saveAs();
    console.log('PPTX gerado, tamanho do buffer:', pptxBuffer.byteLength);

    return new Response(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${funcionario.nome}-${certificado.nome_certificado}.pptx"`,
      },
    });
  } catch (err) {
    console.error('Erro ao gerar o certificado:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

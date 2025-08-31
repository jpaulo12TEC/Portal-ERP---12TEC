import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// CORS: responde a preflight OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function POST(req: Request) {
  console.log('📥 Requisição recebida em /api/gerar-certificados');

  const body = await req.json();
  const { funcionario, certificado, data_inicio } = body;

  console.log('🔍 Dados recebidos:', { funcionario, certificado, data_inicio });

  if (!funcionario || !certificado) {
    console.warn('⚠️ Dados incompletos na requisição');
    return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  try {
    const htmlUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`;
    console.log('🔗 URL do HTML:', htmlUrl);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('🧠 Puppeteer iniciado');
    const page = await browser.newPage();
    console.log('📄 Nova página criada');

    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });
    console.log('🌐 Página carregada com sucesso');

    const dadosParaInjetar = {
      nome: funcionario.nome_completo,
      cpf: funcionario.cpf,
      data: formatarData(data_inicio)
    };

    console.log('🧬 Dados para preencher no HTML:', dadosParaInjetar);

    await page.evaluate((dados) => {
      document.body.innerHTML = document.body.innerHTML
        .replace(/\{NOME\}/g, dados.nome)
        .replace(/\{CPF\}/g, dados.cpf)
        .replace(/\{DATA\}/g, dados.data);
    }, dadosParaInjetar);

    console.log('📝 Dados inseridos no HTML');

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, bottom: 1, left: 1, right: 1 }
    });

    console.log('📄 PDF gerado com sucesso');

    await browser.close();
    console.log('🧹 Navegador fechado');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar certificado:');
    console.error('📛 Mensagem:', error.message);
    console.error('🧠 Stack trace:', error.stack);
    return new NextResponse(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// função CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // ou 'https://intranet12tec.vercel.app' se quiser restringir
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

// formata data
function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  const opcoes: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  return data.toLocaleDateString('pt-BR', opcoes);
}

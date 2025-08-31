import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

const allowedOrigin = "https://intranet12tec.vercel.app";

export async function OPTIONS() {
  // Responde ao preflight da requisição CORS
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  console.log('📥 Requisição recebida em /api/gerar-certificados');

  const body = await req.json();
  const { funcionario, certificado, data_inicio } = body;

  console.log('🔍 Dados recebidos:', { funcionario, certificado, data_inicio });

  if (!funcionario || !certificado) {
    console.warn('⚠️ Dados incompletos na requisição');
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400, headers: { "Access-Control-Allow-Origin": allowedOrigin } });
  }

  try {
    const htmlUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`;
    console.log('🔗 URL do HTML:', htmlUrl);

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable', // caminho do Chrome instalado
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
      data: formatarData(data_inicio),
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
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`,
        "Access-Control-Allow-Origin": allowedOrigin,
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar certificado:');
    console.error('📛 Mensagem:', error.message);
    console.error('🧠 Stack trace:', error.stack);
    return NextResponse.json({ error: 'Erro interno no servidor' }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": allowedOrigin }
    });
  }
}

function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  const opcoes: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  return data.toLocaleDateString('pt-BR', opcoes);
}

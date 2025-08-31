// app/api/gerar-certificados/route.ts

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const ALLOWED_ORIGIN = 'https://intranet12tec.vercel.app';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== ALLOWED_ORIGIN) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: corsHeaders(req),
    });
  }

  const body = await req.json();
  const { funcionario, certificado, data_inicio } = body;

  if (!funcionario || !certificado) {
    return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
      status: 400,
      headers: corsHeaders(req),
    });
  }

  try {
    const htmlUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });

    const dadosParaInjetar = {
      nome: funcionario.nome_completo,
      cpf: funcionario.cpf,
      data: formatarData(data_inicio),
    };

    await page.evaluate((dados) => {
      document.body.innerHTML = document.body.innerHTML
        .replace(/\{NOME\}/g, dados.nome)
        .replace(/\{CPF\}/g, dados.cpf)
        .replace(/\{DATA\}/g, dados.data);
    }, dadosParaInjetar);

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, bottom: 1, left: 1, right: 1 },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar certificado:', error);
    return new NextResponse(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: corsHeaders(req),
    });
  }
}

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

  if (!funcionario || !certificado || !data_inicio) {
    return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
      status: 400,
      headers: corsHeaders(req),
    });
  }

  try {
    const dataFormatada = formatarData(data_inicio);
    const dataExpedicao = calcularDataExpedicao(data_inicio, certificado.carga_horaria);

    const dadosParaInjetar = {
      nome: funcionario.nome_completo,
      cpf: funcionario.cpf,
      cargo: funcionario.cargo,
      texto: certificado.texto || '',
      data: dataFormatada,
      nome_certificado: certificado.nome_certificado || certificado.nome,
      carga_horaria: `${certificado.carga_horaria} horas`,
      data_expedicao: dataExpedicao,
      validade: certificado.validade || '',
      nome_instrutor: certificado.nome_instrutor || '',
      funcao_instrutor: certificado.funcao_instrutor || '',
      documentos_instrutor: certificado.documentos_instrutor || '',
      nome_resp: certificado.nome_resp || '',
      funcao_resp: certificado.funcao_resp || '',
      documentos_resp: certificado.documentos_resp || ''
    };

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // 1. FRENTE
    const frenteUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`;
    await page.goto(frenteUrl, { waitUntil: 'networkidle0' });
    await page.evaluate(injetarDados, dadosParaInjetar);
    const frentePdf = await page.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, bottom: 1, left: 1, right: 1 },
      pageRanges: '1'
    });

    // 2. COSTAS
    const costasUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}COSTAS.html`;
    await page.goto(costasUrl, { waitUntil: 'networkidle0' });
    await page.evaluate(injetarDados, dadosParaInjetar);
    const costasPdf = await page.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, bottom: 1, left: 1, right: 1 },
      pageRanges: '1'
    });

    await browser.close();

    // Juntar os dois buffers (frente + costas)
    const finalBuffer = Buffer.concat([frentePdf, costasPdf]);

    return new NextResponse(new Uint8Array(finalBuffer), {
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

function calcularDataExpedicao(dataInicio: string, cargaHoraria: number): string {
  const horasPorDia = 8;
  const diasNecessarios = Math.ceil(cargaHoraria / horasPorDia);

  const data = new Date(dataInicio);
  let diasAdicionados = 0;

  while (diasAdicionados < diasNecessarios) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++;
    }
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function injetarDados(dados: any) {
  const bodyHTML = document.body.innerHTML;
  const novaHTML = bodyHTML
    .replace(/\{NOME\}/g, dados.nome)
    .replace(/\{CPF\}/g, dados.cpf)
    .replace(/\{CARGO\}/g, dados.cargo)
    .replace(/\{TEXTO\}/g, dados.texto)
    .replace(/\{DATA\}/g, dados.data)
    .replace(/\{NOME_CERTIFICADO\}/g, dados.nome_certificado)
    .replace(/\{CARGA_HORARIA\}/g, dados.carga_horaria)
    .replace(/\{DATA_EXPEDICAO\}/g, dados.data_expedicao)
    .replace(/\{VALIDADE\}/g, dados.validade)
    .replace(/\{NOME_INSTRUTOR\}/g, dados.nome_instrutor)
    .replace(/\{FUNCAO_INSTRUTOR\}/g, dados.funcao_instrutor)
    .replace(/\{DOCUMENTOS_INSTRUTOR\}/g, dados.documentos_instrutor)
    .replace(/\{NOME_RESP\}/g, dados.nome_resp)
    .replace(/\{FUNCAO_RESP\}/g, dados.funcao_resp)
    .replace(/\{DOCUMENTOS_RESP\}/g, dados.documentos_resp);

  document.body.innerHTML = novaHTML;
}

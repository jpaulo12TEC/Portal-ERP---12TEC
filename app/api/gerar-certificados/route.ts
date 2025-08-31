import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument } from 'pdf-lib'; // <- IMPORTANTE

const ALLOWED_ORIGIN = 'https://intranet12tec.vercel.app';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== ALLOWED_ORIGIN) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: corsHeaders(req),
    });
  }

  const { funcionario, certificado, data_inicio } = await req.json();
  if (!funcionario || !certificado || !data_inicio) {
    return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
      status: 400,
      headers: corsHeaders(req),
    });
  }

  try {
    const dataFormatada = formatarData(data_inicio);
    const dataExpedicao = calcularDataExpedicao(data_inicio, certificado.carga_horaria);

    const dados = {
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
      documentos_resp: certificado.documentos_resp || '',
    };

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    // Gera a FRENTE do certificado
    const frontPage = await browser.newPage();
    await frontPage.goto(`https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`, {
      waitUntil: 'networkidle0',
    });
    await frontPage.evaluate(injetarDados, dados);
    const frontPdf = await frontPage.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    // Gera as COSTAS do certificado
    const backPage = await browser.newPage();
    await backPage.goto(`https://intranet12tec.vercel.app/modelos/${certificado.nome}COSTAS.html`, {
      waitUntil: 'networkidle0',
    });
    await backPage.evaluate(injetarDados, dados);
    const backPdf = await backPage.pdf({
      printBackground: true,
      width: '2020px',
      height: '1140px',
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    await browser.close();

    // Junta os dois PDFs usando pdf-lib
    const mergedPdf = await PDFDocument.create();

    const frontDoc = await PDFDocument.load(frontPdf);
    const backDoc = await PDFDocument.load(backPdf);

    const [frontPageCopied] = await mergedPdf.copyPages(frontDoc, [0]);
    const [backPageCopied] = await mergedPdf.copyPages(backDoc, [0]);

    mergedPdf.addPage(frontPageCopied);
    mergedPdf.addPage(backPageCopied);

    const finalBuffer = await mergedPdf.save();

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Erro ao gerar certificado:', err);
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

function formatarData(dataISO: string) {
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function calcularDataExpedicao(dataInicio: string, carga: number) {
  const horasDia = 8;
  const dias = Math.ceil(carga / horasDia);
  const d = new Date(dataInicio);
  let count = 0;
  while (count < dias) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) count++;
  }
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function injetarDados(dados: any) {
  document.body.innerHTML = document.body.innerHTML
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
}

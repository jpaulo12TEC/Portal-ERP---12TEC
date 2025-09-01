import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const ALLOWED_ORIGIN = 'https://intranet12tec.vercel.app';

export async function OPTIONS(req: NextRequest) {
  // Preflight CORS
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin !== ALLOWED_ORIGIN) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: corsHeaders(),
      });
    }

    const { funcionario, certificado, data_inicio } = await req.json();
    if (!funcionario || !certificado || !data_inicio) {
      return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const dataFormatada = formatarData(data_inicio);
    const dataExpedicao = calcularDataExpedicao(data_inicio, certificado.carga_horaria);



const imgPathFrente = path.join(process.cwd(), 'public/modelos', `${certificado.nome}FRENTE.jpg`);
const imgPathCostas = path.join(process.cwd(), 'public/modelos', `${certificado.nome}COSTAS.jpg`);

const imagemFrente = `data:image/jpeg;base64,${fs.readFileSync(imgPathFrente).toString('base64')}`;
const imagemCostas = `data:image/jpeg;base64,${fs.readFileSync(imgPathCostas).toString('base64')}`;


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
      imagem_certificado_frente: imagemFrente,
      imagem_certificado_costas: imagemCostas,
    };

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const frontPage = await browser.newPage();
    await frontPage.goto(`https://intranet12tec.vercel.app/modelos/NRFRENTE.html`, { waitUntil: 'networkidle0' });
    await frontPage.evaluate(injetarDados, dados);
    const frontPdf = await frontPage.pdf({ printBackground: true, width: '2020px', height: '1140px', margin: { top: 1, right: 1, bottom: 1, left: 1 } });

    const backPage = await browser.newPage();
    await backPage.goto(`https://intranet12tec.vercel.app/modelos/NRCOSTAS.html`, { waitUntil: 'networkidle0' });
    await backPage.evaluate(injetarDados, dados);
    const backPdf = await backPage.pdf({ printBackground: true, width: '2020px', height: '1140px', margin: { top: 1, right: 1, bottom: 1, left: 1 } });

    await browser.close();

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
        ...corsHeaders(),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`,
      },
    });

  } catch (err) {
    console.error('Erro ao gerar certificado:', err);
    return new NextResponse(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // ou '*' para testes
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function formatarData(dataISO: string) {
  const d = new Date(dataISO);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcularDataExpedicao(dataInicio: string, carga: number) {
  const horasDia = 8;
  const dias = Math.ceil(carga / horasDia);
  const d = new Date(dataInicio);
  let count = 0;
  while (count < dias) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    .replace(/\{DOCUMENTOS_RESP\}/g, dados.documentos_resp)
    .replace(/\{IMAGEM_CERTIFICADO_FRENTE\}/g, dados.imagem_certificado_frente)
    .replace(/\{IMAGEM_CERTIFICADO_COSTAS\}/g, dados.imagem_certificado_costas);
  // injetar nome/cargo em spans específicos
  const nomeSpan = document.querySelector(".cargo-nome-span2");
  if (nomeSpan) nomeSpan.innerHTML = `<b>${dados.nome}</b>`;

  const cargoSpan = document.querySelector(".cargo-nome-span");
  if (cargoSpan) cargoSpan.innerHTML = `${dados.cargo}<br/>`;
}



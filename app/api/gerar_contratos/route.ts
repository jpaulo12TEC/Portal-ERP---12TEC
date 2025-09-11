import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ALLOWED_ORIGIN = 'https://intranet12tec.vercel.app';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') || '';
    if (!origin.startsWith(ALLOWED_ORIGIN)) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: corsHeaders(),
      });
    }

    const { contrato } = await req.json();
    if (!contrato || !contrato.contratante || !contrato.contratado || !contrato.data_inicio) {
      return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // --- Preencher placeholders no HTML ---
    let html = contrato.html;

    html = html
    .replace(/\{\{contrato_nome\}\}/g, contrato.nome || '')
      .replace(/\{\{contrato_id\}\}/g, contrato.id || '')
      .replace(/\{\{data_assinatura\}\}/g, contrato.data_assinatura || '')
      .replace(/\{\{cidade\}\}/g, contrato.cidade || '')
      .replace(/\{\{estado\}\}/g, contrato.estado || '')
      .replace(/\{\{data_inicio\}\}/g, contrato.data_inicio || '')
      .replace(/\{\{prazo_meses\}\}/g, contrato.prazo_meses?.toString() || '')
      .replace(/\{\{objeto\}\}/g, contrato.objeto || '')
      .replace(/\{\{valor_num\}\}/g, contrato.valor_num || '')
      .replace(/\{\{valor_extenso\}\}/g, contrato.valor_extenso || '')
      .replace(/\{\{condicoes_pagamento\}\}/g, contrato.condicoes_pagamento || '')
      .replace(/\{\{condicoes_rescisao\}\}/g, contrato.condicoes_rescisao || '')
      .replace(/\{\{prazo_confidencialidade\}\}/g, contrato.prazo_confidencialidade || '')
      .replace(/\{\{foro_cidade\}\}/g, contrato.foro_cidade || '')
      .replace(/\{\{foro_estado\}\}/g, contrato.foro_estado || '')
      .replace(/\{\{gerado_por\}\}/g, contrato.gerado_por || '')
      .replace(/\{\{contratante\.nome\}\}/g, contrato.contratante.nome || '')
      .replace(/\{\{contratante\.cpf\}\}/g, contrato.contratante.cpfCnpj || '')
      .replace(/\{\{contratante\.endereco\}\}/g, contrato.contratante.endereco || '')
      .replace(/\{\{contratado\.nome\}\}/g, contrato.contratado.nome || '')
      .replace(/\{\{contratado\.cnpj\}\}/g, contrato.contratado.cpfCnpj || '')
      .replace(/\{\{contratado\.endereco\}\}/g, contrato.contratado.endereco || '')
      .replace(/\{\{obrigacoes_contratado_lista\}\}/g, contrato.obrigacoes_contratado_lista || '')
      .replace(/\{\{obrigacoes_contratante_lista\}\}/g, contrato.obrigacoes_contratante_lista || '');

      // ultimaClausula = número da última cláusula fixa antes das adicionais (ex: 7)
const ultimaClausula = 7;

if (Array.isArray(contrato.clausulas) && contrato.clausulas.length > 0) {
  const clausulasHtml = contrato.clausulas
    .map((c: string, idx: number) => `
      <section class="section">
        <h2>CLÁUSULA ADICIONAL ${ultimaClausula + idx + 1} </h2>
        <p class="clausula">${c}</p>
      </section>
    `)
    .join('');

  html = html.replace(/\{\{#if clausulas\}\}([\s\S]*?)\{\{\/if\}\}/, clausulasHtml);
} else {
  html = html.replace(/\{\{#if clausulas\}\}([\s\S]*?)\{\{\/if\}\}/, '');
}

    // --- 1️⃣ Gerar PDF do HTML com Puppeteer ---
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    await browser.close();

    // --- 2️⃣ Abrir PDF com pdf-lib para adicionar numeração ---
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pdfDoc.getPages().forEach((page, idx) => {
      const { width, height } = page.getSize();
      page.drawText(`Página ${idx + 1} de ${pdfDoc.getPages().length}`, {
        x: width - 100,
        y: 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const finalPdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${contrato.contratante.nome}-contrato.pdf`,
      },
    });

  } catch (err) {
    console.error('Erro ao gerar contrato:', err);
    return new NextResponse(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ALLOWED_ORIGINS = [
  'https://intranet12tec.vercel.app',
  'http://localhost:3000'
];

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') || '';
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: corsHeaders(origin),
      });
    }

    const { contrato } = await req.json();
    if (!contrato || !contrato.contratante || !contrato.contratado || !contrato.data_inicio) {
      return new NextResponse(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    // --- Preencher placeholders no HTML ---
    let html = contrato.html;
    Object.keys(contrato).forEach(key => {
      const value = contrato[key] ?? '';
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    // --- Cláusulas ---
    if (Array.isArray(contrato.clausulas) && contrato.clausulas.length > 0) {
      const clausulasHtml = contrato.clausulas
        .map((c: string, idx: number) => `<p class="clausula"><strong>Cláusula ${idx + 1}.</strong> ${c}</p>`)
        .join('');
      html = html.replace(/\{\{#if clausulas\}\}([\s\S]*?)\{\{\/if\}\}/, clausulasHtml);
    } else {
      html = html.replace(/\{\{#if clausulas\}\}([\s\S]*?)\{\{\/if\}\}/, '');
    }

    // --- Gerar PDF com Puppeteer ---
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: 20, bottom: 20, left: 20, right: 20 } });
    await browser.close();

    // --- Numeração com pdf-lib ---
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    pdfDoc.getPages().forEach((p, idx) => {
      const { width } = p.getSize();
      p.drawText(`Página ${idx + 1} de ${pdfDoc.getPages().length}`, { x: width - 100, y: 20, size: 10, font: helveticaFont, color: rgb(0.5, 0.5, 0.5) });
    });

    const finalPdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${contrato.contratante.nome}-contrato.pdf`,
      },
    });

  } catch (err) {
    console.error('Erro ao gerar contrato:', err);
    const origin = req.headers.get('origin') || '';
    return new NextResponse(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
}

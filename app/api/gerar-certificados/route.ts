import path from 'path';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  const body = await req.json();
  const { funcionario, certificado, data_inicio } = body;

  if (!funcionario || !certificado) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  try {
    // 1. Gera uma URL para o HTML já pronto (em public/modelos)
    const htmlUrl = `https://intranet12tec.vercel.app/modelos/${certificado.nome}FRENTE.html`;

    // 2. Gera o PDF com Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 3. Vai até a página pública via URL
    await page.goto(htmlUrl, { waitUntil: 'networkidle0' });

    // 4. Preenche dinamicamente via evaluate, se necessário
    await page.evaluate((dados) => {
      document.body.innerHTML = document.body.innerHTML
        .replace(/\{NOME\}/g, dados.nome)
        .replace(/\{CPF\}/g, dados.cpf)
        .replace(/\{DATA\}/g, dados.data);
    }, {
      nome: funcionario.nome_completo,
      cpf: funcionario.cpf,
      data: formatarData(data_inicio),
    });

    // 5. Gera o PDF em formato A4 paisagem, só uma página, sem margens
const pdfBuffer = await page.pdf({
  printBackground: true,
  width: '2020px',
  height: '1140px',
  margin: { top: 1, bottom: 1, left: 1, right: 1 }
});

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${funcionario.nome_completo}-${certificado.nome}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Função para formatar a data
function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  const opcoes: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  return data.toLocaleDateString('pt-BR', opcoes);
}

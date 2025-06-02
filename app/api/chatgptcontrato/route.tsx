import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, Header, Media } from 'docx'; // Pacote para gerar o Word



interface NovoContrato {
  nomeContrato: string;
  cnpjCpf: string;
  empresa: string;
  objetoContrato: string;
  clausulasAdicionais: string;
  responsabilidades: string;
  termoRescisao: string;
  tipoContrato: string;
  dataFinal?: string;
  valorParcela: string;
  proximoVencimento: string;
  periodicidade: string;
  formaPagamento: string;
  dadosBancarios?: string;
}

export async function POST(req: NextRequest) {
  const { novoContrato }: { novoContrato: NovoContrato } = await req.json();

  if (!novoContrato) {
    return NextResponse.json({ error: 'Dados do contrato não enviados.' }, { status: 400 });
  }

  const prompt = `
  Crie um contrato formal e completo com as seguintes informações:

  Contratante: 12 TEC Engenharia
  CNPJ da Contratante: 30.257.741/0001-13
  Endereço da Contratante: Travessa Iguaçu, n.30 - Dezoito do Forte, Aracaju/SE
  Nome do Contrato: ${novoContrato.nomeContrato}
  CNPJ ou CPF da Contratada: ${novoContrato.cnpjCpf}
  Nome da Contratada: ${novoContrato.empresa}
  Objeto do Contrato: ${novoContrato.objetoContrato}
  Cláusulas Adicionais: ${novoContrato.clausulasAdicionais}
  Responsabilidades das Partes: ${novoContrato.responsabilidades}
  Termo de Rescisão: ${novoContrato.termoRescisao}
  Tipo de Contrato: ${novoContrato.tipoContrato}
  Data Final (se aplicável): ${novoContrato.dataFinal || 'Não se aplica'}
  Valor da Parcela: ${novoContrato.valorParcela}
  Próximo Vencimento: ${novoContrato.proximoVencimento}
  Periodicidade: ${novoContrato.periodicidade}
  Forma de Pagamento: ${novoContrato.formaPagamento}
  Dados Bancários ou Chave PIX: ${novoContrato.dadosBancarios || 'Não informado'}

  Com base nessas informações, elabore um contrato jurídico que contenha obrigatoriamente:

  1. Identificação completa das partes.
  2. Objeto do contrato, detalhado.
  3. Responsabilidades padrão:
     - Cumprimento das obrigações contratuais com diligência e boa-fé;
     - Comunicação imediata de quaisquer imprevistos relevantes;
     - Responsabilidade solidária por danos causados a terceiros;
     - Cumprimento da legislação aplicável ao objeto deste contrato.
  4. Pagamento conforme valor e forma especificada.
  5. Vigência conforme tipo de contrato:
     - Se prazo determinado, destacar a data final.
     - Se prazo indeterminado, indicar que o contrato segue por tempo indeterminado até rescisão.
  6. Multa de rescisão:
     - Em caso de rescisão imotivada, multa de 5% (cinco por cento) sobre o saldo devedor ou valor total do contrato, o que for menor.
  7. Cláusula de confidencialidade:
     - As partes deverão manter sigilo absoluto sobre quaisquer informações obtidas durante a execução deste contrato.
  8. Foro:
     - Fica eleito o foro da Comarca de Aracaju/SE para dirimir quaisquer litígios oriundos do presente instrumento, com renúncia expressa de qualquer outro, por mais privilegiado que seja.
  9. Termos gerais:
     - Possibilidade de aditivo contratual, renovação e rescisão por acordo mútuo.
  10. Espaço para assinatura das partes, indicando local e data e assinatura das testemunhas.

  Utilize uma estrutura formal, cláusulas numeradas e linguagem jurídica clara e adequada para fins oficiais.
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Você é um especialista jurídico que elabora contratos de maneira formal e detalhada.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const contrato = response.data?.choices?.[0]?.message?.content;

    if (!contrato) {
      return NextResponse.json({ error: 'Resposta inválida da OpenAI.' }, { status: 500 });
    }

    // Separando os parágrafos com base nas quebras de linha
    const parrafos = contrato.split('\n').map((par: string) => par.trim()).filter((par: string) => par.length > 0);

    // Função para identificar se o parágrafo é um título (ex: "Cláusula 1", "Objeto do contrato")
    const isTitle = (par: string) => {
      const titlePattern = /^(\d+\.\s*|\b[A-Za-zÀ-ÿ\s]+(?:\s+\d+)?\b)$/;
      return titlePattern.test(par);
    };

    // Função para verificar se o parágrafo é o último, referente à assinatura
    const isSignatureSection = (par: string) => {
      return par.includes('firmam') || par.includes('testemunhas') || par.includes('testemunha') || par.includes('Testemunha') || par.includes('Testemunhas') ||par.includes('assinadas') ;
    };
    let foundSignatureSection = false; // Flag para indicar se já encontrou a seção de assinatura


    // Criação do documento Word com o conteúdo do contrato
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { // Corrigido de 'margins' para 'margin'
                top: 56.7 * 20,   // 2cm em pontos (2 * 28.35)
                left: 56.7 * 20,  // 2cm em pontos (2 * 28.35)
                bottom: 85.05 * 20, // 3cm em pontos (3 * 28.35)
                right: 85.05 * 20, // 3cm em pontos (3 * 28.35)
              },
              size: { // Aqui é onde você define o tamanho da página e a orientação
                orientation: PageOrientation.PORTRAIT, // A orientação é configurada corretamente aqui
              },
            },
          },

          
          children: parrafos.map((par: string, index: number) => {
            if (!foundSignatureSection && isSignatureSection(par)) {
              foundSignatureSection = true; // Quando encontrar, ativa a flag
            }
          
            if (foundSignatureSection) {
              // Se já encontrou a seção de assinatura, centraliza tudo depois
              return new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: par,
                    font: 'Arial',
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              });
            } else if (index === 0 && isTitle(par)) {
              // Primeiro título (Título principal, CENTRALIZADO)
              return new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: par,
                    bold: true,
                    font: 'Arial',
                    size: 36,
                  }),
                ],
                spacing: { after: 400 },
              });
            } else if (isTitle(par)) {
              // Títulos secundários (alinhados normal)
              return new Paragraph({
                children: [
                  new TextRun({
                    text: par,
                    bold: true,
                    font: 'Arial',
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              });
            } else {
              // Texto normal (justificado)
              return new Paragraph({
                alignment: AlignmentType.BOTH,
                children: [
                  new TextRun({
                    text: par,
                    font: 'Arial',
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              });
            }
          })
        },
      ],
    });

    // Converte o documento em um arquivo Word (.docx)
    const buffer = await Packer.toBuffer(doc);

    // Envia o arquivo gerado como resposta para download
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${novoContrato.nomeContrato}.docx"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar o contrato:', error);
    return NextResponse.json({ error: 'Erro ao gerar o contrato.' }, { status: 500 });
  }
}

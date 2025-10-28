// app/api/onedrive/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/oneDrive';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 });

    const token = await getAppToken();

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erro ao baixar arquivo do SharePoint:', text);
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const filename = url.split('/').pop() || 'documento.pdf';

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

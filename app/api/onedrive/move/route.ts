// app/api/onedrive/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppToken } from '@/lib/oneDrive';
import { moveFileOnOneDrive } from '@/lib/moveFileOnOneDrive';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileIdOrUrl, tipo } = body;

    if (!fileIdOrUrl) {
      return NextResponse.json({ error: 'fileIdOrUrl é obrigatório' }, { status: 400 });
    }

    // Pega token do backend
    const accessToken = await getAppToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Não foi possível obter o token do OneDrive' }, { status: 401 });
    }

    // Valida ou define tipo padrão
    const folderTipo = tipo || 'compras';

    // Chama função de mover arquivo passando o token
    await moveFileOnOneDrive(fileIdOrUrl, folderTipo, accessToken);

    return NextResponse.json({ message: 'Arquivo movido com sucesso!' });
  } catch (err: any) {
    console.error('Erro ao mover arquivo via API:', err);
    return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 500 });
  }
}

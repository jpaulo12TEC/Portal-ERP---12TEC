import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Lê o cookie
    const token = req.cookies.get('azure_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // 2️⃣ Pega dados do usuário do Graph API
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!graphRes.ok) {
      return NextResponse.json({ error: 'Erro ao buscar dados do Graph API' }, { status: 500 });
    }

    const graphData = await graphRes.json();

    // 3️⃣ Retorna token + dados do Graph
    return NextResponse.json({
      access_token: token,
      name: graphData.displayName,
      email: graphData.mail || graphData.userPrincipalName,
    });
  } catch (err) {
    console.error('Erro em /api/auth/me:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

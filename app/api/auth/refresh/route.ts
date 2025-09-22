import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Lê o refresh token do cookie HttpOnly
    const refreshToken = req.cookies.get('azure_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token ausente' }, { status: 401 });
    }

    // 2️⃣ Monta a requisição para o endpoint da Microsoft
    const tenantId = process.env.AZURE_TENANT_ID!;
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'User.Read Files.ReadWrite.All offline_access',
    });

    const res = await fetch(tokenUrl, { method: 'POST', body });
    const data = await res.json();

    if (!res.ok) {
      console.error('Erro ao renovar token:', data);
      return NextResponse.json({ error: 'Falha ao renovar token' }, { status: 500 });
    }

    // 3️⃣ Cria nova resposta com cookies atualizados
    const response = NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in, // geralmente ~3600 segundos
    });

    // 4️⃣ Atualiza o refresh_token (a Microsoft geralmente envia um novo)
    if (data.refresh_token) {
      response.cookies.set('azure_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // ~30 dias (ou conforme política)
      });
    }

    // 5️⃣ Atualiza também o access_token (se você preferir manter em cookie)
    response.cookies.set('azure_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: data.expires_in,
    });

    return response;
  } catch (err) {
    console.error('Erro interno em /api/auth/refresh:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
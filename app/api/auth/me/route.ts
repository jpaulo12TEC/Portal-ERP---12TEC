import { NextRequest, NextResponse } from 'next/server';

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const tenantId = process.env.AZURE_TENANT_ID!;

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
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.access_token;
}

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('azure_token')?.value;
    const refreshToken = req.cookies.get('azure_refresh_token')?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Se não tem token mas tem refresh token
    if (!token && refreshToken) {
      token = await refreshAccessToken(refreshToken);
    }

    // ✅ Cria a resposta NextResponse
    const res = NextResponse.json({}); // Placeholder, vamos preencher depois

    // Atualiza o cookie do access token
if (token) {
  res.cookies.set('azure_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 3600,
  });
}

    // Busca dados do Graph API
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!graphRes.ok) {
      return NextResponse.json({ error: 'Erro ao buscar dados do Graph API' }, { status: 500 });
    }

    const graphData = await graphRes.json();

    // Retorna os dados + token atualizado
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
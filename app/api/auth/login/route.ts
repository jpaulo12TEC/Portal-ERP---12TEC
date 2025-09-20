import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=NoCode`);
  }

  const codeVerifier = req.cookies.get('code_verifier')?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=NoCodeVerifier`);
  }

  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const tenantId = process.env.AZURE_TENANT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: 'User.Read Files.ReadWrite.All offline_access',
  });

  const res = await fetch(tokenUrl, { method: 'POST', body });
  const data = await res.json();

  if (!res.ok) {
    console.error('Token error:', data);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=TokenFailed`);
  }

  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);

  // Salva access token
  response.cookies.set('azure_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: data.expires_in,
  });

  // Salva refresh token (30 dias)
  if (data.refresh_token) {
    response.cookies.set('azure_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Limpa code_verifier
  response.cookies.delete({ name: 'code_verifier', path: '/' });

  return response;
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect('/?error=no_code');

  const clientId = process.env.AZURE_CLIENT_ID!;
  const tenantId = process.env.AZURE_TENANT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  const codeVerifier = req.cookies.get('code_verifier')?.value;
  if (!codeVerifier) return NextResponse.redirect('/?error=no_verifier');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenUrl, { method: 'POST', body });
  const data = await res.json();

  if (!res.ok) return NextResponse.redirect(`/?error=${encodeURIComponent(data.error_description)}`);

  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
  response.cookies.set('azure_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: data.expires_in,
  });

  // Limpar o cookie do code_verifier
 response.cookies.delete({
  name: 'code_verifier',
  path: '/',
});

  return response;
}

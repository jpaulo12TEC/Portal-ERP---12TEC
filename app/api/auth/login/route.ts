import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.AZURE_CLIENT_ID!;
  const tenantId = process.env.AZURE_TENANT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  // PKCE: gerar code_verifier e code_challenge
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const scope = encodeURIComponent('User.Read Files.ReadWrite.All offline_access');

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${scope}&state=12345&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const response = NextResponse.redirect(authUrl);

  // Salvar code_verifier em cookie seguro temporário
  response.cookies.set('code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 300, // 5 minutos
  });

  return response;
}

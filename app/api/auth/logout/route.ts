// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1️⃣ URL de logout do Azure AD
    const azureLogoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/')}`;

    // 2️⃣ Cria resposta que redireciona para logout da Microsoft
    const response = NextResponse.redirect(azureLogoutUrl);

    // 3️⃣ Deleta cookies de acesso e refresh
    response.cookies.delete({ name: 'azure_token', path: '/' });
    response.cookies.delete({ name: 'azure_refresh_token', path: '/' });

    // Se tiver outros cookies de sessão, deletar também
    // response.cookies.delete('outro_cookie', { path: '/' });

    return response;
  } catch (err) {
    console.error('Erro no logout:', err);
    return NextResponse.json(
      { error: 'Erro ao tentar fazer logout' },
      { status: 500 }
    );
  }
}
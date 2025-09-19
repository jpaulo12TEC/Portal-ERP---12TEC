// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = NextResponse.redirect('/');

    // Deleta o cookie passando um objeto
    response.cookies.delete({ name: 'azure_token', path: '/' });

    return response;
  } catch (err) {
    console.error('Erro no logout:', err);
    return NextResponse.json({ error: 'Erro no logout' }, { status: 500 });
  }
}

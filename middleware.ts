import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();  // Cria a resposta

  const supabase = createMiddlewareClient({ req, res });  // Passa ambos req e res para o supabase

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = ['/dashboard', '/criar_usuario'];

  const isProtected = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Se o usuário não estiver autenticado e acessando uma rota protegida, redireciona para o login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

    // 🔒 ID do usuário autorizado para acessar /criar_usuario
  const adminUserId = '74b31345-1027-45f3-9580-e332a8d83d9b';  // 🔗 Coloque aqui o ID do usuário permitido

  // 🚫 Bloqueia se tentar acessar rota protegida sem estar logado
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ✅ Permissão exclusiva para /criar_usuario
  if (
    req.nextUrl.pathname.startsWith('/criar_usuario') &&
    user?.id !== adminUserId
  ) {
    // Redireciona se NÃO for o usuário autorizado
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 🔁 Tratamento para a página inicial
  if (!user && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  } else if (user && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/criar_usuario/:path*', '/'],
};

import { NextResponse } from 'next/server';
import { supabase } from '../lib/supabase';

export async function middleware(req) {
  // Verifica a sessão do usuário
  const { data: session, error } = await supabase.auth.getSession();

  // Debug para ver se a sessão está sendo verificada corretamente
  console.log("Session Data:", session);

  if (error || !session) {
    // Se não estiver logado, redireciona para a página de login
    return NextResponse.redirect('/');
  }

  // Se estiver logado, continua com a requisição
  console.log("Usuário autenticado, passando para a próxima rota.");
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/profile', '/admin'], // Protege as rotas que você quiser
};

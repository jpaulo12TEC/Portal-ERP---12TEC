'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'; // Importar o hook usePathname
import { Session } from '@supabase/supabase-js';

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const router = useRouter();
  const pathname = usePathname();  // Agora, pegamos o pathname aqui

  useEffect(() => {
    const supabase = createClientComponentClient();

    // Verifica a sessão ao carregar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);  // Carregamento concluído
      
      // Redireciona para login ou dashboard baseado na sessão
      if (!data.session) {
        router.push('/login');  // Se não estiver autenticado, vai para o login
      } else {
        if (pathname === '/') {
          router.push('/dashboard');  // Redireciona para o dashboard se estiver autenticado
        }
      }
    });

    // Ouve mudanças no estado de autenticação
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        router.push('/login');  // Se não estiver autenticado, vai para o login
      } else {
        if (pathname === '/') {
          router.push('/dashboard');  // Redireciona para o dashboard se estiver autenticado
        }
      }
    });
  }, [pathname, router]);

  if (loading) {
    return <div>Carregando...</div>;  // Exibe o carregamento enquanto a verificação está em andamento
  }

  return <>{children}</>;  // Renderiza os filhos se o usuário estiver autenticado
}

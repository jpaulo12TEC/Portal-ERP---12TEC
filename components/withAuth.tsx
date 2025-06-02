"use client";

import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withAuth(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    const user = useUser();
    const router = useRouter();

    useEffect(() => {
      if (user === null) {
        router.push("/"); // ou "/login" se sua página de login estiver lá
      }
    }, [user]);

    // Enquanto carrega o estado do usuário
    if (user === undefined) {
      return <p>Carregando...</p>;
    }

    // Se autenticado, renderiza o componente protegido
    return <Component {...props} />;
  };
}
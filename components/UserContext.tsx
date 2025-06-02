'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


// 👤 Custom user metadata
type CustomUser = {
  id?: string; // 👈 Adicionado aqui
  nome: string;
  cargo?: string;
  empresa?: string;
  nivelAcesso?: string;
  email_verified?: boolean;
};

type UserContextType = CustomUser;

const UserContext = createContext<UserContextType>({
  nome: 'Desconhecido',
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomUser>({ nome: 'Desconhecido' });
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      const metadata = data?.user?.user_metadata;

if (data?.user && metadata?.nome) {
  setUser({
    id: data.user.id, // 👈 Aqui você captura o ID do usuário
    nome: metadata.nome,
    cargo: metadata.cargo,
    empresa: metadata.empresa,
    nivelAcesso: metadata.nivelAcesso,
    email_verified: metadata.email_verified,
  });
} else {
        console.warn('Usuário sem metadados ou erro ao buscar:', error?.message);
      }
    };

    fetchUser();
  }, [supabase]);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

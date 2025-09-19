'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type CustomUser = {
  id?: string;
  nome: string;
  cargo?: string;
  empresa?: string;
  nivelAcesso?: string;
  email_verified?: boolean;
  azureToken?: string;   // ✅ Token do Azure
  azureName?: string;    // ✅ Nome vindo do Azure
  azureEmail?: string;   // ✅ Email vindo do Azure
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
      // 1️⃣ Pega dados do Supabase
      const { data, error } = await supabase.auth.getUser();
      const metadata = data?.user?.user_metadata;

      let newUser: CustomUser = {
        id: data?.user?.id,
        nome: metadata?.nome || 'Desconhecido',
        cargo: metadata?.cargo,
        empresa: metadata?.empresa,
        nivelAcesso: metadata?.nivelAcesso,
        email_verified: metadata?.email_verified,
      };

      // 2️⃣ Pega token do Azure via API route (HttpOnly)
      try {
        const res = await fetch('/api/auth/me'); // rota que retorna { access_token }
        if (res.ok) {
          const azureData = await res.json();
          newUser.azureToken = azureData.access_token;
          newUser.azureName = azureData.name;   // se retornar do Graph API
          newUser.azureEmail = azureData.email;
        }
      } catch (err) {
        console.warn('Não foi possível buscar dados do Azure', err);
      }

      setUser(newUser);
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

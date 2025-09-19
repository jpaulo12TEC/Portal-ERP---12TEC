'use client';
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getAppToken } from "@/lib/oneDrive";

interface OneDriveContextType {
  token: string | null;
  loading: boolean;
}

const OneDriveContext = createContext<OneDriveContextType>({ token: null, loading: true });

export function useOneDrive() {
  return useContext(OneDriveContext);
}

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = await getAppToken();
        setToken(accessToken);
      } catch (err) {
        console.error("Erro ao obter token OneDrive:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <OneDriveContext.Provider value={{ token, loading }}>
      {loading ? <p>Carregando...</p> : children}
    </OneDriveContext.Provider>
  );
}

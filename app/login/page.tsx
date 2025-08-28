'use client';
import '../styles.css';
import msalInstance from "@/lib/msalConfig";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [lastAttempt, setLastAttempt] = useState<number>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // ✅ Inicializa MSAL e processa redirect
  useEffect(() => {
    const initMSAL = async () => {
      try {
        if (typeof msalInstance.initialize === "function") {
          await msalInstance.initialize();
        }

        const result = await msalInstance.handleRedirectPromise();
        if (result?.account) {
          console.log("MSAL login concluído:", result.account);
          const tokenResponse = await msalInstance.acquireTokenSilent({
            account: result.account,
            scopes: ["Files.ReadWrite", "User.Read"],
          });
          console.log("Access token obtido:", tokenResponse.accessToken);
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Erro ao processar redirect MSAL:", err);
      }
    };

    initMSAL();
  }, [router]);

  // 🔐 Função de login MSAL
  const loginMSAL = async () => {
    try {
      if (typeof msalInstance.initialize === "function") {
        await msalInstance.initialize();
      }

      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        await msalInstance.loginRedirect({
          scopes: ["Files.ReadWrite", "User.Read"],
          redirectUri: window.location.origin + "/dashboard",
        });
      }
    } catch (err) {
      console.error("Erro no login MSAL:", err);
      throw err;
    }
  };

  // 🔑 Login Supabase
// 🔑 Login Supabase com proteções
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  // evita duplo clique
  if (loading) return;

  // throttle: só permite 1 tentativa a cada 5s
  const now = Date.now();
  if (now - lastAttempt < 5000) {
    setError("Aguarde alguns segundos antes de tentar novamente.");
    return;
  }
  setLastAttempt(now);

  setLoading(true);
  setError("");

  try {
    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (supabaseError) {
      // ⚡ Tratamento especial pro erro 429
      if ((supabaseError as any).status === 429) {
        setError("Muitas tentativas! Tente novamente em alguns segundos.");
      } else {
        setError("Erro ao entrar! Verifique suas credenciais.");
      }
      setLoading(false);
      return;
    }

    console.log("Login Supabase bem-sucedido");

    // ✅ Só tenta login MSAL se supabase der certo
    await loginMSAL();
  } catch (err) {
    console.error("Erro desconhecido:", err);
    setError("Erro desconhecido. Tente novamente.");
  } finally {
    setLoading(false);
  }
};


 return (
    <div className="flex h-[100%]">
      {/* Lado esquerdo com gradiente vermelho */}
      <div className="flex-1 flex justify-center items-center bg-gradient-to-b from-[#200101] via-[#5a0d0d] to-[#7a1a1a]">
        <img
          src="/Logobranca.png"
          alt="Logo"
          className="w-2/3 max-w-xs animate-pulse"
        />
      </div>

      {/* Lado direito branco com formulário moderno */}
{/* Lado direito branco com formulário moderno e centralizado verticalmente */}
<div className="flex-1 bg-white flex flex-col justify-center items-center px-8">
  {/* Espaço para foto do usuário com fallback */}
  <img
    src={userPhoto || "/img.png"} // imagem fallback caso não exista
    alt="Foto do usuário"
    className="w-40 h-40 mb-10 rounded-full mb-6 shadow-md object-cover"
  />

  {/* Título elegante */}
  <h2 className="text-3xl font-extrabold mb-2 text-gray-800 text-center">
    Seja bem-vindo à intranet da 12TEC
  </h2>
  <p className="text-gray-500 mb-8 text-lg text-center">
    Digite seu e-mail e senha para continuar
  </p>

  {/* Formulário */}
  <form className="w-full max-w-md space-y-6" onSubmit={handleLogin}>
    <div className="relative">
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 shadow-md transition duration-300"
      />
    </div>

    <div className="relative">
      <input
        type={passwordVisible ? "text" : "password"}
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 shadow-md transition duration-300"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
        onClick={() => setPasswordVisible(!passwordVisible)}
      >
        {passwordVisible ? "Ocultar" : "Mostrar"}
      </button>
    </div>

    {error && <p className="text-red-600">{error}</p>}

<button
  type="submit"
  disabled={loading}
  className="
    w-full py-3 
    bg-gradient-to-r from-[#B71C1C] to-[#F44336] 
    text-gray-900 font-bold rounded-2xl 
    shadow-lg shadow-red-500/50 
    hover:from-[#D32F2F] hover:to-[#FF5252] 
    hover:scale-105 transform transition duration-300
    focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
  "
>
  {loading ? "Entrando..." : "Entrar"}
</button>
  </form>
</div>
    </div>
  );
}


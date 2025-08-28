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
  const [userName, setUserName] = useState<string | null>(null);

    // Função para buscar usuário e foto ao digitar e-mail
  // Função para buscar usuário e foto ao digitar e-mail
const fetchUserPhoto = async (emailInput: string) => {
  console.log("fetchUserPhoto chamado com email:", emailInput);

  if (!emailInput) {
    console.log("Email vazio, limpando foto");
    setUserPhoto(null);
     setUserName(null);
    return;
  }

  try {
    // 1️⃣ Buscar usuário no banco
    const { data: userData, error } = await supabase
      .from("profiles") // ou sua tabela de usuários
      .select("id, nome") // agora pegamos também o nome
       .eq("email", emailInput.trim().toLowerCase())
      .single();

    if (error) {
      console.error("Erro ao buscar usuário:", error);
      setUserPhoto(null);
      setUserName(null);
      return;
    }

    if (!userData) {
      console.log("Nenhum usuário encontrado para esse email");
      setUserPhoto(null);
      setUserName(null);
      return;
    }

    const userId = userData.id;
    const userNome = userData.nome;
    console.log("Usuário encontrado, ID:", userId, "Nome:", userNome);
        // Atualiza o estado do nome
    setUserName(userNome);

    // 2️⃣ Tentar buscar a imagem do Storage
    const formats = ["jpg", "jpeg", "png"];
    let photoUrl: string | null = null;

    for (const ext of formats) {
      const { data } = supabase.storage
        .from("fotoperfil")
        .getPublicUrl(`${userId}.${ext}`);

      console.log(`Tentando foto: ${userId}.${ext} → URL:`, data?.publicUrl);

      if (data?.publicUrl) {
        // Verifica se o arquivo existe
        const res = await fetch(data.publicUrl, { method: "HEAD" });
        console.log(`HEAD request para ${data.publicUrl}: status ${res.status}`);
        if (res.ok) {
          photoUrl = data.publicUrl;
          console.log("Foto encontrada:", photoUrl);
          break;
        }
      }
    }

    if (!photoUrl) {
      console.log("Nenhuma foto encontrada, usando fallback");
    }

    setUserPhoto(photoUrl || null);
  } catch (err) {
    console.error("Erro ao buscar foto do usuário:", err);
    setUserPhoto(null);
        setUserPhoto(null);
    setUserName(null);
  }
};



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
{/* Lado direito moderno com gradiente leve */}
{/* Lado direito moderno com gradiente leve */}
<div className="flex-1 flex flex-col justify-center items-center px-12 py-16 bg-gradient-to-b from-white to-gray-100">
  
  {/* Foto do usuário no topo */}
  <img
    src={userPhoto || "/img.png"}
    alt="Foto do usuário"
    className="w-50 h-50 rounded-full mb-8 shadow-xl object-cover"
  />

{/* Título principal */}
<h2 className="text-3xl font-medium text-gray-900 text-center mb-3">
  Seja bem-vindo
  {userName && (
    <span className="text-gray-600 text-3xl ml-2 font-medium">{`, ${userName}`}!</span>
  )}
  
</h2>
  {/* Subtítulo com referência à intranet */}
  <p className="text-gray-500 text-center mb-10">
    À intranet da <span className="font-semibold text-gray-700">12TEC</span>
  </p>

    <p className="text-gray-500 text-center mb-10">
    Coloque seu <span className="font-semibold text-gray-700">e-mail</span> e <span className="font-semibold text-gray-700">senha</span>
  </p>

  {/* Formulário */}
  <form className="w-full max-w-md space-y-6" onSubmit={handleLogin}>
    <div className="relative">
      <input
        type="email"
        placeholder="E-mail"
        value={email}
                    onChange={(e) => {
              setEmail(e.target.value);
              fetchUserPhoto(e.target.value);
            }}
        className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-md transition duration-300"
      />
    </div>

    <div className="relative">
      <input
        type={passwordVisible ? "text" : "password"}
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-md transition duration-300"
      />
      <button
        type="button"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
        onClick={() => setPasswordVisible(!passwordVisible)}
      >
        {passwordVisible ? "Ocultar" : "Mostrar"}
      </button>
    </div>

    {error && <p className="text-red-600 text-center">{error}</p>}

    <button
      type="submit"
      disabled={loading}
      className="
        w-full py-3 
        bg-gray-900 
        text-white font-medium rounded-2xl 
        shadow-lg 
        hover:bg-gray-800 
        transition-colors duration-200 
        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
      "
    >
      {loading ? "Entrando..." : "Entrar"}
    </button>
  </form>
</div>


    </div>
  );
}


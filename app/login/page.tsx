'use client';
import '../styles.css';
import msalInstance from "@/lib/msalConfig";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        setError("Erro ao entrar! Verifique suas credenciais.");
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
    <div className="background-tela">
      <div className="LinhaSuperior">
        <div className="_12-tec">12 TEC</div>
        <div className="gerenciamento-de-compras">INTRANET</div>
      </div>
      <div className="Meiuca">
        <div className="lado-esquerdo"></div>
        <div className="lado-direito">
          <div className="InfosLadoDireito">
            <div className="log-in">Log in</div>
            <form className="inputs" onSubmit={handleLogin}>
              <div className="input-container">
                <div className="input-wrapper">
                  <img src="../usuarioIcon.png" alt="Usuário" className="user-icon-left" />
                  <input
                    type="email"
                    placeholder="Usuário..."
                    className="senha-input"
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
                <hr className="input-line-usuario" />
              </div>

              <div className="input-container">
                <div className="input-wrapper">
                  <img src="../cadeadoIcon.png" alt="Senha" className="senha-icon-left" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Digite a senha..."
                    className="senha-input"
                    onChange={e => setPassword(e.target.value)}
                    value={password}
                  />
                  <img
                    src="../olhoIcon.png"
                    alt="Mostrar senha"
                    className="senha-icon-right"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  />
                </div>
                <hr className="input-line" />
              </div>

              {error && <p className="text-red-500">{error}</p>}

              <button className="botao-entrar" type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import '../styles.css';
import msalInstance from "@/lib/msalConfig"; // o arquivo que inicializa o MSAL

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Para armazenar erros
  const [passwordVisible, setPasswordVisible] = useState(false); // Para alternar a visibilidade da senha
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  


const loginMSAL = async () => {
  try {
    await msalInstance.initialize();

    const accounts = msalInstance.getAllAccounts();

    if (accounts.length === 0) {
      await msalInstance.loginPopup({
        scopes: ["Files.ReadWrite", "User.Read"],
      });
    }
  } catch (error) {
    console.error("Erro no login Microsoft:", error);
    // ⛔ Repassa o erro para a função que chamou
    throw new Error("Falha no login Microsoft");
  }
};

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (loading) return;

  setLoading(true);
  const supabase = createClientComponentClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Erro ao entrar! Verifique suas credenciais.");
      return;
    }

    // 🔐 LOGIN MICROSOFT AQUI
    try {
      await loginMSAL();
    } catch (msalError) {
      setError("Erro ao fazer login com Microsoft. Tente novamente.");
      return; // ⛔ Não continua para o dashboard
    }

    setError("");
    router.refresh();
    router.push("/dashboard");

  } catch (err) {
    setError("Erro desconhecido. Tente novamente.");
    console.error(err);
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
                    type="email" // Mudança para 'email' para validação automática
                    placeholder="Usuário..."
                    className="senha-input"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
                <hr className="input-line-usuario" />
              </div>

              <div className="input-container">
                <div className="input-wrapper">
                  <img src="../cadeadoIcon.png" alt="Senha" className="senha-icon-left" />
                  <input
                    type={passwordVisible ? "text" : "password"} // Alterna entre visível e oculta
                    placeholder="Digite a senha..."
                    className="senha-input"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                  <img
                    src="../olhoIcon.png"
                    alt="Mostrar senha"
                    className="senha-icon-right"
                    onClick={() => setPasswordVisible(!passwordVisible)} // Alterna a visibilidade ao clicar
                  />
                </div>
                <hr className="input-line" />
              </div>


              {error && <p className="text-red-500">{error}</p>} {/* Exibir erro, se houver */}

              <button className="botao-entrar" type="submit">Entrar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

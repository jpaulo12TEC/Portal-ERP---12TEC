// lib/auth.ts
import msalInstance from "@/lib/msalConfig";

export const getAccessToken = async (): Promise<string | null> => {
  // Inicializa MSAL se existir initialize
  if (typeof msalInstance.initialize === "function") {
    await msalInstance.initialize();
  }

  // 1️⃣ Processa redirect se houver
  try {
    const redirectResult = await msalInstance.handleRedirectPromise();
    if (redirectResult?.account) {
      console.log("MSAL login via redirect concluído:", redirectResult.account);
    }
  } catch (err) {
    console.warn("Erro processando redirect MSAL:", err);
  }

  // 2️⃣ Verifica contas logadas
  let accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    console.warn("Nenhuma conta logada. Tentando login via popup...");
    try {
      await msalInstance.loginPopup({
        scopes: ["Files.ReadWrite", "User.Read"],
      });
      accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) return null;
    } catch (popupLoginErr) {
      console.error("Erro login popup MSAL:", popupLoginErr);
      return null;
    }
  }

  const account = accounts[0];

  // 3️⃣ Tenta pegar token silencioso
  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      account,
      scopes: ["Files.ReadWrite", "User.Read"],
    });
    return tokenResponse.accessToken;
  } catch (silentErr: any) {
    console.warn("Token silent falhou:", silentErr);

    if (silentErr.errorCode === "interaction_in_progress") {
      console.warn("Interação já em andamento. Aguarde.");
      return null;
    }

    // 4️⃣ Tenta popup se silent falhar
    try {
      const popupToken = await msalInstance.acquireTokenPopup({
        scopes: ["Files.ReadWrite", "User.Read"],
      });
      return popupToken.accessToken;
    } catch (popupErr) {
      console.error("Erro ao adquirir token via popup:", popupErr);
      return null;
    }
  }
};


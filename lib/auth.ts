// lib/auth.js
import msalInstance from "./msalConfig";

export async function getAccessToken() {
  await msalInstance.initialize(); // evita erro de "uninitialized"

  let accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    try {
      await msalInstance.loginPopup({
        scopes: ["Files.ReadWrite", "User.Read"],
      });
      accounts = msalInstance.getAllAccounts();
    } catch (err) {
      console.error("Erro no login:", err);
      return null;
    }
  }

  const response = await msalInstance.acquireTokenSilent({
    scopes: ["Files.ReadWrite", "User.Read"],
    account: accounts[0],
  });

  return response.accessToken;
}
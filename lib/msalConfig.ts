// lib/msal.ts
import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "a7383e84-46a2-49eb-8f21-953a7b9e24dd",
    authority: "https://login.microsoftonline.com/73df9aea-8a0d-4f03-a71d-339f8816d836",
    redirectUri: "https://intranet12tec.vercel.app/dashboard", // ou sua URL se for diferente
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Você pode chamar isso no login, ou logo na inicialização do app (ex: _app.tsx)
export async function initializeMsal() {
  await msalInstance.initialize(); // ESSA LINHA É IMPORTANTE!
}

export default msalInstance;
// pages/api/onedrive/download.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAppToken } from "@/lib/oneDrive";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL do arquivo é obrigatória" });
    }

    // Pega token de app do Azure
    const token = await getAppToken();

    // Extrair caminho relativo do SharePoint da URL pública
    // Ex.: /sites/Documentao-12TECEngenharia/Documentos Compartilhados/Recursos Humanos/...
    const sharepointPath = new URL(url).pathname;

    // Encode no formato para Graph API
    const encodedPath = encodeURIComponent(sharepointPath);

    // Monta endpoint Graph API para baixar conteúdo
    const graphUrl = `https://graph.microsoft.com/v1.0/sites/root:${encodedPath}:/content`;

    const response = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao baixar arquivo do SharePoint via Graph:", text);
      return res.status(500).json({ error: "Erro ao baixar arquivo via Graph API" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extrai nome do arquivo da URL
    const parts = sharepointPath.split("/");
    const filename = parts[parts.length - 1] || "documento.pdf";

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("Erro interno na API de download:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}

// pages/api/download.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getAppToken } from "@/lib/oneDrive";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL do arquivo é obrigatória" });
    }

    // Pega token de app do Azure
    const token = await getAppToken();

    // Faz fetch para a URL do SharePoint/OneDrive usando token Bearer
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao baixar arquivo do SharePoint:", text);
      return res.status(500).json({ error: "Erro ao baixar arquivo" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extrai nome do arquivo da URL
    const parts = url.split("/");
    const filename = parts[parts.length - 1] || "documento";

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}

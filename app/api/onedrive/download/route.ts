// app/api/onedrive/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAppToken } from "@/lib/oneDrive";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "URL do arquivo é obrigatória" }, { status: 400 });

    const token = await getAppToken();

    const sharepointPath = new URL(url).pathname;
    const encodedPath = encodeURIComponent(sharepointPath);
    const graphUrl = `https://graph.microsoft.com/v1.0/sites/root:${encodedPath}:/content`;

    const response = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao baixar arquivo do SharePoint via Graph:", text);
      return NextResponse.json({ error: "Erro ao baixar arquivo via Graph API" }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parts = sharepointPath.split("/");
    const filename = parts[parts.length - 1] || "documento.pdf";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Erro interno na API de download:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

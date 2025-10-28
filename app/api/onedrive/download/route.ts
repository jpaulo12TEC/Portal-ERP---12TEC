// app/api/onedrive/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAppToken } from "@/lib/oneDrive";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "URL do arquivo é obrigatória" }, { status: 400 });

    const token = await getAppToken();

    // Fetch direto do SharePoint/OneDrive
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao baixar arquivo do SharePoint:", text);
      return NextResponse.json({ error: "Erro ao baixar arquivo" }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parts = url.split("/");
    const filename = parts[parts.length - 1] || "documento.pdf";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

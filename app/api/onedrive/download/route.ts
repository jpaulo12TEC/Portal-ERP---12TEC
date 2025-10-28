import { NextRequest, NextResponse } from "next/server";

// Pega token do cookie
function getAzureToken(req: NextRequest) {
  return req.cookies.get("azure_token")?.value;
}

export async function GET(req: NextRequest) {
  const fileUrl = req.nextUrl.searchParams.get("url");
  if (!fileUrl) {
    return NextResponse.json({ error: "URL do arquivo é obrigatória" }, { status: 400 });
  }

  const token = getAzureToken(req);

  if (!token) {
    // Retorna 401 para o frontend saber que precisa redirecionar
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    // Faz proxy para o SharePoint usando o token do usuário
    const res = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Erro ao baixar do SharePoint:", text);
      return NextResponse.json({ error: "Falha ao baixar arquivo", details: text }, { status: 500 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parts = fileUrl.split("/");
    const filename = parts[parts.length - 1] || "documento";

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

// app/api/onedrive/upload/route.ts
import { NextResponse } from "next/server";
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { getAppToken } from "@/lib/oneDrive";

export const POST = async (req: Request) => {
  try {
    console.log("📥 Iniciando upload para OneDrive...");

    // 1️⃣ Tenta pegar token do usuário
    let token = req.headers.get("authorization")?.replace("Bearer ", "");
    console.log("🔑 Token do header:", token ? "presente" : "ausente");

    // 2️⃣ Se não existir, pega token do app (backend)
    if (!token) {
      console.log("⚡ Token de usuário ausente, buscando token do app...");
      token = await getAppToken();
      console.log("🔑 Token do app:", token ? "obtido" : "não obtido");

      if (!token) {
        console.error("❌ Nenhum token disponível.");
        return NextResponse.json(
          { error: "Token do Azure não encontrado." },
          { status: 401 }
        );
      }
    }

    // 3️⃣ Parsear FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileName = formData.get("fileName") as string | null;
    const dataCompra = formData.get("dataCompra") as string | null;
    const fornecedor = formData.get("fornecedor") as string | null;
    const tipo = (formData.get("tipo") as string) || "compras";
    const caminho = formData.get("caminho") as string | undefined;

    console.log("📄 Parâmetros recebidos:");
    console.log("file:", file);
    console.log("fileName:", fileName);
    console.log("dataCompra:", dataCompra);
    console.log("fornecedor:", fornecedor);
    console.log("tipo:", tipo);
    console.log("caminho:", caminho);

    // Checagem detalhada de cada parâmetro
    if (!file) return NextResponse.json({ error: "Arquivo 'file' ausente." }, { status: 400 });
    if (!fileName) return NextResponse.json({ error: "Parâmetro 'fileName' ausente." }, { status: 400 });
    if (!dataCompra) return NextResponse.json({ error: "Parâmetro 'dataCompra' ausente." }, { status: 400 });
    if (!fornecedor) return NextResponse.json({ error: "Parâmetro 'fornecedor' ausente." }, { status: 400 });

    // 4️⃣ Chamar função de upload com token
    console.log("🚀 Enviando arquivo para OneDrive...");
    const uploaded = await uploadFileToOneDrive(
      token,
      file,
      fileName,
      dataCompra,
      fornecedor,
      tipo as any,
      caminho
    );

    if (!uploaded?.url) {
      console.error("❌ Upload falhou, sem URL retornada.");
      return NextResponse.json({ error: "Erro ao fazer upload no OneDrive." }, { status: 500 });
    }

    console.log("✅ Upload concluído:", uploaded.url);

    // 5️⃣ Retornar sucesso com URL do arquivo
    return NextResponse.json({ success: true, file: uploaded });
  } catch (err) {
    console.error("💥 Erro inesperado na rota /api/onedrive/upload:", err);
    return NextResponse.json({ error: "Erro inesperado no servidor." }, { status: 500 });
  }
};
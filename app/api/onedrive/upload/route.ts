// app/api/onedrive/upload/route.ts
import { NextResponse } from "next/server";
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { getAppToken } from "@/lib/oneDrive"; // função para pegar token do app

export const POST = async (req: Request) => {
  try {
    // 1️⃣ Tenta pegar token do usuário
    let token =
      req.headers.get("authorization")?.replace("Bearer ", "") 
      

    // 2️⃣ Se não existir, pega token do app (backend)
    if (!token) {
      token = await getAppToken();
      if (!token) {
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

    if (!file || !fileName || !dataCompra || !fornecedor) {
      return NextResponse.json(
        { error: "Parâmetros insuficientes." },
        { status: 400 }
      );
    }

    // 4️⃣ Chamar função de upload com token
    const uploaded = await uploadFileToOneDrive(
      token,       // <- accessToken do Azure
      file,
      fileName,
      dataCompra,
      fornecedor,
      tipo as any,
      caminho
    );

    if (!uploaded?.url) {
      return NextResponse.json(
        { error: "Erro ao fazer upload." },
        { status: 500 }
      );
    }

    // 5️⃣ Retornar sucesso com URL do arquivo
    return NextResponse.json({ success: true, file: uploaded });

  } catch (err) {
    console.error("Erro na rota /api/onedrive/upload:", err);
    return NextResponse.json(
      { error: "Erro inesperado no servidor." },
      { status: 500 }
    );
  }
};

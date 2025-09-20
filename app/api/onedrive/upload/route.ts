// app/api/onedrive/upload/route.ts
import { NextResponse } from "next/server";
import { uploadFileToOneDrive } from "@/lib/uploadFileToOneDrive";
import { getAppToken } from "@/lib/oneDrive";

export const POST = async (req: Request) => {
  try {
    console.log("Iniciando upload...");

    // 1️⃣ Pega token do usuário
    let token = req.headers.get("authorization")?.replace("Bearer ", "");
    console.log("Token inicial:", token ? "Presente" : "Ausente");

    // 2️⃣ Se não existir, pega token do app
    if (!token) {
      token = await getAppToken();
      console.log("Token do app:", token ? "Presente" : "Ausente");
      if (!token) {
        console.error("Token não encontrado");
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

    console.log("FormData recebida:", {
      file: file?.name,
      fileName,
      dataCompra,
      fornecedor,
      tipo,
      caminho,
    });

    if (!file || !fileName || !dataCompra || !fornecedor) {
      console.error("Parâmetros insuficientes:", {
        file,
        fileName,
        dataCompra,
        fornecedor,
      });
      return NextResponse.json(
        { error: "Parâmetros insuficientes." },
        { status: 400 }
      );
    }

    // 4️⃣ Chamar função de upload
    const uploaded = await uploadFileToOneDrive(
      token,
      file,
      fileName,
      dataCompra,
      fornecedor,
      tipo as any,
      caminho
    );

    console.log("Resultado do upload:", uploaded);

    if (!uploaded?.url) {
      console.error("Erro ao fazer upload:", uploaded);
      return NextResponse.json(
        { error: "Erro ao fazer upload." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, file: uploaded });
  } catch (err) {
    console.error("Erro inesperado em /api/onedrive/upload:", err);
    return NextResponse.json(
      { error: "Erro inesperado no servidor." },
      { status: 500 }
    );
  }
};
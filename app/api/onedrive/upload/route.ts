// app/api/onedrive/upload/route.ts
import { NextResponse } from "next/server";
import { uploadFileToOneDrive} from "@/lib/uploadFileToOneDrive";

// Como vamos receber FormData no Next.js 14+, precisamos parsear manualmente
export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const fileName = formData.get("fileName") as string | null;
    const dataCompra = formData.get("dataCompra") as string | null;
    const fornecedor = formData.get("fornecedor") as string | null;
    const tipo = (formData.get("tipo") as string) || "compras";
    const caminho = formData.get("caminho") as string | undefined;

    if (!file || !fileName || !dataCompra || !fornecedor) {
      return NextResponse.json({ error: "Parâmetros insuficientes." }, { status: 400 });
    }

    const uploaded = await uploadFileToOneDrive(file, fileName, dataCompra, fornecedor, tipo as any, caminho);

    if (!uploaded) {
      return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: uploaded });
  } catch (err) {
    console.error("Erro na rota /api/onedrive/upload:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
};

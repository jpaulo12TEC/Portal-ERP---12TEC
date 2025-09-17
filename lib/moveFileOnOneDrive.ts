// lib/moveFileOnOneDrive.ts
import axios from "axios";

export async function moveFileOnOneDrive(
  accessToken: string,
  fileIdOrUrl: string,
  tipo:
    | "formularios"
    | "compras"
    | "contratos"
    | "romaneio"
    | "romaneio-itens"
    | "orçamentos-contratos"
    | "cadastro-fornecedor"
    | "cadastro-fornecedor-servico" = "formularios"
): Promise<void> {
  try {
    let itemId = fileIdOrUrl;

    // Se vier uma URL, extrai o itemId
    if (fileIdOrUrl.includes("items/")) {
      const match = fileIdOrUrl.match(/items\/([^?]+)/);
      if (!match) throw new Error("Não foi possível extrair itemId do OneDrive.");
      itemId = match[1];
    }

    // Define o caminho de destino dependendo do tipo
    const destinoPath =
      tipo === "formularios"
        ? "Modelos e Formularios/Formularios/Não Vigentes"
        : tipo === "compras"
        ? "Financeiro/Compras/Notas Fiscais/Não Vigentes"
        : tipo === "contratos"
        ? "Financeiro/Contratos/Não Vigentes"
        : tipo === "romaneio"
        ? "Logistica/Romaneios/Não Vigentes"
        : tipo === "romaneio-itens"
        ? "Logistica/Romaneios/Fotos dos itens/Não Vigentes"
        : tipo === "orçamentos-contratos"
        ? "Financeiro/Orçamentos/Contratos/Não Vigentes"
        : tipo === "cadastro-fornecedor"
        ? "Fornecedores/Serviços/Dados Cadastrais/Não Vigentes"
        : tipo === "cadastro-fornecedor-servico"
        ? "Fornecedores/Serviços/Orçamentos/Não Vigentes"
        : "Arquivos/Não Vigentes";

    // Verifica/cria pasta de destino
    const folderRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${destinoPath}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let folderData = await folderRes.json();

    if (folderData.error) {
      // cria a pasta se não existir
      const parentPath = destinoPath.substring(0, destinoPath.lastIndexOf("/"));
      const folderName = destinoPath.split("/").pop();

      const createRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${parentPath}:/children`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "replace",
          }),
        }
      );

      folderData = await createRes.json();
    }

    // Faz PATCH para mover o arquivo
    await axios.patch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`,
      {
        parentReference: { id: folderData.id },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log(`✅ Arquivo movido para ${destinoPath}`);
  } catch (err) {
    console.error("❌ Erro ao mover arquivo no OneDrive:", err);
    throw err;
  }
}

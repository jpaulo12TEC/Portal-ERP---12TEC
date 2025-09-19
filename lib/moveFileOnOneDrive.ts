
import { getAppToken } from './oneDrive';
import axios from 'axios';

export async function moveFileOnOneDrive(
  
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
) {
  try {
    const accessToken = await getAppToken();
    let itemId = fileIdOrUrl;

    if (fileIdOrUrl.includes("items/")) {
      const match = fileIdOrUrl.match(/items\/([^?]+)/);
      if (!match) throw new Error("Não foi possível extrair itemId do OneDrive.");
      itemId = match[1];
    }

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

    const graphBase = "https://graph.microsoft.com/v1.0/users/compras@12tec.com.br/drive";

    // Garante que a pasta de destino exista
    async function ensureFolderPath(path: string): Promise<string> {
      const pathParts = path.split("/");
      let parentId = "root";
      for (const folderName of pathParts) {
        const checkRes = await fetch(`${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const checkData = await checkRes.json();
        const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);
        if (existingFolder) parentId = existingFolder.id;
        else {
          const createRes = await fetch(`${graphBase}/items/${parentId}/children`, {
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
          });
          const created = await createRes.json();
          parentId = created.id;
        }
      }
      return parentId;
    }

    const pastaDestinoId = await ensureFolderPath(destinoPath);

    // Move o arquivo
    await axios.patch(
      `${graphBase}/items/${itemId}`,
      { parentReference: { id: pastaDestinoId } },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`Arquivo movido para ${destinoPath}`);
  } catch (err) {
    console.error("Erro ao mover arquivo:", err);
    throw err;
  }
}

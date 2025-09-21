import axios from "axios";

/**
 * Move um arquivo para uma subpasta dentro da mesma pasta atual no OneDrive
 * @param accessToken Token de acesso do OneDrive
 * @param fileIdOrUrl Id ou URL do arquivo a ser movido
 * @param subFolderName Nome da subpasta onde o arquivo será movido (cria se não existir)
 */
export async function moveFileOnOneDrive(
  accessToken: string,
  fileIdOrUrl: string,
  subFolderName: string = "Nao Vigentes"
) {
  try {
    // Extrai itemId se foi passada a URL
    let itemId = fileIdOrUrl;
    if (fileIdOrUrl.includes("items/")) {
      const match = fileIdOrUrl.match(/items\/([^?]+)/);
      if (!match) throw new Error("Não foi possível extrair itemId do OneDrive.");
      itemId = match[1];
    }

    // Pega pasta atual do arquivo
    const graphBase = `https://graph.microsoft.com/v1.0/drives/${process.env.ONEDRIVE_DRIVE_ID}`;
    const fileRes = await fetch(`${graphBase}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const fileData = await fileRes.json();
    const parentId = fileData.parentReference?.id;
    if (!parentId) throw new Error("Não foi possível identificar a pasta atual do arquivo.");

    // Função auxiliar para garantir que a subpasta existe dentro da pasta atual
    async function ensureSubfolder(parentId: string, folderName: string): Promise<string> {
      const checkRes = await fetch(
        `${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkData = await checkRes.json();
      const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);
      if (existingFolder) return existingFolder.id;

      // Cria a subpasta se não existir
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
      return created.id;
    }

    const subfolderId = await ensureSubfolder(parentId, subFolderName);

    // Move o arquivo para a subpasta
    await axios.patch(
      `${graphBase}/items/${itemId}`,
      { parentReference: { id: subfolderId } },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`Arquivo movido para a subpasta "${subFolderName}" dentro da pasta atual.`);
  } catch (err) {
    console.error("Erro ao mover arquivo:", err);
    throw err;
  }
}
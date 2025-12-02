import axios from "axios";

/**
 * Move um arquivo no OneDrive/SharePoint, aceitando itemId ou URL
 * Subpasta "Nao Vigentes" será criada se não existir
 */
export async function moveFileOnOneDrive(
  accessToken: string,
  fileIdOrUrl: string,
  subFolderName: string = "Nao Vigentes"
) {
  try {
    const tenantId = "73df9aea-8a0d-4f03-a71d-339f8816d836"; // tenant fixo
    let itemId = "";

    // 1️⃣ Se já é itemId
    if (!fileIdOrUrl.startsWith("http")) {
      itemId = fileIdOrUrl;
    } else {
      const url = new URL(fileIdOrUrl);
      const fullPath = decodeURIComponent(url.pathname); // caminho completo do arquivo

      // 2️⃣ Obter siteId do SharePoint via tenantId + URL
      const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${tenantId}:${fullPath}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const siteData = await siteRes.json();
      if (!siteData.id) throw new Error("Não foi possível obter siteId do SharePoint.");
      const siteId = siteData.id;

      // 3️⃣ Pega driveId principal do site
      const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const driveData = await driveRes.json();
      if (!driveData.id) throw new Error("Não foi possível obter driveId do site.");
      const driveId = driveData.id;

      // 4️⃣ Resolve itemId pelo caminho completo
      const relativePath = fullPath.replace(/^\/sites\/[^/]+/, "").replace(/^\/+/g, "");
      const itemRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURI(relativePath)}:`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const itemData = await itemRes.json();
      if (!itemData.id) throw new Error("Não foi possível resolver itemId da URL.");
      itemId = itemData.id;
    }

    const graphBase = `https://graph.microsoft.com/v1.0/drives/${process.env.ONEDRIVE_DRIVE_ID}`;

    // 5️⃣ Pega pasta atual do arquivo
    const fileRes = await fetch(`${graphBase}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const fileData = await fileRes.json();
    const parentId = fileData.parentReference?.id;
    if (!parentId) throw new Error("Não foi possível identificar a pasta atual do arquivo.");

    // 6️⃣ Garante que a subpasta existe
    async function ensureSubfolder(parentId: string, folderName: string): Promise<string> {
      const checkRes = await fetch(
        `${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const checkData = await checkRes.json();
      const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);
      if (existingFolder) return existingFolder.id;

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

    // 7️⃣ Move arquivo
    await axios.patch(
      `${graphBase}/items/${itemId}`,
      { parentReference: { id: subfolderId } },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`Arquivo movido para a subpasta "${subFolderName}".`);
  } catch (err) {
    console.error("Erro ao mover arquivo:", err);
    throw err;
  }
}

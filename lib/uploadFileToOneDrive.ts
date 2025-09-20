export async function uploadFileToOneDrive(
  accessToken: string,
  file: File,
  fileName: string,
  dataCompra: string,
  fornecedor: string,
  tipo: string,
  caminho?: string
): Promise<{ id: string; url: string } | null> {
  try {
    console.log("Iniciando upload para OneDrive:", { fileName, dataCompra, fornecedor, tipo, caminho });

    const graphBase = `https://graph.microsoft.com/v1.0/drives/${process.env.ONEDRIVE_DRIVE_ID}`;
    const [ano, mesStr, dia] = dataCompra.split("-");
    const mes = mesStr.padStart(2, "0");
    const diaSanitizado = dia.replace(/[<>:\"/\\|?*]/g, "").trim();
    const fornecedorSanitizado = fornecedor.replace(/[<>:\"/\\|?*]/g, "").trim();

    const caminhoPastas =
      tipo === "financeiroboletos"
        ? ["Financeiro", "Compras", "Boletos", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`]
        : tipo === "financeiro"
        ? ["Financeiro", "Compras", "Comprovantes", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`]
        : tipo === "formularios"
        ? ["Modelos e Formularios", "Formularios"]
        : tipo === "compras"
        ? ["Financeiro", "Compras", "Notas Fiscais", fornecedorSanitizado, ano, mes]
        : tipo === "romaneio"
        ? ["Logistica", "Romaneios", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`]
        : tipo === "romaneio-itens"
        ? ["Logistica", "Romaneios", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`, "Fotos dos itens"]
        : tipo === "contratos"
        ? ["Financeiro", "Contratos", fornecedorSanitizado, `${ano}_${mes}_${caminho}`]
        : tipo === "cadastro-fornecedor-compras"
        ? ["Suprimentos","Fornecedores", "Materiais e Equipamentos", fornecedorSanitizado, "Dados Cadastrais"]
        : tipo === "cadastro-fornecedor"
        ? ["Suprimentos","Fornecedores", "Serviços", fornecedorSanitizado, "Dados Cadastrais"]
        : tipo === "cadastro-fornecedor-servico"
        ? ["Suprimentos","Fornecedores", "Serviços", fornecedorSanitizado, "Orçamentos", caminho ?? ""]
        : tipo === "pedido_de_compra"
        ? ["Suprimentos","Fornecedores", "Compras", fornecedorSanitizado, "Orçamentos", `${ano}_${mes}_${diaSanitizado}`]
        : tipo === "orçamentos-contratos"
        ? ["Financeiro", "Orçamentos", "Contratos", fornecedorSanitizado]
        : [];

    console.log("Caminho de pastas no OneDrive:", caminhoPastas);

    async function ensureFolderPath(pathParts: string[]): Promise<string> {
      let parentId = "root";
      for (const folderName of pathParts) {
        console.log("Verificando pasta:", folderName, "em parentId:", parentId);
        const checkRes = await fetch(`${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const checkData = await checkRes.json();
        console.log("CheckData:", checkData);
        const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);
        if (existingFolder) {
          parentId = existingFolder.id;
          console.log("Pasta já existe, usando id:", parentId);
        } else {
          console.log("Criando pasta:", folderName);
          const createRes = await fetch(`${graphBase}/items/${parentId}/children`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: folderName,
              folder: {},
              "@microsoft.graph.conflictBehavior": "rename",
            }),
          });
          const created = await createRes.json();
          console.log("Pasta criada:", created);
          parentId = created.id;
        }
      }
      return parentId;
    }

    const pastaDestinoId = await ensureFolderPath(caminhoPastas);
    console.log("ID da pasta destino:", pastaDestinoId);

    if (file.size < 4 * 1024 * 1024) {
      console.log("Arquivo pequeno, upload direto (<4MB)");
      const uploadUrl = `${graphBase}/items/${pastaDestinoId}:/${fileName}:/content`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        console.error("Erro no upload direto:", text);
        throw new Error(text);
      }
      const uploadedFile = await uploadResponse.json();
      console.log("Upload concluído (pequeno):", uploadedFile);
      return { id: uploadedFile.id, url: uploadedFile.webUrl };
    }

    console.log("Arquivo grande, criando upload session (>4MB)");
    const sessionRes = await fetch(`${graphBase}/items/${pastaDestinoId}:/${fileName}:/createUploadSession`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }),
    });
    if (!sessionRes.ok) {
      const text = await sessionRes.text();
      console.error("Erro criando upload session:", text);
      throw new Error(text);
    }
    const sessionData = await sessionRes.json();
    const uploadUrl = sessionData.uploadUrl;
    console.log("Upload session criada:", uploadUrl);

    const chunkSize = 5 * 1024 * 1024;
    let start = 0;
    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      console.log(`Enviando chunk bytes ${start}-${end - 1}`);
      const chunkRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
        },
        body: chunk,
      });
      if (!chunkRes.ok && chunkRes.status !== 202 && chunkRes.status !== 201) {
        const text = await chunkRes.text();
        console.error("Erro no upload de chunk:", text);
        throw new Error(text);
      }
      start = end;
    }

    console.log("Upload completo, buscando info do arquivo...");
    const fileRes = await fetch(uploadUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const uploadedFile = await fileRes.json();
    console.log("Arquivo final:", uploadedFile);

    return { id: uploadedFile.id, url: uploadedFile.webUrl };

  } catch (err: any) {
    console.error("Erro ao enviar arquivo:", err);
    return null;
  }
}
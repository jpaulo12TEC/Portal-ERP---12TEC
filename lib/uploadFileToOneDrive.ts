export async function uploadFileToOneDrive(
  accessToken: string,
  file: File,
  fileName: string,
  dataCompra: string,
  fornecedor: string,
  tipo: "cadastro-fornecedor-servico" | "cadastro-fornecedor" | "formularios" |"financeiro" | "financeiroboletos" | "orçamentos-contratos" | "romaneio-itens" | "romaneio" | "compras" | "contratos"  = "compras", // padrão compras
  caminho?: string
): Promise<{ id: string; url: string } | null> {
  const graphBase = "https://graph.microsoft.com/v1.0/users/compras@12tec.com.br/drive";

  try {
    console.log("🔁 Iniciando montagem do caminho de pastas...");

    const [ano, mesStr, dia] = dataCompra.split("-");
    const mes = mesStr.padStart(2, "0");
    const diaSanitizado = dia.replace(/[<>:\"/\\|?*]/g, "").trim();
    const fornecedorSanitizado = fornecedor.replace(/[<>:\"/\\|?*]/g, "").trim();

    // Monta caminho
    const caminhoPastas = 
      tipo === "financeiroboletos" ? ["Financeiro", "Compras", "Boletos", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`] :
      tipo === "financeiro" ? ["Financeiro", "Compras", "Comprovantes", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`] :
      tipo === "formularios" ? ["Modelos e Formularios", "Formularios"] :
      tipo === "compras" ? ["Financeiro", "Compras", "Notas Fiscais", fornecedorSanitizado, ano, mes ] :
      tipo === "romaneio" ? ["Logistica", "Romaneios", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`] :
      tipo === "romaneio-itens" ? ["Logistica", "Romaneios", `${ano}_${mes}_${diaSanitizado}_${fornecedorSanitizado}`, "Fotos dos itens"] :
      tipo === "contratos" ? ["Financeiro", "Contratos", fornecedorSanitizado, `${ano}_${mes}_${caminho}`] :
      tipo === "cadastro-fornecedor" ? ["Fornecedores", "Serviços", fornecedorSanitizado, "Dados Cadastrais"] :
      tipo === "cadastro-fornecedor-servico" ? ["Fornecedores", "Serviços", fornecedorSanitizado, "Orçamentos", caminho ?? ""] :
      tipo === "orçamentos-contratos" ? ["Financeiro", "Orçamentos", "Contratos", ano, mes, fornecedorSanitizado] :
      [];

    // Garante que as pastas existem
    async function ensureFolderPath(pathParts: string[]): Promise<string> {
      let parentId = "root";

      for (const folderName of pathParts) {
        const checkRes = await fetch(`${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const checkData = await checkRes.json();
        const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);

        if (existingFolder) {
          parentId = existingFolder.id;
        } else {
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
          parentId = created.id;
        }
      }

      return parentId;
    }

    const pastaDestinoId = await ensureFolderPath(caminhoPastas);

    // Upload do arquivo
    const uploadUrl = `${graphBase}/items/${pastaDestinoId}:/${fileName}:/content`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      console.error("❌ Erro ao fazer upload:", await uploadResponse.text());
      return null;
    }

    const uploadedFile = await uploadResponse.json();
    const itemId = uploadedFile.id; // <-- pegamos o ID interno do arquivo

    // Gera link público
    const linkResponse = await fetch(`${graphBase}/items/${itemId}/createLink`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "view", scope: "anonymous" }),
    });

    if (!linkResponse.ok) {
      console.error("❌ Erro ao gerar link público:", await linkResponse.text());
      return null;
    }

    const linkData = await linkResponse.json();
    return { id: itemId, url: linkData.link.webUrl };

  } catch (err: any) {
    console.error("💥 Erro inesperado:", err);
    return null;
  }
}

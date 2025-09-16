export async function uploadFileToOneDrive(
  accessToken: string,
  file: File,
  fileName: string,
  dataCompra: string,
  fornecedor: string,
  tipo: "cadastro-fornecedor-servico" | "cadastro-fornecedor" |"orçamentos-contratos" | "romaneio-itens" | "romaneio" |"compras" | "contratos"  = "compras", // padrão compras
  caminho?: string // agora é opcional
): Promise<string | null> {
  const graphBase = "https://graph.microsoft.com/v1.0/users/compras@12tec.com.br/drive";

  try {
    console.log("🔁 Iniciando montagem do caminho de pastas...");

    const [ano, mesStr, dia] = dataCompra.split("-");
    const mes = mesStr.padStart(2, "0");

    const fornecedorSanitizado = fornecedor.replace(/[<>:"/\\|?*]/g, "").trim();
        // Monta o caminho conforme tipo

const caminhoPastas = 
  tipo === "compras" ? ["Financeiro", "Compras", "Notas Fiscais", ano, mes, fornecedorSanitizado] :
  tipo === "romaneio" ? ["Logistica", "Romaneios", `${ano}_${mes}_${dia}_${fornecedorSanitizado}`] :
  tipo === "romaneio-itens" ? ["Logistica", "Romaneios", `${ano}_${mes}_${dia}_${fornecedorSanitizado}`, "Fotos dos itens"] :
  tipo === "contratos" ? ["Financeiro", "Contratos", fornecedorSanitizado, `${ano}_${mes}_${caminho}`] :
  tipo === "cadastro-fornecedor" ? ["Fornecedores", "Serviços", fornecedorSanitizado, "Dados Cadastrais"] :
  tipo === "cadastro-fornecedor-servico" ? ["Fornecedores", "Serviços", fornecedorSanitizado,"Orçamentos", caminho ?? ""] :
  tipo === "orçamentos-contratos" ? ["Financeiro", "Orçamentos", "Contratos", ano, mes, fornecedorSanitizado] :
  [];

    async function ensureFolderPath(pathParts: string[]): Promise<string> {
      let parentId = "root";

      for (const folderName of pathParts) {
        console.log(`📁 Verificando/criando pasta: ${folderName} (pai: ${parentId})`);

        // Verifica se a pasta já existe
        const checkRes = await fetch(`${graphBase}/items/${parentId}/children?$filter=name eq '${folderName}'`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!checkRes.ok) {
          console.error(`❌ Erro ao buscar pasta '${folderName}':`, await checkRes.text());
          throw new Error("Erro ao verificar pasta.");
        }

        const checkData = await checkRes.json();
        const existingFolder = checkData.value?.find((item: any) => item.name === folderName && item.folder);

        if (existingFolder) {
          parentId = existingFolder.id;
          console.log(`✅ Pasta existente encontrada: ${folderName}`);
        } else {
          console.log(`➕ Criando nova pasta: ${folderName}`);

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

          if (!createRes.ok) {
            console.error(`❌ Erro ao criar pasta '${folderName}':`, await createRes.text());
            throw new Error(`Erro ao criar pasta '${folderName}'`);
          }

          const created = await createRes.json();
          parentId = created.id;
        }
      }

      return parentId;
    }

    const pastaDestinoId = await ensureFolderPath(caminhoPastas);
    console.log("📂 Pasta destino criada com ID:", pastaDestinoId);

    // Upload do arquivo
    const uploadUrl = `${graphBase}/items/${pastaDestinoId}:/${fileName}:/content`;
    console.log("📤 Enviando arquivo para:", uploadUrl);

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
    const itemId = uploadedFile.id;
    console.log("✅ Upload concluído. ID do arquivo:", itemId);

    // Gera link
    const linkResponse = await fetch(
      `${graphBase}/items/${itemId}/createLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "view",
          scope: "anonymous",
        }),
      }
    );

    if (!linkResponse.ok) {
      console.error("❌ Erro ao gerar link público:", await linkResponse.text());
      return null;
    }

    const linkData = await linkResponse.json();
    console.log("🔗 Link público criado:", linkData.link.webUrl);
    return linkData.link.webUrl;

  } catch (err: any) {
    if (err instanceof Error) {
      console.error("💥 Erro inesperado:", err.message);
    } else {
      console.error("💥 Erro inesperado (sem Error):", err);
    }
    return null;
  }
}

// lib/graphApi.ts ou dentro do seu componente

export async function uploadFileToOneDrive(accessToken: string, file: File, fileName: string): Promise<string | null> {
  const uploadUrl = `https://graph.microsoft.com/v1.0/users/compras@12tec.com.br/drive/root:/${fileName}:/content`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      console.error('Erro ao enviar para o OneDrive', await response.text());
      return null;
    }

    const json = await response.json();
    return json['webUrl']; // URL pública do arquivo
  } catch (err) {
    console.error('Erro inesperado ao enviar para o OneDrive', err);
    return null;
  }
}

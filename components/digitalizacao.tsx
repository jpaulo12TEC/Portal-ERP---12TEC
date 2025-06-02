import { useState } from "react";
import { jsPDF } from "jspdf";

interface DigitalizacaoNotaFiscalProps {
  onSuccess: (file: File) => void;
}

const DigitalizacaoNotaFiscal: React.FC<DigitalizacaoNotaFiscalProps> = ({ onSuccess }) => {
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  const tirarFoto = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        setImagemPreview(URL.createObjectURL(file));
        const pdf = await converterParaPDF([file]); // Aceitando um array de imagens
        setArquivo(pdf);
        onSuccess(pdf);
      }
    };

    input.click();
  };

  const digitalizarPC = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        setImagemPreview(URL.createObjectURL(file));
        const pdf = file.type === "application/pdf" ? file : await converterParaPDF([file]); // Se for PDF, não converte
        setArquivo(pdf);
        onSuccess(pdf);
      }
    };

    input.click();
  };

  // Função para converter imagens para um PDF com múltiplas páginas
  const converterParaPDF = async (imagens: File[]): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new jsPDF();
        let x = 10;
        let y = 10;
        const largura = 180;
        const altura = 250;
  
        let imagensProcessadas = 0;
  
        imagens.forEach((imagem, i) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
  
            img.onload = () => {
              if (i > 0) pdf.addPage(); // Adiciona uma nova página se não for a primeira imagem
              pdf.addImage(img, "JPEG", x, y, largura, altura);
  
              imagensProcessadas++;
              if (imagensProcessadas === imagens.length) {
                // Quando todas as imagens forem processadas, resolve a Promise
                const pdfBlob = pdf.output("blob");
                resolve(new File([pdfBlob], "nota_fiscal_multipage.pdf", { type: "application/pdf" }));
              }
            };
  
            img.onerror = () => reject("Erro ao carregar imagem.");
          };
  
          reader.readAsDataURL(imagem);
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isMobile ? tirarFoto : digitalizarPC}
        className="px-4 py-2 bg-blue-500 text-white font-bold rounded"
      >
        {isMobile ? "Tirar Foto" : "Digitalizar"}
      </button>

      {imagemPreview && (
        <div className="mt-4">
          <h3>Preview:</h3>
          <img
            src={imagemPreview}
            alt="Preview"
            className="w-48 h-48 object-contain border rounded-md"
          />
        </div>
      )}

      {arquivo && (
        <div className="mt-4">
          <p className="text-green-600">Arquivo pronto: {arquivo.name}</p>
        </div>
      )}
    </div>
  );
};

export default DigitalizacaoNotaFiscal;
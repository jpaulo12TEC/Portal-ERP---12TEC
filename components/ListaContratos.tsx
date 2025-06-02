import { useEffect, useState } from "react";
import { supabase } from "../lib/superbase";

interface Contrato {
  id: number;
  nomedocontrato: string;
  nomedaempresa: string;
  datafinal: string | null;
  documento: string | null;
}

interface ListaContratosProps {
  refreshTrigger: number; // Um número ou timestamp que muda para forçar o useEffect
}

export default function ListaContratos({ refreshTrigger }: ListaContratosProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const buscarContratos = async () => {
    const { data, error } = await supabase
      .from("contratos_definicoes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar contratos:", error);
    } else {
      setContratos(data || []);
    }
  };

  useEffect(() => {
    buscarContratos();
  }, [refreshTrigger]); // Recarrega ao mudar refreshTrigger

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">Contratos Elaborados</h2>
      <table className="min-w-full bg-white border rounded shadow-sm text-sm mb-6">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="py-2 px-4 border-b">#</th>
            <th className="py-2 px-4 border-b">Nome do Contrato</th>
            <th className="py-2 px-4 border-b">Empresa</th>
            <th className="py-2 px-4 border-b">Data Final</th>
            <th className="py-2 px-4 border-b">Documento</th>
          </tr>
        </thead>
        <tbody>
          {contratos.map((contrato, index) => (
            <tr key={contrato.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{index + 1}</td>
              <td className="py-2 px-4 border-b">{contrato.nomedocontrato}</td>
              <td className="py-2 px-4 border-b">{contrato.nomedaempresa}</td>
              <td className="py-2 px-4 border-b">{contrato.datafinal || "-"}</td>
              <td className="py-2 px-4 border-b">
                {contrato.documento ? (
                  <a
                    href={`https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/contratos-gerados/contratos/${contrato.documento}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Baixar
                  </a>
                ) : (
                  "Não disponível"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

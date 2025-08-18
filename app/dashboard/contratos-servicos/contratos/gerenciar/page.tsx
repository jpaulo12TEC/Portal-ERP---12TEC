'use client'
import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";

export default function GerenciarContratos() {
  const [busca, setBusca] = useState("");
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState("contratos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contratos, setContratos] = useState([]);
  const router = useRouter();

    const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    router.push(`/dashboard/${tab}`)
  }

  useEffect(() => {
    const dadosMockados = [
      {
        id: 1,
        fornecedor: "TIMMIT LOCAÇÕES",
        objeto: "Aluguel de Andaime Tubo Roll",
        valor: 10000,
        tipoControle: "Mensal",
        ultimaAtualizacao: "2025-07-01",
        proximaAtualizacao: "2025-08-01",
        statusContrato: "Ativo",
      },
      {
        id: 2,
        fornecedor: "UNIME ALUGUEIS",
        objeto: "Aluguel de Retroescavadeira",
        valor: 25000,
        tipoControle: "Semanal",
        ultimaAtualizacao: "2025-07-25",
        proximaAtualizacao: "2025-08-02",
        statusContrato: "Inativo",
      },
    ];
    setContratos(dadosMockados);
  }, []);

  const hoje = new Date();
  const filtrados = contratos.filter((c) =>
    `${c.fornecedor} ${c.objeto}`.toLowerCase().includes(busca.toLowerCase())
  );

 

  return (
    <div
      className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"} ${
        isModalOpen ? "backdrop-blur-lg" : ""
      }`}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md h-[50px]">
        <div className="flex items-center space-x-4 w-full">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3">
            <button className="w-full text-left hover:text-gray-300">Contratos</button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        {/* Conteúdo principal */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <h1 className="text-xl font-semibold mb-4">Gerenciamento de Contratos</h1>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm">
              <thead className="bg-[#f5f5f5]">
                <tr>
                  <th className="px-4 py-3 text-left">Fornecedor</th>
                  <th className="px-4 py-3 text-left">Objeto</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                  <th className="px-4 py-3 text-left">Controle</th>
                  <th className="px-4 py-3 text-left">Última</th>
                  <th className="px-4 py-3 text-left">Próxima</th>
                  <th className="px-4 py-3 text-left">Atualização</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
<tbody>
  {filtrados.map((contrato) => {
    const proxima = new Date(contrato.proximaAtualizacao);
    const statusAtualizacao = proxima < hoje ? "Atrasada" : "OK";
    return (
      <tr
        key={contrato.id}
        className="hover:bg-gray-100 transition cursor-pointer"
        onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
      >
        <td className="px-4 py-3">{contrato.fornecedor}</td>
        <td className="px-4 py-3">{contrato.objeto}</td>
        <td className="px-4 py-3">
          {contrato.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </td>
        <td className="px-4 py-3">{contrato.tipoControle}</td>
        <td className="px-4 py-3">
          {new Date(contrato.ultimaAtualizacao).toLocaleDateString("pt-BR")}
        </td>
        <td className="px-4 py-3">
          {new Date(contrato.proximaAtualizacao).toLocaleDateString("pt-BR")}
        </td>
        <td className="px-4 py-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              statusAtualizacao === "Atrasada"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {statusAtualizacao}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              contrato.statusContrato === "Ativo"
                ? "bg-green-100 text-green-700"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {contrato.statusContrato}
          </span>
        </td>
      </tr>
    );
  })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

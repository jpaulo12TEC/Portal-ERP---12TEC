"use client";
import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { useEffect } from "react";

// Componente de Cadastro de Compra
export default function CompraCadastro() {
  // Estados para as informações gerais da compra
  const [protocolo, setProtocolo] = useState<number | string>("");
  const [numerocomprovante, setnumerocomprovante] = useState<number | string>("");
  const [dataCompra, setDataCompra] = useState<string>("");
  const [comprovante, setComprovante] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [outraformadepgto, setOutraforma] = useState<number | string>("");
  const [cnpjCpf, setCnpjCpf] = useState<string>("");
  const [fornecedor, setFornecedor] = useState<string>("");

  // Estados para os produtos
  const [produtos, setProdutos] = useState<any[]>([]); // Array para armazenar os produtos
  const [produto, setProduto] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [classificacaoTributaria, setClassificacaoTributaria] = useState<string>("");
  const [marca, setMarca] = useState<string>("");
  const [centroCusto, setCentroCusto] = useState<string>("");

  useEffect(() => {
    console.log("Produtos atualizados:", produtos);
  }, [produtos]);

  const handleAdicionarProduto = () => {
    if (!produto || !valor || quantidade <= 0) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const novoProduto = {
      produto,
      valor,
      quantidade,
      total: (parseFloat(valor) * quantidade).toFixed(2),
      classificacaoTributaria,
      marca,
      centroCusto
    };

    setProdutos((prevProdutos) => [...prevProdutos, novoProduto]);

    setProduto("");
    setValor("");
    setQuantidade(1);
    setClassificacaoTributaria("");
    setMarca("");
    setCentroCusto("");
  };

  // Função para finalizar a compra
  const handleFinalizarCompra = () => {
    alert(`Compra finalizada: ${produto}, ${quantidade}x, R$${valor}`);
    console.log({
      protocolo,
      numerocomprovante,
      dataCompra,
      comprovante,
      formaPagamento,
      outraformadepgto,
      cnpjCpf,
      fornecedor,
      produtos,
    });
  };




   // Estado para controlar qual componente exibir
   const [selectedTab, setSelectedTab] = useState<string | null>(null);
   const [menuActive, setMenuActive] = useState(true); // Estado para o menu
   const [activeTab, setActiveTab] = useState<string>('Compras'); // Estado para o item ativo
   const router = useRouter();
 
   const handleNavClick = async (tab: string) => {
     try {
       setActiveTab(tab); // Atualiza o tab ativo
       router.push(`/dashboard/${tab}`);
     } catch (error) {
       console.error("Erro ao navegar:", error);
     }
   };
   const handleBarras = async (tab: string) => {
       setSelectedTab(tab); // Atualiza o estado do componente selecionado
   };

  return (
    <div className="mt-10 p-6 bg-white shadow-lg rounded-xl max-w-full">
              {/* Passando a função handleNavClick como onNavClickAction */}
      <Sidebar 
        className="" 
        onNavClickAction={handleNavClick} 
        menuActive={menuActive}  // Passando o estado para o Sidebar
        setMenuActive={setMenuActive}  // Passando a função de set para o Sidebar
        activeTab={activeTab}  // Passando o estado de item ativo
      />
      <div className={`content flex-1 p-6 min-h-screen w-300 bg-gray-100 ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      <h1 className="text-xl font-semibold mb-4">Dados iniciais</h1>

      {/* Formulário de Cadastro de Compra */}
      <Card >
      <CardContent 
            className="rounded-xl h-80 shadow-xl"
            style={{
                background: 'radial-gradient(circle,rgb(245, 237, 237),rgb(221, 215, 215))', // Gradiente radial com cores mais claras
            }}
            >

          <form className="space-y-4 w-400">
            {/* Informações Gerais da Compra */}
            <div className="flex flex-wrap gap-5 ">
              <div className="p-0 flex flex-col w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-sm font-large font-bold">Protocolo de Compra</label>
                <Input
                  type="number"
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-sm font-large font-bold">Data de Compra</label>
                <Input
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Outras informações gerais */}
            <div className="flex flex-wrap gap-5">
              <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-sm font-large font-bold">Comprovante</label>
                <select
                  value={comprovante}
                  onChange={(e) => setComprovante(e.target.value)}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="notaFiscal">Nota Fiscal</option>
                  <option value="cupomFiscal">Cupom Fiscal</option>
                  <option value="recibo">Recibo</option>
                  <option value="outro">Outro</option>
                  <option value="semNota">Sem Nota</option>
                </select>
              </div>
              <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-sm font-large font-bold">Forma de Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão de Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                <label className="block text-sm font-large font-semibold ">Fornecedor</label>
                <Input
                  type="text"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>










            {/* Cadastro de Produtos */}
      <h1 className="text-xl align font-semibold mt-8 mb-4 text-right">+ Forma de pagamento</h1>

<Card>
<CardContent 
      className="rounded-xl shadow-xl h-120"
      style={{
          background: 'radial-gradient(circle, rgb(252, 245, 245),rgb(193, 188, 211))', // Gradiente radial com cores mais claras

          
      }}
      >
  <form className="space-y-4 w-400">
    <div className="flex flex-wrap gap-5">
      {/* Campos para cadastrar o produto */}
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Produto</label>
        <Input
          type="text"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Valor (R$)</label>
        <Input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Quantidade</label>
        <Input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          required
        />
      </div>
    </div>

    <div className="flex flex-wrap gap-5 mt-5">
      {/* Outros campos do produto */}
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Classificação Tributária</label>
        <Input
          type="text"
          value={classificacaoTributaria}
          onChange={(e) => setClassificacaoTributaria(e.target.value)}
        />
      </div>
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Marca</label>
        <Input
          type="text"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
        />
      </div>
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-large font-semibold ">Centro de Custo</label>
        <Input
          type="text"
          value={centroCusto}
          onChange={(e) => setCentroCusto(e.target.value)}
        />
      </div>
    </div>

    {/* Botão para adicionar produto */}
    <div className="mt-5">
      <Button
        onClick={handleAdicionarProduto}
        className="bg-blue-500 text-white"
      >
        Adicionar Produto
      </Button>
    </div>
    </form>
  </CardContent>
</Card>






















      {/* Cadastro de Produtos */}
      <h1 className="text-xl font-semibold mt-8 mb-4">Inclusão</h1>

      <Card>
      <CardContent 
            className="rounded-xl shadow-xl h-120"
            style={{
                background: 'radial-gradient(circle, rgb(245, 237, 237),rgb(221, 215, 215))', // Gradiente radial com cores mais claras

                
            }}
            >
        <form className="space-y-4 w-400">
          <div className="flex flex-wrap gap-5">
            {/* Campos para cadastrar o produto */}
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Produto</label>
              <Input
                type="text"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Valor (R$)</label>
              <Input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Quantidade</label>
              <Input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 mt-5">
            {/* Outros campos do produto */}
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Classificação Tributária</label>
              <Input
                type="text"
                value={classificacaoTributaria}
                onChange={(e) => setClassificacaoTributaria(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Marca</label>
              <Input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
              <label className="block text-sm font-large font-semibold ">Centro de Custo</label>
              <Input
                type="text"
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
              />
            </div>
          </div>

          {/* Botão para adicionar produto */}
          <div className="mt-5">
            <Button
              onClick={handleAdicionarProduto}
              className="bg-blue-500 text-white"
            >
              Adicionar Produto
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>

      {/* Exibindo a lista de produtos cadastrados */}
      {produtos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Produtos Cadastrados</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border-b px-4 py-2">Produto</th>
                <th className="border-b px-4 py-2">Qtd</th>
                <th className="border-b px-4 py-2">Valor</th>
                <th className="border-b px-4 py-2">Total</th>
                <th className="border-b px-4 py-2">Classificação Tributária</th>
                <th className="border-b px-4 py-2">Marca</th>
                <th className="border-b px-4 py-2">Centro de Custo</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto, index) => (
                <tr key={index}>
                  <td className="border-b px-4 py-2">{produto.produto}</td>
                  <td className="border-b px-4 py-2">{produto.quantidade}</td>
                  <td className="border-b px-4 py-2">R${produto.valor}</td>
                  <td className="border-b px-4 py-2">R${produto.total}</td>
                  <td className="border-b px-4 py-2">{produto.classificacaoTributaria}</td>
                  <td className="border-b px-4 py-2">{produto.marca}</td>
                  <td className="border-b px-4 py-2">{produto.centroCusto}</td>
                </tr>
              ))}
            </tbody>
          </table>
         
        </div>
      )}
       

      {/* Finalizando a compra */}
      <div className="mt-6">
        <Button onClick={handleFinalizarCompra} className="bg-green-500 text-white">
          Finalizar Compra
        </Button>
      </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import DigitalizacaoNotaFiscal from "@/components/digitalizacao";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from '../lib/superbase';
import { ArrowLeft } from "lucide-react";
import { Camera } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { Palette, CreditCard } from "lucide-react";

type FormaPagamento = {
  forma: string;
  valor: number;
  nomeReembolso: string;
  dataPagamento: string;
};



// Componente de Cadastro de Compra
export function CompraCadastro() {
  
  const [loading, setLoading] = useState(false);
  const { nome } = useUser();
  const router = useRouter();
  'Digitalização'
  const [mostrarDigitalizacao, setMostrarDigitalizacao] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  'Dados Gerais'
  const [dataLançamento, setDataLancamento] = useState(""); 
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [pedidon, setPedidon] = useState<string>(""); // Variável para armazenar o id do pedido
  const [comprovante, setComprovante] = useState<string>(""); 
  const [ncomprovante, setNComprovante] = useState<number | string>("");
  'Dados de compra'
  const [dataCompra, setDataCompra] = useState<string>("");
  const [cnpjCpf, setCnpjCpf] = useState<string>(""); 
  const [fornecedor, setFornecedor] = useState<string>("");
  const [valorTotal, setValorTotal] = useState(0);
  const [valorTotalProdutos, setValorTotalProdutos] = useState(0);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [valorFinal, setValorFinal] = useState(0);
  const [temIcms, setTemIcms] = useState(false); 
  'Centro de Custo'
  const [centroNome, setCentroNome] = useState("");
const [centroValor, setCentroValor] = useState("");
const [centros, setCentros] = useState<{ centro: string; valor: string }[]>([]);
  'Forma de Pagamento'
const [formaPagamentoGeral, setFormaPagamentoGeral] = useState<FormaPagamento[]>([]);
  'Pagamentos'
  const [pagamentoEntrada, setPagamentoEntrada] = useState(false); 
  const [valorEntrada, setValorEntrada] = useState(''); 
  const [dataVencimentoEntrada, setDataVencimentoEntrada] = useState(''); 
  const [dataPagamentoEntrada, setDataPagamentoEntrada] = useState(''); 
  const [parcelas, setParcelas] = useState<{
    valor: string;
    vencimento: string;
    pagamento: string;
    valorBoletoPix: string;
    boleto: File | null; // Adicionando o campo 'boleto' para cada parcela
  }[]>([]);
  const [formadePagamentoEntrada, setFormadePagamentoEntrada] = useState<string>("");
  'Função de salvamento'
  const [isSaving, setIsSaving] = useState(false);
  'Boletos'
  const [showBoletoDiv, setShowBoletoDiv] = useState<boolean>(false);
  const [enviarFormulario, setEnviarFormulario] = useState(false); // controle para quando o formulário será enviado
  'Ordem de serviço'
  const [ordensDeServico, setOrdensDeServico] = useState<{ ordem: string; valor: string }[]>([]);
  'Produtos'
  const [tipo, setTipo] = useState<string>(''); // Inicialize como string

  const [produto, setProduto] = useState("");
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [produtoValorTotal, setProdutoValorTotal] = useState<number>(0);
  const [classificacaoTributaria, setClassificacaoTributaria] = useState<string>('');
  const [marca, setMarca] = useState("");
  const [unidade, setUnidade] = useState("");

  'Número de Protocolo'
  const gerarProtocolo = () => {
    const agora = new Date();
    const YY = String(agora.getFullYear()).slice(-2); // Ano (24)
    const MM = String(agora.getMonth() + 1).padStart(2, "0"); // Mês (03)
    const DD = String(agora.getDate()).padStart(2, "0"); // Dia (19)
    const HH = String(agora.getHours()).padStart(2, "0"); // Hora (15)
    const SS = String(agora.getSeconds()).padStart(2, "0"); // Segundos (30)
    const random = Math.floor(1000 + Math.random() * 9000); // Número aleatório de 4 dígitos
  
    return `${YY}${MM}${DD}${HH}${SS}${random}`;
  };
  const [protocolo, setProtocolo] = useState("");
  useEffect(() => {
    setProtocolo(gerarProtocolo());
  }, []);


'Categorias'
const categoriasProduto: Record<string, string[]> ={
  "Materiais de Segurança e Proteção": [
    "EPI (Equipamento de Proteção Individual)",
    "EPC (Equipamento de Proteção Coletiva)",
    "Sinalização de Segurança",
    "Extintores e Combate a Incêndios",
    "Treinamentos e Manuais de Segurança"
  ],
  "Materiais de Escritório e Administração": [
    "Papelaria e Suprimentos",
    "Mobiliário Corporativo",
    "Equipamentos de Informática",
    "Armazenamento e Organização",
    "Impressoras e Acessórios"
  ],
  "Materiais de Construção Bruta": [
    "Concreto e Argamassa",
    "Cimentos e Aditivos",
    "Blocos e Tijolos",
    "Areia, Pedra e Brita",
    "Madeira para Construção"
  ],
  "Materiais de Acabamento": [
    "Pisos e Revestimentos",
    "Tintas e Vernizes",
    "Portas e Janelas",
    "Louças e Metais Sanitários",
    "Rodapés e Molduras"
  ],
  "Materiais de Elétrica": [
    "Fios e Cabos",
    "Quadros de Distribuição",
    "Disjuntores e Fusíveis",
    "Tomadas e Interruptores",
    "Dutos e Eletrocalhas"
  ],
  "Materiais para Estruturas Metálicas e Caldeiraria": [
    "Chapas de Aço",
    "Tubos e Perfis Metálicos",
    "Eletrodos e Materiais de Soldagem",
    "Parafusos e Fixadores",
    "Treliças e Vigas"
  ],
  "Equipamentos e Ferramentas": [
    "Ferramentas Manuais",
    "Ferramentas Elétricas",
    "Equipamentos de Medição",
    "Compressores e Geradores",
    "Ferramentas de Corte e Desbaste"
  ],
  "Materiais Hidráulicos": [
    "Tubos e Conexões",
    "Bombas e Motores Hidráulicos",
    "Válvulas e Registros",
    "Caixas d'Água e Reservatórios",
    "Ralos e Grelhas"
  ],
  "Máquinas e Equipamentos Pesados": [
    "Guindastes e Gruas",
    "Escavadeiras e Retroescavadeiras",
    "Compressores e Geradores",
    "Betoneiras e Compactadores",
    "Empilhadeiras e Transportadores"
  ],
  "Materiais de Topografia e Medição": [
    "Níveis e Trenas",
    "GPS e Estações Totais",
    "Miras e Prismas",
    "Drones para Mapeamento",
    "Softwares de Topografia"
  ],
  "Iluminação Industrial": [
    "Luminárias LED",
    "Postes e Refletores",
    "Sensores de Iluminação",
    "Sistemas Fotovoltaicos",
    "Fios e Conectores Especiais"
  ],
  "Materiais para Pavimentação Asfáltica": [
    "Asfalto e Derivados",
    "Brita Graduada e Agregados",
    "Emulsões Asfálticas",
    "Pinturas de Ligação e Selagem",
    "Geotêxteis e Geossintéticos"
  ],
  "Outro": ["Outros materiais não especificados"]
};

const categoriasServico: Record<string, string[]> =  {
  "Projetos e Consultoria em Engenharia": [
    "Projetos Estruturais",
    "Projetos Elétricos",
    "Projetos Hidráulicos",
    "Consultoria Técnica",
    "Gerenciamento de Projetos",
    "Laudos Técnicos"
  ],
  "Gerenciamento e Fiscalização de Obras": [
    "Supervisão de Obras",
    "Controle de Qualidade",
    "Gestão de Custos",
    "Gestão de Segurança",
    "Planejamento e Cronograma"
  ],
  "Construção Civil e Montagem Industrial": [
    "Obras Residenciais",
    "Obras Comerciais",
    "Obras Industriais",
    "Montagem de Estruturas",
    "Montagem de Equipamentos"
  ],
  "Terraplenagem e Movimentação de Terra": [
    "Escavação e Aterro",
    "Compactação de Solo",
    "Drenagem de Águas Pluviais",
    "Nivelamento de Terreno",
    "Locação de Máquinas para Terraplenagem"
  ],
  "Pavimentação e Recapeamento Asfáltico": [
    "Preparação de Base",
    "Aplicação de CBUQ",
    "Selagem de Trincas",
    "Recapeamento Asfáltico",
    "Pavimentação de Rodovias"
  ],
  "Instalações Elétricas e Automação": [
    "Instalação de Painéis",
    "Cabeamento Estruturado",
    "Automação Residencial",
    "Instalações de Alta Tensão",
    "SPDA (Para-Raios)"
  ],
  "Aluguel de Máquinas e Equipamentos": [
    "Guindastes",
    "Escavadeiras",
    "Betoneiras",
    "Compressores de Ar",
    "Ferramentas Elétricas"
  ],
  "Aluguel de Transporte de Passageiros (Vans, Ônibus)": [
    "Transporte Executivo",
    "Transporte Escolar",
    "Transporte de Funcionários",
    "Fretamento de Ônibus",
    "Aluguel de Vans"
  ],
  "Outro": ["Outros serviços não especificados"]
};

const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState("");

const getCategorias = (): Record<string, string[]> => {
  return tipo === "Produto"
    ? categoriasProduto
    : tipo === "Serviço"
    ? categoriasServico
    : {};
};


const obterCategoriaSubcategoria = async (produto: string) => {
  const categoriasSelecionadas = getCategorias(); // usa a função correta

  // Constrói uma string formatada com categorias e subcategorias
  const categoriasFormatadas = Object.entries(categoriasSelecionadas)
    .map(([categoria, subcategorias]) => {
      return `- ${categoria}: ${subcategorias.join(", ")}`;
    })
    .join("\n");

  const prompt = `
Tenho uma lista de categorias e subcategorias. Com base no nome '${produto}', qual a melhor categoria e subcategoria correspondente? 

Retorne a resposta no formato JSON puro, sem nenhum texto adicional, exatamente assim:
{
  "categoria": "Nome da Categoria",
  "subcategoria": "Nome da Subcategoria"
}

As categorias e subcategorias disponíveis são:
${categoriasFormatadas}
  `;

  try {
    const response = await fetch("/api/chatgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    // Loga o que vier da API para debug
    console.log("Resposta da API:", data);

    return data;
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return null;
  }
};

const handleClassificar = async (e: React.FocusEvent<HTMLInputElement>)=> {
  e.preventDefault(); // impede o reload da página

  if (!produto) return;

  const resultado = await obterCategoriaSubcategoria(produto);
  if (resultado) {
    setCategoriaSelecionada(resultado.categoria);
    setSubcategoriaSelecionada(resultado.subcategoria);
  }
};



  //Vericiando alternancia entre boletos -------------------------------------------------------------------------------------------------------
  const handleBoletoChange = (index: number, file: File | null) => {
    setParcelas((prevParcelas) =>
      prevParcelas.map((parcela, i) =>
        i === index ? { ...parcela, boleto: file } : parcela
      )
    );
  };

  // Determinando HORA em TEMPO REAL ------------------------------------------------------------------------------------------------------------------------------------------------
   //verifica hora e data
 useEffect(() => {
  const updateDate = () => {
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0,16);
    setDataLancamento(formattedDateTime);
  }; 
 //Atualiza a data e hora a cada 1000ms (1 segundo)
 const intervalId = setInterval(updateDate, 1000);
 updateDate();
 return () => clearInterval(intervalId);
}, []);




// Trazendo o número do PEDIDO DE COMPRA:
useEffect(() => {
  // Lê o pedido do localStorage quando a página for carregada
  const pedido = localStorage.getItem('pedidoSelecionado');
  if (pedido) {
    const pedidoObj = JSON.parse(pedido);
    setPedidoSelecionado(pedidoObj);
    setPedidon(pedidoObj.id.toString());
  }

  // Remove o pedido do localStorage assim que a página for carregada
  return () => {
    localStorage.removeItem('pedidoSelecionado'); // Remove do localStorage quando sair da página
  };
}, []);


  //Sobre o valor total, desconto e valor líquido ----------------------------------------------------------------------------------------------------------------------------

const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    const numero = Number(valor) / 100; // Converte para decimal
  
    const novoValorTotal = isNaN(numero) ? 0 : numero;
    const novoDesconto = isNaN(valorDesconto) ? 0 : valorDesconto;
    const novoValorFinal = novoValorTotal - novoDesconto;
  
    setValorTotal(novoValorTotal);
    setValorFinal(novoValorFinal);
  };  
const handleDescontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    const numero = Number(valor) / 100;
  
    const novoDesconto = isNaN(numero) ? 0 : numero;
    const novoValorTotal = isNaN(valorTotal) ? 0 : valorTotal;
    const novoValorFinal = novoValorTotal - novoDesconto;
  
    setValorDesconto(novoDesconto);
    setValorFinal(novoValorFinal);
  };  


// Forma de pagamento --------------------------------------------------------------------------------------------------------------------------------------------------------
  // Adicionar nova forma de pagamento (evita duplicatas)
const adicionarFormaPagamento = (forma: string) => {
  if (!forma || formaPagamentoGeral.some((item) => item.forma === forma)) return;

  const valorInicial = formaPagamentoGeral.length === 0 ? valorFinal : 0;

  const novaForma: FormaPagamento = {
    forma,
    valor: valorInicial,
    nomeReembolso: "",  // Sempre existe
    dataPagamento: "",  // Sempre existe
  };

  setFormaPagamentoGeral((prev) => [...prev, novaForma]);
};

  const atualizarDataPagamento = (index: number, novaData: string) => {
  const novaLista = [...formaPagamentoGeral];
  novaLista[index].dataPagamento = novaData;
  setFormaPagamentoGeral(novaLista);
};

// Função para atualizar o valor de uma forma de pagamento
const atualizarValor = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
  let valorDigitado = e.target.value;

  // Remove tudo que não for dígito
  const valorNumerico = valorDigitado.replace(/\D/g, '');

  // Converte para número decimal (centavos)
  const numero = Number(valorNumerico) / 100;

  if (isNaN(numero)) return;

  setFormaPagamentoGeral((prev) => {
    const novasFormas = [...prev];
    novasFormas[index].valor = numero;
    return novasFormas;
  });
};

  // Remover uma forma de pagamento
const removerFormaPagamento = (index: number) => {
    setFormaPagamentoGeral((prevFormas) => prevFormas.filter((_, i) => i !== index));
  };

  // Atualizar o nome do reembolso (apenas quando a forma de pagamento for "Reembolso")
const atualizarNomeReembolso = (index: number, nome: string) => {
    const novasFormasPagamento = [...formaPagamentoGeral];
    if (novasFormasPagamento[index].forma === "Reembolso") {
      novasFormasPagamento[index].nomeReembolso = nome;
    }
    setFormaPagamentoGeral(novasFormasPagamento);
  };

// PErcentual do ICMS --------------------------------------------------------------------------------------------------------------------------------------------------------------

const calcularPercentual = (valor: string | number): string => {
  const total = Number(valorFinal);
  if (!total || total === 0) return "0%";
  return ((Number(valor) / total) * 100).toFixed(2) + "%";
};

const icmsValor = temIcms ? valorFinal * 0.18 : 0;


//Regras de Formatação----------------------------------------------------------------------------------------------------------------------------------------------------------------

//CNPJ
const formatCNPJ = (cnpj:string) => {
  return cnpj
  .replace(/\D/g,'')
  .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'); 
};
// CPF
const formatCPF = (cpf:string) => {
  return cpf
  .replace(/\D/g, '')
  .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};
//Moeda
const formatarMoeda = (valor: number) => {
  if (isNaN(valor)) return "R$ 0,00";
  
  // Formatação como moeda
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};



//Alterando o formato automaticamente CNPJ e CPF
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const value = event.target.value;

  if (value.length <= 11){
    setCnpjCpf(formatCPF(value));
  } else {
    setCnpjCpf(formatCNPJ(value));
  }
};

useEffect(() => {
  if (cnpjCpf.length === 14) {
    setCnpjCpf (formatCPF(cnpjCpf));
  } else if (cnpjCpf.length === 18) {
    setCnpjCpf (formatCNPJ(cnpjCpf));
  }
}, [cnpjCpf]);


// CENTROS DE CUSTO
// Adiciona centro de custo
const adicionarCentroCusto = () => {
  if (!centroNome || !centroValor) return;

  setCentros((prev) => [
    ...prev,
    { centro: centroNome, valor: centroValor }
  ]);

  // Limpa inputs
  setCentroNome("");
  setCentroValor("");
};

// Remove centro de custo
const removerCentroCusto = (index: number) => {
  setCentros((prev) => prev.filter((_, i) => i !== index));
};

// Calcula total dos percentuais
const calcularTotalPercentual = () => {
  return centros.reduce((acc, curr) => acc + Number(curr.valor), 0);
};









useEffect(() => {
  if (tipo === "Serviço") {
    setUnidade("serviço"); // coloca 'serviço' automaticamente
  } else if (unidade === "serviço") {
    setUnidade(""); // limpa se tipo não for mais serviço
  }
}, [tipo]);






// Sobre os Produtos ------------------------------------------------------------------------------------------------------------------------------------------------------------


  const [produtos, setProdutos] = useState<Produto[]>([]);

  interface Produto {
    tipo: string;
    categoriaSelecionada: string;
    subcategoriaSelecionada: string;
    produto: string;
    valorUnitario: number;
    quantidade: number;
    valorTotal: number;
    classificacaoTributaria: string;
    unidade: string;
    marca: string | null;
  }

    // PRODUTOS
    const calcularValorTotal = (valor: string, qtd: string) => {
      const total = parseFloat(valor) * parseInt(qtd);
      return isNaN(total) ? "" : total.toFixed(2);
    };
  
    // Atualiza o valor total automaticamente quando os campos mudam
    const handleValorUnitarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let valorDigitado = e.target.value;
    
      // Remove tudo que não for número
      const valorNumerico = valorDigitado.replace(/\D/g, "");
    
      // Converte para número decimal (centavos)
      const numero = Number(valorNumerico) / 100;
    
      if (isNaN(numero)) return;
    
      setValorUnitario(numero);
      setValorTotalProdutos(numero * quantidade);
    };
    
    const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const novaQuantidade = parseInt(e.target.value) || 0;
      setQuantidade(novaQuantidade);
      setProdutoValorTotal(valorUnitario * novaQuantidade);
    };
  
    // Adiciona o produto à tabela
    const adicionarProduto = () => {
      if (!produto || !valorUnitario || !quantidade || !tipo ) {
        alert("Preencha os campos obrigatórios!");
        return;
      }
  
      const novoProduto: Produto = {
        tipo,
        categoriaSelecionada,
        subcategoriaSelecionada,
        produto,
        valorUnitario,
        quantidade,
        valorTotal: valorUnitario * quantidade, // Certifique-se de calcular corretamente
        classificacaoTributaria,
        unidade,
        marca,

      };
  
      setProdutos((prevProdutos) => [...prevProdutos, novoProduto]); // Adiciona à lista
      limparCampos(); // Limpa o formulário
    };
  
    // Remove um produto da lista
    const removerProduto = (index: number) => {
      setProdutos(produtos.filter((_, i) => i !== index));
    };
  
    // Limpa os campos do formulário
    const limparCampos = () => {
      setTipo("");
      setCategoriaSelecionada("");
      setSubcategoriaSelecionada("");
      setProduto("");
      setValorUnitario(0); // Valor inicial
      setQuantidade(0); // Valor inicial
      setProdutoValorTotal(0); // Valor inicial
      setClassificacaoTributaria("");
      setMarca("");
      setUnidade("");
     
    };








  //Parcelamento ---------------------------------------------------------------------------------------------------------------------------------------------------------------

  // Handle parcela changes
  const handleParcelaChange = (index: number, field: string, value: string) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index] = { ...novasParcelas[index], [field]: value };
    setParcelas(novasParcelas);
  };
  const adicionarParcela = () => setParcelas([...parcelas, { valor: "", vencimento: "", pagamento: "", valorBoletoPix: "", boleto: null }]);
  const removeParcela = (index: number) => setParcelas(parcelas.filter((_, i) => i !== index));











//Envio ao  supabase =------------======================------------------------------------==========================----------------------------------------------=--------------------------=---



// INICIO DO ENVIO AO SUPABASE =====================-=-------------------=--=-=-==-=-=-=-=-=-=-=-===-=-=-=-=====================================







const salvarProvisionamento = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("UID do usuário autenticado:", user?.id);
  setIsSaving(true);  // Define como verdadeiro antes de enviar os dados


  // INICIALIZAÇÃO --------------------------------------------------------------------------------------------------------------------------------------

setLoading(true); // Inicia o loading


  // VALIDAÇÃO DE DADOS ---------------------------------------------================================================================================

  // Validação das formas de pagamento
const somaCentros = centros.reduce(
  (acc, centro) => acc + Number(centro.valor || 0),
  0
);
// Validação — a soma precisa ser exatamente 100 (ou tolerância pequena, ex: 0.1)
const somaCentrosInvalida =
  centros.length > 0 && Math.abs(somaCentros - 100) > 0.1;


const somaOrdens = ordensDeServico.reduce((acc, ordem) => acc + Number(ordem.valor || 0), 0);
const centrosInvalidos = centros.some(centro => !centro.centro || !centro.valor);
const ordensInvalidas = ordensDeServico.length > 0 && ordensDeServico.some(ordem => !ordem.ordem || !ordem.valor);


// ✅ Verifica se a soma das ordens está dentro da margem de erro de 1
const somaOrdensInvalida = ordensDeServico.length > 0 && Math.abs(somaOrdens - valorFinal) > 1;



  const temErroFormaPagamento = formaPagamentoGeral.some(pagamento => {
  const { forma, valor, dataPagamento, nomeReembolso } = pagamento;

  if (forma === "Reembolso") {
    return !nomeReembolso || !valor;
  }

  if (forma === "Parcelado (Faturado)") {
    // Verifica se não existe nenhuma parcela OU se alguma parcela está com dados incompletos
    return (
      parcelas.length === 0 ||
      parcelas.some(p =>
        !p.valor ||
        !p.vencimento ||
        
        ( !p.valorBoletoPix && !p.boleto ) // 👉 Um dos dois precisa estar preenchido
      )
    );
  }

  // Para qualquer outra forma
  return !valor || !dataPagamento;
});


  if (!arquivo) {
    console.error("Nenhum arquivo selecionado.");
    alert("Por favor, selecione o comprovante para enviar.");
     setLoading(false)
    return;
  }

  if (
  !comprovante || 
  !ncomprovante || 
  !dataCompra || 
  !valorTotal || 
  !cnpjCpf || 
  !fornecedor || 
  centros.length === 0 || 
  temErroFormaPagamento ||
  centrosInvalidos || 
  ordensInvalidas ||
  somaCentrosInvalida ||
  somaOrdensInvalida ||   
  formaPagamentoGeral.length === 0 || // Verifica se há pelo menos uma forma de pagamento
  formaPagamentoGeral.some(pagamento => !pagamento.valor) || // Verifica se algum pagamento não tem valor
  centros.some(centro => !centro.centro || !centro.valor) || // Verifica se algum centro não tem nome ou valor
  (ordensDeServico.length > 0 && ordensDeServico.some(ordem => !ordem.ordem || !ordem.valor)) // Se houver ordens de serviço, verifica se todas têm nome e valor
) {

  let mensagemErro = "🛑 Validação dos campos:\n\n";

  mensagemErro += `Comprovante: ${comprovante ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `Nº Comprovante: ${ncomprovante ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `Data da Compra: ${dataCompra ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `Valor Total: ${valorTotal ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `CNPJ ou CPF: ${cnpjCpf ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `Fornecedor: ${fornecedor ? "✅ OK" : "❌ Faltando"}\n\n`;

  mensagemErro += `Centros de Custo: ${centros.length > 0 ? "✅ OK" : "❌ Nenhum centro adicionado"}\n`;
  centros.forEach((centro, index) => {
    mensagemErro += `➡️ Centro ${index + 1} Nome: ${centro.centro ? "✅ OK" : "❌ Faltando"}\n`;
    mensagemErro += `➡️ Centro ${index + 1} Valor: ${centro.valor ? "✅ OK" : "❌ Faltando"}\n`;
  });


mensagemErro += `\nFormas de Pagamento: ${formaPagamentoGeral.length > 0 ? "✅ OK" : "❌ Nenhuma adicionada"}\n`;

formaPagamentoGeral.forEach((pagamento, index) => {
  const { forma, valor, dataPagamento, nomeReembolso } = pagamento;
  mensagemErro += `💰 Pagamento ${index + 1}:\n`;
  mensagemErro += `➡️ Forma: ${forma}\n`;
  mensagemErro += `➡️ Valor: ${valor ? "✅ OK" : "❌ Faltando"}\n`;
  mensagemErro += `➡️ Data de Pagamento: ${(forma === "Parcelado (Faturado)" || forma === "Reembolso") ? "✅ Não obrigatório" : (dataPagamento ? "✅ OK" : "❌ Faltando")}\n`;

  if (forma === "Reembolso") {
    mensagemErro += `➡️ Nome do Reembolso: ${nomeReembolso ? "✅ OK" : "❌ Faltando"}\n`;
  }

  if (forma === "Parcelado (Faturado)") {
    mensagemErro += `➡️ Parcelas: ${parcelas.length > 0 ? "✅ OK" : "❌ Nenhuma parcela adicionada"}\n`;
  }

  mensagemErro += "\n";
});

if (somaCentrosInvalida) {
  mensagemErro += `❌ Soma dos percentuais dos Centros de Custo diferente de 100%. Atualmente está em ${somaCentros}%\n`;
}

  mensagemErro += `\nOrdens de Serviço: ${ordensDeServico.length > 0 ? "Verificando..." : "✅ Não aplicável"}\n`;
  ordensDeServico.forEach((ordem, index) => {
    mensagemErro += `🛠️ Ordem ${index + 1} Nome: ${ordem.ordem ? "✅ OK" : "❌ Faltando"}\n`;
    mensagemErro += `🛠️ Ordem ${index + 1} Valor: ${ordem.valor ? "✅ OK" : "❌ Faltando"}\n`;
  });
  if (somaOrdensInvalida) {
    mensagemErro += `❌ Soma das ordens de serviço diferente de ${valorFinal}\n`;
  }

  alert(mensagemErro);

setLoading(false) 
  return;
}

  
  // Verificar se há entrada ou parcelas
  if (pagamentoEntrada) {
    // Verificar se o valor da entrada e a data de vencimento estão preenchidos
    if (!valorEntrada || !dataVencimentoEntrada) {
      alert("Por favor, preencha o valor e a data de vencimento da entrada.");
setLoading(false)
      return;
    }
  
    // Verificar se a data de pagamento da entrada e a forma de pagamento da entrada estão preenchidas
    if (!dataPagamentoEntrada || !formadePagamentoEntrada) {
      alert("Por favor, preencha a data de pagamento e a forma de pagamento da entrada.");
setLoading(false)
      return;
    }
  }
  
  // Verificar se existem parcelas e validar os dados de cada uma
  if (parcelas.length > 0) {
    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i];
      if (!parcela.valor || !parcela.vencimento) {
setLoading(false)
        return;
      }
    }
  }



  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function enviarMensagemWhatsApp() {
    const numeros = [
      '557998870125', '5511976113088', '557999885900'
      // adicione quantos quiser
    ];
    const mensagem = 'Olá! Houve um novo cadastro de compra!. 📲';
  
    for (const numero of numeros) {
      try {
        const resposta = await fetch('http://localhost:3001/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numero, mensagem }),
        });
  
        const dados = await resposta.json().catch(() => ({}));
  
        if (resposta.ok) {
          console.log(`✅ Mensagem enviada com sucesso para ${numero}:`, dados);
        } else {
          console.warn(`⚠️ Erro ao enviar mensagem para ${numero}:`, dados?.error || 'Erro desconhecido');
        }
  
        // Aguarda 2 segundos antes de enviar para o próximo
        await sleep(1000);
  
      } catch (erro) {
        console.warn(`❌ Erro ao enviar mensagem para ${numero}:`, erro);
      }
    }
  }



  //ENVIO DE ARQUIVOS AO SUPABASE (BOLETOS E NOTA FISCAL) --------------------------------------------------------------------------------------------------------------------------------


  // (BOLETOS) ----------------------------------------------------------------------------------------

const arquivosBoleto = await Promise.all(
  parcelas.map(async (parcela, index) => {
    if (parcela.boleto) {
      try {
        const fileNameboleto = `boleto_parcela_${new Date().toISOString()}_${index}`;
      

        const { error } = await supabase.storage
          .from("boletos")
          .upload(fileNameboleto, parcela.boleto);

        if (error) {
          console.error("Erro no upload do boleto:", error.message);
          return null;
        }

        // Retorna o nome do arquivo
        return fileNameboleto;
      } catch (err) {
        console.error("Erro inesperado no upload do boleto:", err);
        return null;
      }
    }
    return null;
  })
);

const arquivosBoletoFiltrados = arquivosBoleto.filter((nome) => nome !== null);



  // (NF) ----------------------------------------------------------------------============-------=========--------------

  if (!arquivo) {
    console.error("Nenhum arquivo selecionado.");
    alert("Por favor, selecione o comprovante para enviar.");
    return;
  }
  
  const fileName = `nf_${new Date().toISOString()}`; // Nome do arquivo
  let urlNF = ""; // Variável para armazenar a URL principal
  
  try {
    // Upload do arquivo para o Supabase SEM PASTA
    const { data, error } = await supabase
      .storage
      .from("notas-fiscais")
      .upload(fileName, arquivo); // Apenas o nome do arquivo, sem pasta
  
    if (error) {
      console.error("Erro no upload:", error.message);
      alert("Erro ao enviar o arquivo para o Supabase.");
      return;
    }
  
    // Verifica se o bucket é público ou privado
    const { data: publicUrlData } = supabase
      .storage
      .from("notas-fiscais")
      .getPublicUrl(fileName); // Apenas o nome do arquivo
  
    if (publicUrlData.publicUrl) {
      // Se o bucket for público, salva a URL pública
      urlNF = publicUrlData.publicUrl;
    } else {
      // Se o bucket for privado, salva apenas o caminho e gera uma URL quando necessário
      urlNF = fileName;
    }
  
    console.log("Arquivo enviado para:", urlNF);
    alert(`Arquivo enviado com sucesso! URL: ${urlNF}`);
  
  } catch (err) {
    console.error("Erro ao enviar o arquivo:", err);
    alert("Erro ao enviar o arquivo para o Supabase.");
  }
  






// DEFINIÇÕES NECESSÁRIAS --------------------------------------------------------------------------------------------------------------------

  let parcelasData = [];
  let centrosData: {
    codigo: string;
    lancadoem: string;
    data_compra: string;
    centro: string;
    valor: string | number; // Permite ambos
    percentual: string;
  }[] = [];
  let ordensDeServicoData: {
    codigo: string;
    lancadoem: string;
    data_compra: string;
    ordem: string;
    valor: string | number; // Permite ambos
    percentual: string;
  }[] = [];
 
  let totalParcelas = parcelas.length + (pagamentoEntrada ? 1 : 0); // Inclui entrada, se houver
if (totalParcelas === 0) {
  totalParcelas = 0; // Se não houver entrada nem parcelas, totalParcelas deve ser 1
}
  let numeroInicialParcelas = pagamentoEntrada ? 2 : 1;
  




  //ENVIO A TABELA PROVISIONAMENTO DE PAGAMENTO (ENTRADA, PARCELAS, PAGAMENTOS AVULSOS)



  // ENTRADA


  if (showBoletoDiv) {
    // Adicionar entrada, se houver
    if (pagamentoEntrada) {
      const entrada = {
       
        codigo: protocolo,
        lancadoem: new Date().toISOString(),
        lancadopor: nome,
        data_compra: new Date(dataCompra).toISOString(),
        empresa: fornecedor,
        cnpj: cnpjCpf,
        boleto: null,
        valor_total: valorFinal,
        valor: valorEntrada,
        venceem: dataVencimentoEntrada,
        pagoem: dataPagamentoEntrada || null,
        nparcelas: 1,
        qtdparcelas: totalParcelas,
        formapagamento: formadePagamentoEntrada,
        formaaserpago: null,
        periodicidade: "Avulso",
        origem: "Compras"
      };
  
      parcelasData.push(entrada);
    }
  
    // PARCELAS


    if (parcelas.length > 0) {
      parcelas.forEach((parcela, index) => {
        const parcelaData = {
          
          codigo: protocolo,
          lancadoem: new Date().toISOString(),
          lancadopor: nome,
          data_compra: new Date(dataCompra).toISOString(),
          empresa: fornecedor,
          cnpj: cnpjCpf,
          boleto: arquivosBoletoFiltrados[index] || null, // Adiciona a URL do boleto se existir, senão fica null
          valor_total: valorFinal,
          valor: parcela.valor,
          venceem: parcela.vencimento,
          pagoem: parcela.pagamento || null,
          nparcelas: numeroInicialParcelas + index, // Ajusta corretamente a numeração das parcelas
          qtdparcelas: totalParcelas,
          formapagamento: "Parcelado (Faturado)",
          formaaserpago: parcela.valorBoletoPix,
          periodicidade: "Avulso",
          origem: "Compras",
        };
    
        parcelasData.push(parcelaData);
      });
    }
  }


//  PAGAMENTOS AVULSOS

// PAGAMENTOS AVULSOS
formaPagamentoGeral.forEach((pagamento, index) => {
  // Ignora a forma de pagamento "Parcelado (Faturado)"
  if (pagamento.forma === "Parcelado (Faturado)") return;

  // Verifica se é um reembolso e ajusta o nome
  const formaPagamentoFinal = pagamento.forma === "Reembolso" && pagamento.nomeReembolso
    ? `Reembolso - ${pagamento.nomeReembolso}`
    : pagamento.forma;

      // Calcula vencimento
  const dataCompraDate = new Date(dataCompra);
  const vencimento = pagamento.forma === "Reembolso"
    ? new Date(dataCompraDate.setDate(dataCompraDate.getDate() + 30))
    : new Date(dataCompra); // Para outros, mantém a data da compra

  const pagamentoUnico = {
    codigo: protocolo,
    lancadoem: new Date().toISOString(),
    lancadopor: nome,
    data_compra: new Date(dataCompra).toISOString(),
    empresa: fornecedor,
    cnpj: cnpjCpf,
    valor_total: valorFinal,
    valor: pagamento.valor,
    venceem: vencimento.toISOString(), // <-- vencimento ajustado
    pagoem: pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toISOString() : null, // Data do pagamento preenchida no formulário
    nparcelas: 0,  // <- Agora é zero
    qtdparcelas: totalParcelas,
    formapagamento: formaPagamentoFinal,
    formaaserpago: null,
    periodicidade: "Avulso",
    origem: "Compras",
  };

  parcelasData.push(pagamentoUnico);
});


  //ENVIO A TABELA GERENCIAMENTO DE COMPRAS


  // Calcular a quantidade total de produtos
    const quantidadeTotalProdutos = produtos.length;
  // Dados adicionais que precisam ser enviados para a outra tabela
    const dadosAdicionais = {
   
    codigo: protocolo,
    nf: fileName,
    data_lancamento: new Date().toISOString(),
    lancadopor: nome,
    comprovante: comprovante,
    numero_comprovante: ncomprovante,
    data_compra: new Date(dataCompra).toISOString(),
    valor_total: Number(String(valorTotal).replace(',', '.')), // Convertendo para número
    desconto: Number(String(valorDesconto).replace(',', '.')), // Convertendo para número
    valor_liquido: Number(String(valorFinal).replace(',', '.')), // Convertendo para número
    cnpj_cpf: cnpjCpf,
    fornecedor: fornecedor,
    tem_icms: temIcms, // Booleano
    icms_valor: temIcms ? (valorTotal * 0.18).toFixed(2) : null, // Calculando ICMS apenas se marcado
    centros_de_custo: centros.map(item => `${item.centro};${item.valor}%`)
  .join(';'),
    ordens_de_servico: ordensDeServico.map(item => `${item.ordem};${calcularPercentual(item.valor)}`).join(';'),
    quantidade_produtos: quantidadeTotalProdutos, // Adicionando a quantidade total de produtos
  };



// ENVIO A TABELA ORDEM DE SERVIÇO
if (ordensDeServico.length > 0) {
  ordensDeServico.forEach((ordem) => {
      // Calcular o percentual em relação ao total
      
    const percentual = (Number(ordem.valor) / valorFinal) * 100;

    const ordemData = {
      
      codigo: protocolo,  // Código do protocolo
      lancadoem: new Date().toISOString(),  // Data do lançamento
      data_compra: new Date(dataCompra).toISOString(),  // Data da compra
      ordem: ordem.ordem,  // Identificador da ordem de serviço
      valor: ordem.valor,  // Valor da ordem de serviço
      percentual: percentual.toFixed(2),  // Percentual calculado com 2 casas decimais
    };

    ordensDeServicoData.push(ordemData);
  });
}
//ENVIO A TABELA CENTROS DE CUSTO
// Verifica se há Centros de Custo antes de percorrer
if (centros.length > 0) {
  centros.forEach((centro) => {
    const valorCalculado = (Number(centro.valor) / 100) * valorFinal;

    const centroData = {
      codigo: protocolo,
      lancadoem: new Date().toISOString(),
      data_compra: new Date(dataCompra).toISOString(),
      centro: centro.centro, // Nome do centro
      percentual: centro.valor, // Percentual informado (50, 30, 20...)
      valor: valorCalculado.toFixed(2), // Valor calculado baseado no percentual
    };

    centrosData.push(centroData);
  });
}



let produtosData: { 
  
  codigo: string; 
  cnpj_cpf: string; 
  fornecedor: string; 
  comprovante: string; 
  numero_comprovante: string; 
  data_lancamento: string; 
  data_compra: string; 
  tipo: string; 
  discriminacao: string | null; 
  subcategoria: string | null;
  nome: string; 
  valor_unitario: number; 
  qtd: number; 
  valor_total: number; 
  classificacao_tributaria: string | null; 
  und: string; 
  marca: string | null; 
}[] = [];

produtos.forEach((produto, index) => {
  const produtoData = {
    
    codigo: protocolo,
    cnpj_cpf: cnpjCpf,
    fornecedor: fornecedor,
    comprovante: comprovante,
    numero_comprovante: String(ncomprovante),
    data_lancamento: new Date().toISOString(),
    lancadopor: nome,
    data_compra: new Date(dataCompra).toISOString(),
    item: index,
    tipo: produto.tipo,
    discriminacao: produto.categoriaSelecionada,
    subcategoria: produto.subcategoriaSelecionada,
    nome: produto.produto,
    valor_unitario: produto.valorUnitario,
    qtd: produto.quantidade,
    valor_total: produto.valorTotal,
    classificacao_tributaria: produto.classificacaoTributaria,
    und : produto.unidade,
    marca: produto.marca || null,
  };

  produtosData.push(produtoData);
});



try {
  // Inserir os dados no Supabase e capturar os erros individualmente
  const { error: error1 } = await supabase.from("provisao_pagamentos").insert(parcelasData);
  if (error1) console.error("Erro ao salvar dados na tabela provisao_pagamentos:", error1);

  const { error: error2 } = await supabase.from("gerenciamento_compras").insert(dadosAdicionais);
  if (error2) console.error("Erro ao salvar dados na tabela gerenciamento_compras:", error2);

  const { error: error3 } = await supabase.from("produtos").insert(produtosData);
  if (error3) console.error("Erro ao salvar dados na tabela produtos:", error3);

  const { error: error4 } = await supabase.from("centros_de_custo").insert(centrosData);
  if (error4) console.error("Erro ao salvar dados na tabela centros_de_custo:", error4);

  const { error: error5 } = await supabase.from("ordens_de_servico").insert(ordensDeServicoData);
  if (error5) console.error("Erro ao salvar dados na tabela ordens_de_servico:", error5);

  // Verifica se houve erro em alguma inserção
  if (error1 || error2 || error3 || error4 || error5) {
      alert("Erro ao salvar. Verifique os logs para mais detalhes.");
  } else {
      console.log("Dados salvos com sucesso!");
      alert("Dados enviados com sucesso!");
      limparTodosOsForms(); // Limpar os campos
      setIsSaving(false); // Define como falso após o envio



      await enviarMensagemWhatsApp();
      localStorage.removeItem('pedidoSelecionado');



  }
} catch (error) {
  console.error("Erro inesperado:", error);
  alert("Erro ao salvar. Tente novamente.");
} finally {
setLoading(false)
}

};



// Função para limpar os campos do formulário
const limparTodosOsForms = () => {
  window.location.reload();
};







  useEffect(() => {
    setShowBoletoDiv(formaPagamentoGeral.some((item) => item.forma === "Parcelado (Faturado)"));
  }, [formaPagamentoGeral]);



  return (
    <div className="mt-0 p-4 bg-white shadow-lg rounded-xl max-w-4/5 mx-auto">
              {/* Passando a função handleNavClick como onNavClickAction */}

<h1 className="flex items-center gap-3 text-2xl mt-10 font-bold mb-8 text-gray-800">
 
  <CreditCard className="w-7 h-7 text-blue-500" />
  Cadastro de Compra
</h1>

      <div className={`content flex-1 p-1 min-h-screen w-90% `}
           >
     

      {/* Formulário de Cadastro de Compra */}
    <Card >
      <CardContent 
            className=" h-auto"
            
            >
          
           {/* Informações Gerais da Compra */}
          <form className="space-y-0 mb-5 w-full">   
            {/* Linha(1) */}        
            <div className="flex w-auto gap-5 mb-2">


              <div className="flex flex-col w-1/4">
                  <label className=" text-sm font-large  font-bold"> Pedido de nº</label>
                  <input
                    className={`
                      px-3 py-2 bg-yellow-100
                      border-1 border-gray-300 h-11 rounded-md 
                      transition-all duration-100 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      hover:border-gray-400 
                      ${pedidon ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                    `}
                    type="number"
                    readOnly
                    value={pedidon || ""} // Preenche o input com o valor de pedidon, caso exista                   
                    required={isSaving} // Aplica o required apenas quando o formulário for enviado
                                  
                  />
              </div>

                          <div className="flex flex-col w-1/4">
                  <label className="block text-sm font-large font-bold">Comprovante</label>
                  <select
                    value={comprovante}
                    onChange={(e) => setComprovante(e.target.value)}
                    className={`
                      px-3 py-2 
                      border-1 border-gray-300 h-11 rounded-md 
                      transition-all duration-100 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      hover:border-gray-400 
                      ${comprovante ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                    `}
                    required={enviarFormulario} // Aplica o required apenas quando o formulário for enviado
                  >
                    <option value="">Selecione</option>
                    <option value="Nota Fiscal">Nota Fiscal</option>
                    <option value="Cupom Fiscal">Cupom Fiscal</option>
                    <option value="Fatura de Locação">Fatura de Locação</option>
                    <option value="Recibo">Recibo</option>
                    <option value="Outro">Outro</option>
                    <option value="Sem Nota">Sem Nota</option>
                  </select>
                </div>

                
                <div className="p-0 flex flex-col w-1/4">
                  <label className="block text-sm font-large font-bold">Número (comprovante)</label>
                  <input
                    type="number"
                    value={String(ncomprovante)}
                    onChange={(e) => setNComprovante(e.target.value)}
                    required={isSaving} // Aplica o required apenas quando o formulário for enviado
                    className={`                      
                      px-3 py-2 
                      border-1 border-gray-300 rounded-md 
                      transition-all duration-100 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      hover:border-gray-400 
                      ${ncomprovante ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                    `}
                  />
                </div>

                  {/* Botão para abrir digitalização */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMostrarDigitalizacao(true);
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 h-10 py-2 mt-5 rounded-lg flex items-center gap-1 text-sm transition-all"
                    >
                      <Camera size={16} />
                      Buscar 
                    </button>



                   {/* MODAL de Digitalização */}
      <Dialog open={mostrarDigitalizacao} onOpenChange={setMostrarDigitalizacao}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Procurar comprovante</DialogTitle>
          </DialogHeader>
          <DigitalizacaoNotaFiscal
      onSuccess={(file: File) => {  // Tipando o parâmetro file como File
        setArquivo(file);
        setMostrarDigitalizacao(false);
      }}
          />
        </DialogContent>
      </Dialog>

      {/* Exibição do Arquivo Digitalizado */}
      {arquivo && (
        <div className="mt-7">
          <p className="text-green-600">Arquivo pronto: {arquivo.name}</p>
        </div>
      )}
        
                                
            </div>

          

                              {/* Linha(4)*/}
              <div className="flex w-full gap-5 mb-2">

<div className="p-0 flex flex-col w-94">
    <label className="block text-sm font-large font-bold">CNPJ | CPF</label>
    <input
      type="text"
      value={cnpjCpf}
      onChange={handleInputChange}
      required={isSaving}
      className={`                     
        px-3 py-2 
       border-1 border-gray-300 rounded-md 
       transition-all duration-100 
       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
       hover:border-gray-400 
       ${cnpjCpf ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
     `}
    />
</div>


<div className="flex flex-col w-3/4">
    <label className="block text-sm font-large font-semibold ">Fornecedor</label>
    <input
      type="text"
      value={fornecedor}
      onChange={(e) => setFornecedor(e.target.value)}
      required={isSaving}
      className={`                     
        px-3 py-2 
       border-1 border-gray-300 rounded-md border-1
       transition-all duration-100 
       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
       hover:border-gray-400 
       ${fornecedor ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
     `}
    />
</div>
</div>


           {/* Linha(3)*/}
            <div className="flex w-auto gap-5 mb-2">

            <div className="flex flex-col w-98">
                    <label className="block text-sm font-large font-bold">Data de Compra</label>
                    <input
                      type="date"
                      value={dataCompra}
                      onChange={(e) => setDataCompra(e.target.value)}
                      required={isSaving}
                      className={`
                      
                         px-3 py-2 
                        border-1 border-gray-300 rounded-md 
                        transition-all duration-100 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        hover:border-gray-400 
                        ${dataCompra ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                      `}
                    />
                </div>

                  {/* Input para Valor Total */}
                  <div className="flex flex-col w-1/4">
                    <label className="block text-sm font-large font-bold">Valor (R$)</label>
                    <input
                      type="text" // Mudado para "text" para permitir formatação em moeda
                      value={formatarMoeda(valorTotal)}
                      onChange={handleTotalChange}
                      required={isSaving}
                      className={`                     
                         px-3 py-2 
                        border-1 border-gray-300 rounded-md 
                        transition-all duration-100 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        hover:border-gray-400 
                        ${valorTotal ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                      `}
                      
                    />
                  </div>

                  {/* Input para Desconto */}
                  <div className="flex flex-col w-1/4">
                    <label className="block text-sm font-large font-bold">Desconto</label>
                    <input
                      type="text" // Mudado para "text" para permitir formatação em moeda
                      value={formatarMoeda(valorDesconto)}
                      onChange={handleDescontoChange}
                      required={isSaving}
                      className={`                     
                        px-3 py-2 
                       border-1 border-gray-300 rounded-md 
                       transition-all duration-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       hover:border-gray-400 
                       ${valorDesconto ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                     `}
                    />
                  </div>

                  {/* Input para Valor Líquido - Desabilitado para edição */}
                  <div className="flex flex-col w-1/4">
                    <label className="block text-sm font-large font-bold">Valor Líquido</label>
                    <input
                      type="text"
                      className="bg-yellow-100 px-3 py-2 border-1 border-gray-300 rounded-md"
                      value={formatarMoeda(valorFinal)}
                      disabled // Impede edição manual
                    />
                  </div>


            </div>


            

      

          </form>
        </CardContent>
    </Card>

    {/* Forma de pagamento */}
    <Card >
    <CardContent 
            className=" h-auto  mt-[3px]"
            
            >
          
           {/* Informações Gerais da Compra */}
          <form className="space-y-4 mb-5 w-full"> 

                  {/* Forma de pagamento */}
      <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
        <label className="block text-sm font-bold">Forma de Pagamento</label>
        <select
          onChange={(e) => adicionarFormaPagamento(e.target.value)}
          className="p-2 border bg-white rounded"
          disabled={valorTotal <= 0}  // Desabilita o select até o valor total ser inserido
        >
          <option value="">Selecione</option>
          <option value="Parcelado (Faturado)">Parcelado (Faturado)</option>
          <option value="PIX - BNB">PIX - BNB</option>
          <option value="PIX - Santander">PIX - Santander</option>
          <option value="PIX - Itaú">PIX - Itaú</option>
          <option value="Cartão Carrefour">Cartão Carrefour</option>
          <option value="Cartão Caju - CL">Cartão Caju - CL</option>
          <option value="Cartão Caju - LS">Cartão Caju - LS</option>
          <option value="Cartão Caju - FL">Cartão Caju - FL</option>
          <option value="Cartão Caju - IQ">Cartão Caju - IQ</option>
          <option value="4225 - Débito">4225 - Débito</option>
          <option value="4225 - Crédito">4225 - Crédito</option>
          <option value="5092 - Débito">5092 - Débito</option>
          <option value="5092 - Crédito">5092 - Crédito</option>
          <option value="7414 - Débito">7414 - Débito</option>
          <option value="7414 - Crédito">7414 - Crédito</option>
          <option value="Cartão Veloe">Cartão Veloe</option>
          <option value="Reembolso">Reembolso</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      {/* Distribuição dos valores */}
      {formaPagamentoGeral.length > 0 && (
  <div className="mt-4">
    {formaPagamentoGeral.map((item, index) => (
      <div key={index} className="flex items-center gap-2 mt-2">
        <span className="w-50 text-gray-900 font-bold">{item.forma}</span>

        {item.forma === "Reembolso" ? (
          <div className="flex gap-2">
            <select
              value={item.nomeReembolso}
              onChange={(e) => atualizarNomeReembolso(index, e.target.value)}
              className="p-2 bg-white border border-gray-300 rounded-md w-80"
            >
             <option value="">Selecione</option>
              <option value="Luís Fillipe">Luís Fillipe</option>
              <option value="Antônio Marcos">Antônio Marcos</option>
              <option value="João Paulo">João Paulo</option>
              <option value="Caio Lino">Caio Lino</option>
              <option value="Márcia Vieira">Márcia Vieira</option>
              <option value="Lucas Markes">Lucas Markes</option>
              <option value="Izabel Quintiliano">Izabel Quintiliano</option>
            </select>

            <input
              type="text"
              inputMode="numeric"
              value={item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              onChange={(e) => atualizarValor(index, e)}
              className="p-2 bg-white border border-gray-300 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              onChange={(e) => atualizarValor(index, e)}
              className="p-2 bg-white border border-gray-300 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Se não for Parcelado (Faturado), exibe o campo de data */}
            {item.forma !== "Parcelado (Faturado)" && (
              <input
                type="date"
                value={item.dataPagamento || ""}
                onChange={(e) => atualizarDataPagamento(index, e.target.value)}
                className="p-2 bg-white border border-gray-300 rounded-md"
              />
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            removerFormaPagamento(index);
          }}
          className="p-1 text-red-500 hover:text-red-900 focus:outline-none"
        >
          ❌
        </button>
      </div>
    ))}
  </div>
)}


          </form>
    </CardContent>
    </Card>
      
    {showBoletoDiv && (
    <Card>
      <CardContent 
        className="h-auto mb-10 mt-[3px]"
     
        > 
         <form className="space-y-4 w-full">   
         {/* Entrada e Parcelas */}
          <div className="mt-2 bg-white border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 ">Parcelamento:</h3>

              <div className="flex items-center gap-4">
                        {/* Checkbox para marcar se houve pagamento de entrada */}
                        <label className="text-sm ">Houve pagamento de entrada?</label>
                        <input
                          type="checkbox"
                          checked={pagamentoEntrada}
                          onChange={(e) => setPagamentoEntrada(e.target.checked)}
                        />
              </div>

              {pagamentoEntrada && (
              <div className="mt-4">
                          {/* Valor e Data de Vencimento */}
                          <div className="flex gap-5">
                            <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/3">
                              <label className="block text-sm font-large font-bold">Valor da Entrada</label>
                              <input
                                type="number"
                                value={valorEntrada}
                                onChange={(e) => setValorEntrada(e.target.value)}
                                
                                className={`
                                  px-3 py-2 
                                  border-1 border-gray-300 h-11 rounded-md 
                                  transition-all duration-100 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                  hover:border-gray-400 
                                  ${valorEntrada ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                `}
                              />
              </div>

              <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/3">
                              <label className="block text-sm font-large font-bold">Data de Vencimento</label>
                              <input
                                type="date"
                                value={dataVencimentoEntrada}
                                onChange={(e) => setDataVencimentoEntrada(e.target.value)}
                                
                                className={`
                                  px-3 py-2 
                                  border-1 border-gray-300 h-11 rounded-md 
                                  transition-all duration-100 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                  hover:border-gray-400 
                                  ${dataVencimentoEntrada ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                `}
                              />
              </div>

              <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/3">
                              <label className="block text-sm font-large font-bold">Data de Pagamento</label>
                              <input
                                type="date"
                                value={dataPagamentoEntrada}
                                onChange={(e) => setDataPagamentoEntrada(e.target.value)}
                                
                                className={`
                                  px-3 py-2 
                                  border-1 border-gray-300 h-11 rounded-md 
                                  transition-all duration-100 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                  hover:border-gray-400 
                                  ${dataPagamentoEntrada ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                `}
                              />
              </div>

              <div className="flex flex-col sm:flex-row w-full sm:w-full lg:w-full">
                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                  <label className="block text-sm font-large font-bold">Forma de Pagamento</label>
                  <select
                    onChange={(e) => setFormadePagamentoEntrada(e.target.value)} // Atualiza o estado com a seleção
                    className={`
                      px-3 py-2 
                      border-1 border-gray-300 h-11 rounded-md 
                      transition-all duration-100 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                      hover:border-gray-400 
                      ${formadePagamentoEntrada ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                    `}
                    value={formadePagamentoEntrada} // O valor do select é controlado pelo estado
                  >
                    <option value="">Selecione</option>                    
                    <option value="PIX - BNB">PIX - BNB</option>
                    <option value="PIX - Santander">PIX - Santander</option>
                    <option value="PIX - Itaú">PIX - Itaú</option>
                    <option value="Cartão Carrefour">Cartão Carrefour</option>
                    <option value="Cartão Caju - CL">Cartão Caju - CL</option>
                    <option value="Cartão Caju - LS">Cartão Caju - LS</option>
                    <option value="Cartão Caju - FL">Cartão Caju - FL</option>
                    <option value="Cartão Caju - IQ">Cartão Caju - IQ</option>
                    <option value="4225 - Débito">4225 - Débito</option>
                    <option value="4225 - Crédito">4225 - Crédito</option>
                    <option value="5092 - Débito">5092 - Débito</option>
                    <option value="5092 - Crédito">5092 - Crédito</option>
                    <option value="7414 - Débito">7414 - Débito</option>
                    <option value="7414 - Crédito">7414 - Crédito</option>
                    <option value="Cartão Veloe">Cartão Veloe</option>
                    <option value="Reembolso - Luis Fillipe">Reembolso - Luis Fillipe</option>
                    <option value="Reembolso - Antônio Marcos">Reembolso - Antônio Marcos</option>
                    <option value="Reembolso - João Paulo">Reembolso - João Paulo</option>
                    <option value="Reembolso - Márcia Vieira">Reembolso - Márcia Vieira</option>
                    <option value="Reembolso - José Luiz">Reembolso - José Luiz</option>
                    <option value="Reembolso - Isabel Quintiliano">Reembolso - Isabel Quintiliano</option>
                    <option value="Reembolso - Lucas Markes">Reembolso - Lucas Markes</option>
                    <option value="Reembolso - Caio Lino">Reembolso - Caio Lino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

              </div>


            </div>
              </div>
                      )}

              {/* Adicionar Parcelas */}
              <div className="mt-6 w-auto">
                    {parcelas.map((parcela, index) => (
                      <div key={index}className="flex flex-wrap gap-5 p-7 mt-2 w-full rounded-xl border border-gray-300 bg-[rgba(240,227,227,0.9)] shadow-[inset_4px_4px_6px_rgba(0,0,0,0.1),inset_-4px_-4px_6px_rgba(255,255,255,0.7)]">
                                <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/5">
                                  <label className="block text-sm font-large font-bold">Valor da Parcela</label>
                                  <input
                                    type="number"
                                    value={parcela.valor}
                                    onChange={(e) => handleParcelaChange(index, "valor", e.target.value)}
                                    
                                    className={`
                                      px-3 py-2 
                                      border-1 border-gray-300 h-11 rounded-md 
                                      transition-all duration-100 
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                      hover:border-gray-400 
                                      ${parcela.valor ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                    `}
                                  />
                                </div>


                                <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/5">
                                  <label className="block text-sm font-large font-bold">Data de Vencimento</label>
                                  <input
                                    type="date"
                                    value={parcela.vencimento}
                                    onChange={(e) => handleParcelaChange(index, "vencimento", e.target.value)}
                                    
                                    className={`
                                      px-3 py-2 
                                      border-1 border-gray-300 h-11 rounded-md 
                                      transition-all duration-100 
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                      hover:border-gray-400 
                                      ${parcela.vencimento ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                    `}
                                  />
                                </div>
                            <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/5">
                              <label className="block text-sm font-large font-bold">Data de Pagamento</label>
                              <input
                                type="date"
                                value={parcela.pagamento}
                                onChange={(e) => handleParcelaChange(index, "pagamento", e.target.value)}
                                
                                className={`
                                  px-3 py-2 
                                  border-1 border-gray-300 h-11 rounded-md 
                                  transition-all duration-100 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                  hover:border-gray-400 
                                  ${parcela.pagamento ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                `}
                              />
                             </div>

                             <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/5">
                              <label className="block text-sm font-large font-bold">n° PIX ou Boleto</label>
                              <input
                                type="string"
                                value={parcela.valorBoletoPix}
                                onChange={(e) => handleParcelaChange(index, "valorBoletoPix", e.target.value)}
                                
                                className={`
                                  px-3 py-2 
                                  border-1 border-gray-300 h-11 rounded-md 
                                  transition-all duration-100 
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                  hover:border-gray-400 
                                  ${parcela.valorBoletoPix ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                                `}
                              />
                             </div>

                            <div className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/3">
                              <label className="text-sm font-large font-bold">Vincular boleto</label>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleBoletoChange(index, e.target.files[0]);
                                  }
                                }}
                                className="p-2 border rounded"
    />
    {parcela.boleto && (
      <p className="text-sm mt-2">Boleto anexado: {parcela.boleto.name}</p>
    )}
                             
                            </div>

                                <button
                                  type="button"
                                  onClick={() => removeParcela(index)}
                                  className="flex flex-col w-1/3 sm:w-1/2 lg:w-1/5 mt-7 font-bold text-red-700 text-left"
                                >
                                  - Parcela
                                </button>

                      </div>
                    ))}
<button
  type="button"
  onClick={adicionarParcela}
  className="group mt-4 mb-20 w-50 hover:w-90  bg-gray-900 text-gray-200 font-bold px-5 py-2 rounded-sm shadow-sm border border-white transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-900"
>
  <span className="">+ Parcela</span>
  
</button>
              </div>
          </div>
        </form>
      </CardContent>
    </Card>
    )}

     {/* Centro de Custo, Ordem de Serviço */}
<div className="md:col-span-2 bg-white border rounded-2xl p-6">
  <h2 className="text-lg font-semibold  mb-4">Centros de Custo:</h2>

  {/* Formulário de adição */}
  <div className="flex gap-4 mb-4">
    <select
      value={centroNome}
      onChange={(e) => setCentroNome(e.target.value)}
      className="border rounded-xl px-4 py-2 w-1/2"
    >
      <option value="">Selecione o centro</option>
      <option value="GE">GE</option>
      <option value="ENEVA">ENEVA</option>
      <option value="MOSAIC">MOSAIC</option>
      <option value="STANZA">STANZA</option>
      <option value="GALPÃO">GALPÃO</option>
    </select>

    <input
      type="number"
      placeholder="%"
      value={centroValor}
      onChange={(e) => setCentroValor(e.target.value)}
      className="border rounded-xl px-4 py-2 w-1/4"
      min={0}
      max={100}
    />

    <button
      type="button"
      onClick={adicionarCentroCusto}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
    >
      Adicionar
    </button>
  </div>

  {/* Lista dos centros adicionados */}
  <ul className="space-y-2">
    {centros.map((c, index) => (
      <li
        key={index}
        className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-xl"
      >
        <span>
          {c.centro} — {c.valor}%
        </span>
        <button
          type="button"
          onClick={() => removerCentroCusto(index)}
          className="text-red-600 hover:underline"
        >
          Remover
        </button>
      </li>
    ))}
  </ul>

  {/* Total dos percentuais */}
  <div className="mt-2 text-sm">
    Total: <strong>{calcularTotalPercentual()}%</strong>
  </div>
</div>



    {/* Cadastro de Produtos */}
    <Card>
      <CardContent
          className="border rounded-t-2xl rounded-b-none bg-white p-5 mt-6"

          
        >
          <h1 className="text-lg font-semibold mb-15">Cadastrar Produto/Serviço: </h1>

          <form className="space-y-4">

          {/* lINHA 1 */}
          <div className="flex mb-0 gap-5 w-full">
            {/* ComboBox Tipo */}
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4 relative">
              <label className="block text-sm font-semibold">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value)
                  setCategoriaSelecionada(""); // Resetar Categoria ao trocar Tipo
                  setSubcategoriaSelecionada(""); // Resetar Subcategoria também;                  
                }}
                className={`
                  px-3 py-2 
                  border-1 border-gray-300 h-11 rounded-md 
                  transition-all duration-100 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  hover:border-gray-400 
                  ${tipo? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                `}
              >
                <option value="" disabled>Selecione</option>
                <option value="Produto">Produto</option>
                <option value="Serviço">Serviço</option>
              </select>
            </div>
            
              {/* Produto */}
              <div className="flex flex-col w-full">
              <label className="block text-sm font-semibold">Produto/Serviço</label>
              <input type="text"
              className={`
                px-3 py-2 
                border-1 border-gray-300 h-11 rounded-md 
                transition-all duration-100 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                hover:border-gray-400 
                ${produto? "bg-green-100 border-green-700 border-1" : "bg-white"} 
              `} value={produto} onChange={(e) => setProduto(e.target.value)} onBlur={handleClassificar} required={isSaving} />
            </div>
             
          </div>
          {/*lINHA 2*/}
          <div className="flex gap-5 w-full mt-2">
                   {/* Categoria */}
{/* Categoria */}
<div>
  <label className="block text-sm font-semibold">Categoria</label>
  <select
    value={categoriaSelecionada}
    disabled={true} // sempre desabilitado para o usuário não escolher
    className={`px-3 py-2 border-1 h-11 rounded-md 
      transition-all duration-100  
      focus:outline-none focus:ring-2 
      bg-gray-200 cursor-not-allowed 
      ${categoriaSelecionada ? "bg-green-100 border-green-700 border-1" : "bg-white"}`}
  >
    <option value="">Selecione...</option>
    {Object.keys(getCategorias()).map((categoria) => (
      <option key={categoria} value={categoria}>
        {categoria}
      </option>
    ))}
  </select>
</div>

{/* Subcategoria */}
<div>
  <label className="block text-sm font-semibold">Subcategoria</label>
  <select
    value={subcategoriaSelecionada}
    disabled={true} // sempre desabilitado
    className={`px-3 py-2 border-1 border-gray-300 h-11 rounded-md 
      transition-all duration-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
      bg-gray-200 cursor-not-allowed 
      ${subcategoriaSelecionada ? "bg-green-100 border-green-700 border-1" : "bg-white"}`}
  >
    <option value="">Selecione...</option>
    {(getCategorias()[categoriaSelecionada] || []).map((subcategoria) => (
      <option key={subcategoria} value={subcategoria}>
        {subcategoria}
      </option>
    ))}
  </select>
</div>
             {/* Unidade */}
<div className="flex flex-col w-1/4 sm:w-1/2 lg:w-1/4 relative">
  <label className="block text-sm font-semibold">Unidade</label>
  <select
    value={unidade}
    onChange={(e) => setUnidade(e.target.value)}
    disabled={tipo === "Serviço"}  // bloqueia o select se for serviço
    className={`
      px-3 py-2 
      border-1 border-gray-300 h-11 rounded-md 
      transition-all duration-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
      hover:border-gray-400 
      ${unidade ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
      ${tipo === "Serviço" ? "bg-gray-200 cursor-not-allowed" : ""}
    `}
  >
    <option value="">Selecione</option>

<option value="alqueire">Alqueire</option>
<option value="ampola">Ampola</option>
<option value="ano">Ano</option>
<option value="arroba">Arroba</option>
<option value="balde">Balde</option>
<option value="barril">Barril (bbl)</option>
<option value="bisnaga">Bisnaga</option>
<option value="bloco">Bloco</option>
<option value="bobina">Bobina</option>
<option value="caixa">Caixa</option>
<option value="cartela">Cartela</option>
<option value="centena">Centena</option>
<option value="centimetro">Centímetro (cm)</option>
<option value="centimetro_cubico">Centímetro cúbico (cm³)</option>
<option value="centimetro_quadrado">Centímetro quadrado (cm²)</option>
<option value="conjunto">Conjunto</option>
<option value="dia">Dia</option>
<option value="duzia">Dúzia</option>
<option value="envelope">Envelope</option>
<option value="fardo">Fardo</option>
<option value="frasco">Frasco</option>
<option value="frasco-ampola">Frasco-ampola</option>
<option value="g">Grama (g)</option>
<option value="galao">Galão</option>
<option value="galao_volume">Galão (volume)</option>
<option value="hectare">Hectare</option>
<option value="hora">Hora</option>
<option value="jarda">Jarda (yd)</option>
<option value="kg">Quilograma (kg)</option>
<option value="kit">Kit</option>
<option value="kwh">Quilowatt-hora (kWh)</option>
<option value="libra">Libra (lb)</option>
<option value="litro">Litro (L)</option>
<option value="lote">Lote</option>
<option value="mes">Mês</option>
<option value="metro">Metro (m)</option>
<option value="metro_cubico">Metro cúbico (m³)</option>
<option value="metro_linear">Metro Linear</option>
<option value="metro_quadrado">Metro quadrado (m²)</option>
<option value="mg">Miligrama (mg)</option>
<option value="milheiro">Milheiro</option>
<option value="mililitro">Mililitro (ml)</option>
<option value="milimetro">Milímetro (mm)</option>
<option value="numero_usuarios">Número de Usuários</option>
<option value="onca">Onça (oz)</option>
<option value="pacote">Pacote</option>
<option value="palete">Palete</option>
<option value="par">Par</option>
<option value="pe">Pé (ft)</option>
<option value="pe_quadrado">Pé quadrado (sqft)</option>
<option value="peca">Peça</option>
<option value="polegada">Polegada (in)</option>
<option value="quilometro">Quilômetro (km)</option>
<option value="quilote">Quilote</option>
<option value="rolo">Rolo</option>
<option value="saco">Saco</option>
<option value="sache">Sachê</option>
<option value="semana">Semana</option>
<option value="tambor">Tambor</option>
<option value="tonelada">Tonelada (t)</option>
<option value="tubo">Tubo</option>
<option value="turno">Turno</option>
<option value="unidade">Unidade</option>
<option value="unidade_acesso">Unidade de Acesso</option>
<option value="unidade_consumo">Unidade de Consumo</option>
<option value="unidade_fiscal">Unidade Fiscal</option>
<option value="unidade_impressao">Unidade de Impressão</option>
<option value="unidade_servico">Unidade de Serviço</option>
<option value="unidade_tecnica">Unidade Técnica</option>
<option value="volume">Volume</option>
<option value="serviço">Serviço</option>

              </select>
            </div>
{/* Marca */}
<div className="flex flex-col w-1/4 ">
  <label className="block text-sm font-semibold">Marca</label>
  <input
    type="text"
    value={marca}
    onChange={(e) => setMarca(e.target.value)}
    disabled={tipo === "Serviço"}
    required={isSaving}
    className={`
      px-3 py-2 
      border-1 border-gray-300 h-11 rounded-md 
      transition-all duration-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
      hover:border-gray-400 
      ${marca ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
      ${tipo === "Serviço" ? "bg-yellow-100 cursor-not-allowed" : ""}
    `}
  />
</div>


          </div>
          {/*lINHA 3*/}
          <div className="flex  gap-5 w-full">
            {/* Class. Tributária */}
            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4 relative">
              <label className="block text-sm font-semibold">Class. Tributária</label>
              <select
                value={classificacaoTributaria}
                onChange={(e) => setClassificacaoTributaria(e.target.value)}
                className={`
                  px-3 py-2 
                  border-1 border-gray-300 h-11 rounded-md 
                  transition-all duration-100 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  hover:border-gray-400 
                  ${classificacaoTributaria? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                `}
              >
                <option value="" disabled>Selecione</option>
                <option value="Bem de consumo">Bem de consumo</option>
                <option value="Revenda">Revenda</option>
              </select>
            </div>
            {/* Valor Unitário */}
            <div className="flex flex-col w-full sm:w-1/4">
  <label className="block text-sm font-semibold">Valor Unitário (R$)</label>
  <input
    type="text"
    inputMode="numeric"
    value={valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    onChange={(e) => handleValorUnitarioChange(e)}
    className={`
      px-3 py-2 
      border-1 border-gray-300 h-11 rounded-md 
      transition-all duration-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
      hover:border-gray-400 
      ${valorUnitario ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
    `}
    required={isSaving}
  />
</div>

            {/* Quantidade */}
            <div className="flex flex-col w-full sm:w-1/4">
                <label className="block text-sm font-semibold">Quantidade</label>
                <input
                  type="number"
                  value={quantidade.toString()}
                  onChange={handleQuantidadeChange}
                  className={`
                    px-3 py-2 
                    border-1 border-gray-300 h-11 rounded-md 
                    transition-all duration-100 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    hover:border-gray-400 
                    ${quantidade? "bg-green-100 border-green-700 border-1" : "bg-white"} 
                  `}
                  required={isSaving}
                />
            </div>

            {/* Valor Total */}
            <div className="flex flex-col w-full sm:w-1/4">
  <label className="block text-sm font-semibold">Valor Total (R$)</label>
  <input
    type="text"
    className={`
      px-3 py-2 
      border-1 border-gray-300 h-11 rounded-md 
      transition-all duration-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
      hover:border-gray-400 
      ${produtoValorTotal ? "bg-green-100 border-green-700 border-1" : "bg-white"} 
    `}
    value={produtoValorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    disabled
  />
</div>
          </div>

          <button
            type="button"
            onClick={adicionarProduto}
            className="group mt-4 mb-20 w-50 bg-gray-900 text-gray-200 font-bold px-5 py-2 rounded-sm shadow-sm border border-white transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-900"
          >
           
            <span className="">Adicionar Produto</span>
          </button>

          </form>
        </CardContent>
    </Card>

      {/* Tabela Dinâmica */}
      {produtos.length > 0 && (
    <Card>
    <CardContent
       className="bg-white border rounded-b-2xl rounded-t-none p-5"
        
      >
    
      
      <div className="overflow-x-auto ">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-800 text-gray-200 text-xs ">
            <tr>
              {[
                "Tipo",
                "Categoria",
                "Subcategoria",
                "Produto/Serviço",
                "Valor Unitário (R$)",
                "Quantidade",
                "Valor Total (R$)",
                "Class. Tributária",
                "Unidade",
                "Marca",
                "Ação",
              ].map((header) => (
                <th key={header} className="py-2 px-3 border-r border-gray-600 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-300 hover:bg-gray-50 transition text-xs"
              >
                <td className="py-2 px-3 border-r border-gray-300">{item.tipo}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.categoriaSelecionada}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.subcategoriaSelecionada}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.produto}</td>
                <td className="py-2 px-3 border-r border-gray-300">R$ {item.valorUnitario}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.quantidade}</td>
                <td className="py-2 px-3 border-r border-gray-300">R$ {item.valorTotal}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.classificacaoTributaria}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.unidade}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.marca}</td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => removerProduto(index)}
                    className="text-red-500 hover:text-red-700 transition font-medium"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center">
{loading && (
  <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
    <svg
      className="animate-spin h-10 w-10 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  </div>
)}

<button
  id="botaoSalvar"
  type="button"
  onClick={salvarProvisionamento}
  disabled={loading} // Desabilita quando está carregando
  className={`mt-10 w-120 px-10 py-3 text-sm font-bold rounded-sm border 
    ${
      loading
        ? 'bg-gray-400 text-white cursor-not-allowed'
        : 'bg-gray-200 text-gray-900 border-gray-300 hover:bg-white hover:scale-105 transition-all'
    }
  `}
>
  {loading ? (
    <>
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      Salvando...
    </>
  ) : (
    'Finalizar Cadastro'
  )}
</button>

      </div>
    

    </CardContent>
    </Card>
      )}


      

      </div>
     </div>
    
  );
}

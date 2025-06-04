"use client"
import {
  Upload,
  Banknote,
  FileText,
  FilePlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from '@/components/UserContext';
import { supabase } from '../lib/superbase';

type CentroCusto = {
  nome: string;
  percentual: number;
};

type FormData = {
  referente: string;
  cnpjcpf: string;
  empresa: string;
  dadosBancarios: string;
  valorParcela: string;
  parcela: string;
  periodicidade: string;
  renovacaoAutomatica: boolean;
  primeiraParcela: string;
  boleto?: File | null;
  contrato?: File | null;
  centrosDeCusto: CentroCusto[];
};

export default function CadastroDespesa() {
  const [formData, setFormData] = useState<FormData>({
    referente: "",
    cnpjcpf: "",
    empresa: "",
    dadosBancarios: "",
    valorParcela: "",
    parcela: "",
    periodicidade: "",
    renovacaoAutomatica: false,
    primeiraParcela: "",
    boleto: null,
    contrato: null,
    centrosDeCusto: [],
  });

  const { nome } = useUser();

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

  const [centroNome, setCentroNome] = useState("");
  const [centroPercentual, setCentroPercentual] = useState("");





  const totalPercentual = formData.centrosDeCusto.reduce(
    (acc, cur) => acc + cur.percentual,
    0
  );



const [isLoading, setIsLoading] = useState(false);





const gerarDataParcela = (dataInicial: Date, indice: number, periodicidade: string) => {
  const data = new Date(dataInicial);

  switch (periodicidade.toLowerCase()) {
    case "pagamento único":
    case "único":
    case "unico":
      if (indice === 0) {
        return data.toISOString();
      } else {
        throw new Error("Pagamento único não pode ter mais de uma parcela.");
      }
    case "semanal":
      data.setDate(data.getDate() + 7 * indice);
      break;
    case "quinzenal":
      data.setDate(data.getDate() + 15 * indice);
      break;
    case "mensal":
      data.setMonth(data.getMonth() + indice);
      break;
    case "trimestral":
      data.setMonth(data.getMonth() + 3 * indice);
      break;
    case "semestral":
      data.setMonth(data.getMonth() + 6 * indice);
      break;
    case "anual":
      data.setFullYear(data.getFullYear() + indice);
      break;
    default:
      throw new Error("Periodicidade inválida");
  }

  return data.toISOString();
};



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      setIsLoading(true);

// Verificar campos obrigatórios
if (
  !formData.referente.trim() ||
  !formData.cnpjcpf.trim() ||
  !formData.empresa.trim() ||
  !formData.valorParcela.toString().trim() ||
  !formData.parcela.toString().trim() ||
  !formData.periodicidade.trim() ||
  !formData.primeiraParcela.trim() ||
  formData.centrosDeCusto.length === 0
) {
  alert("Por favor, preencha todos os campos obrigatórios.");
  return;
}

// Verificar se soma dos percentuais é 100%
const totalPercentual = formData.centrosDeCusto.reduce(
  (acc, centro) => acc + Number(centro.percentual),
  0
);

if (Math.abs(totalPercentual - 100) > 0.01) {
  alert(`A soma dos percentuais deve ser igual a 100%. Soma atual: ${totalPercentual.toFixed(2)}%`);
  return;
}

        
    const fornecedor = formData.empresa;
    const temIcms = false; // Ajuste conforme sua lógica  
    const valorTotal = Number(String(formData.valorParcela).replace(",", "."));


     // 🔥 Gerar nome do arquivo
    
    const fileName = `contrato_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const caminho = `${fileName}`;

    // 🔥 Fazer upload do contrato
    if (formData.contrato) {
      const { error: uploadError } = await supabase.storage
        .from("contratos")
        .upload(caminho, formData.contrato, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro no upload do contrato:", uploadError);
        alert("Erro no upload do contrato.");
        return;
      }
    }


    // ENVIO A TABELA CENTROS DE CUSTO
try {
  if (formData.centrosDeCusto.length > 0) {
    const centrosData = formData.centrosDeCusto.map((centro) => {
      const valorCalculado = Number(String(formData.valorParcela).replace(',', '.')) * Number(formData.parcela);

      return {
        codigo: protocolo,
        lancadoem: new Date().toISOString(),
        data_compra: new Date(formData.primeiraParcela).toISOString(),
        centro: centro.nome,
        percentual: centro.percentual,
        valor: valorCalculado.toFixed(2),
      };
    });

    const { error: errorCentro } = await supabase
      .from("centros_de_custo")
      .insert(centrosData);

    if (errorCentro) {
      console.error("Erro ao salvar centros de custo:", errorCentro);
      alert("Erro ao salvar centros de custo.");
      return;
    } else {
      console.log("Centros de custo salvos com sucesso!");
    }
  }
} catch (error) {
  console.error("Erro inesperado ao salvar centros de custo:", error);
  alert("Erro inesperado ao salvar centros de custo.");
}
    
//PRODUTO
const { error: errorProdutos } = await supabase.from("produtos").insert([
  {
    codigo: protocolo,
    cnpj_cpf: formData.cnpjcpf,
    fornecedor: formData.empresa,
    comprovante: "Contrato",
    numero_comprovante: fileName, // ou outro número, se houver
    data_lancamento: new Date().toISOString(),
    data_compra: new Date(formData.primeiraParcela).toISOString(),
    item: 1, // se for só um item, ou gere dinamicamente se quiser mais
    tipo: "Serviço", // ou "Produto", conforme sua regra
    discriminacao: null,
    nome: formData.referente,

    valor_unitario: Number(String(formData.valorParcela).replace(",", ".")),
    qtd: Number(formData.parcela),
    valor_total:
      Number(String(formData.valorParcela).replace(",", ".")) *
      Number(formData.parcela),

    classificacao_tributaria: null, // se tiver essa info
    und: formData.periodicidade, // unidade padrão, altere se necessário
    marca: null, // se houver
    lancadopor: nome,
    subcategoria: null, // se desejar informar uma subcategoria
  },
]);

if (errorProdutos) {
  console.error("Erro ao salvar na tabela produtos:", errorProdutos);
  alert("Erro ao salvar na tabela produtos.");
} else {
  console.log("Produto salvo com sucesso!");
}


// GERENCIAMENTO DE COMPRAS
    const { error: errorGerenciamento  } = await supabase.from("gerenciamento_compras").insert([
      {
        codigo: protocolo,
        nf: fileName,
        data_lancamento: new Date().toISOString(),
        lancadopor: nome,
        comprovante: "Contrato",
        numero_comprovante: "",
        data_compra: new Date(formData.primeiraParcela).toISOString(),
        valor_total: Number(String(formData.valorParcela).replace(',', '.')) * Number(formData.parcela),
        desconto: 0,
        valor_liquido: Number(String(formData.valorParcela).replace(',', '.')) * Number(formData.parcela),
        cnpj_cpf: formData.cnpjcpf,
        fornecedor: fornecedor,
        tem_icms: temIcms,
        icms_valor: temIcms ? (Number(String(formData.valorParcela).replace(',', '.')) * Number(formData.parcela) * 0.18).toFixed(2) : null,
        centros_de_custo: formData.centrosDeCusto
        .map((item: any) => `${item.nome};${item.percentual}%`)
       .join(";"),
        ordens_de_servico: null,
        quantidade_produtos: 1,
        renovacao_automatica: formData.renovacaoAutomatica
      },
    ]);

    if (errorGerenciamento) {
    console.error("Erro ao salvar no gerenciamento:", errorGerenciamento);
    alert("Erro ao salvar os dados no gerenciamento.");
    return;
  }



// 🔥 Gerar nome do arquivo do boleto
const fileNameBoleto = `boleto_parcela_${new Date().toISOString().replace(/[:.]/g, "-")}`;
// 🔥 Fazer upload do boleto (se existir)
if (formData.boleto) {
  const { error: uploadErrorBoleto } = await supabase.storage
    .from("boletos")
    .upload(fileNameBoleto, formData.boleto, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadErrorBoleto) {
    console.error("Erro no upload do boleto:", uploadErrorBoleto);
    alert("Erro no upload do boleto.");
    return;
  }
}


      
    // PROVISÃO DE PAGAMENTOS

  const quantidadeParcelas = Number(formData.parcela);
  const dataInicial = new Date(formData.primeiraParcela);
  const valorParcela = Number(String(formData.valorParcela).replace(",", "."));

      // 🔥 Gerar os registros das parcelas
    const parcelas = Array.from({ length: quantidadeParcelas }, (_, index) => {
    const dataParcela = gerarDataParcela(dataInicial, index, formData.periodicidade);
    return {
      codigo: protocolo,
      periodicidade: formData.periodicidade,
      origem: "Contratos",
      data_compra: dataInicial,
      empresa: formData.empresa,
      cnpj: formData.cnpjcpf,
      valor: valorParcela,
      boleto: fileNameBoleto ? fileNameBoleto : null,
      valor_total: valorParcela * quantidadeParcelas, // corrigido aqui
      lancadopor: nome,
      venceem: dataParcela,
      pagoem: null,
      nparcelas: index + 1, // 🔥 Aqui é o número da parcela (1, 2, 3, ...)
      qtdparcelas: quantidadeParcelas,
      formapagamento: null,
      formaaserpago: formData.dadosBancarios,
      lancadoem: new Date().toISOString(),
      pedidon: null,
      comprovante_pagamento: null,
    };
  });

   const { error: errorProvisao } = await supabase
    .from("provisao_pagamentos")
    .insert(parcelas);

  if (errorProvisao) {
    console.error("Erro ao salvar na provisão de pagamentos:", errorProvisao);
    alert("Erro ao salvar na provisão de pagamentos.");
    return;
  }

  // 🔥 Sucesso total
  alert("Despesa e provisão salvas com sucesso!");

  // 🔄 Resetar formulário
  setFormData({
    referente: "",
    cnpjcpf: "",
    empresa: "",
    dadosBancarios: "",
    valorParcela: "",
    parcela: "",
    periodicidade: "",
    renovacaoAutomatica: false,
    primeiraParcela: "",
    boleto: null,
    contrato: null,
    centrosDeCusto: [],
  });



  setIsLoading(false);
  window.location.reload(); // 🔄 Atualiza a página
};





const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  if (type === "checkbox") {
    const { checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  } else {
    setFormData((prev) => {
      let updatedForm = { ...prev, [name]: value };

      // Se periodicidade for "Pagamento Único", força parcela como "1"
      if (name === "periodicidade" && value === "Pagamento Único") {
        updatedForm.parcela = "1";
      }

      // Se tentar mudar a parcela enquanto periodicidade for "Pagamento Único", mantém como "1"
      if (name === "parcela" && prev.periodicidade === "Pagamento Único") {
        updatedForm.parcela = "1";
      }

      return updatedForm;
    });
  }
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const addCentroCusto = () => {
    const percentual = parseFloat(centroPercentual);
    if (!centroNome || isNaN(percentual) || percentual <= 0) {
      alert("Preencha corretamente nome e percentual.");
      return;
    }

    if (totalPercentual + percentual > 100) {
      alert("A soma dos percentuais não pode ultrapassar 100%.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      centrosDeCusto: [
        ...prev.centrosDeCusto,
        { nome: centroNome, percentual },
      ],
    }));

    setCentroNome("");
    setCentroPercentual("");
  };

  const removeCentro = (index: number) => {
    const novos = [...formData.centrosDeCusto];
    novos.splice(index, 1);
    setFormData({ ...formData, centrosDeCusto: novos });
  };



  return (
    <div className="max-w-4/5 mx-auto bg-white shadow-lg rounded-2xl mt-10 p-3"
   >
      <h1 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-3">
        <Banknote className="w-8 h-8 text-blue-500" />
        Cadastro de Despesa Recorrente
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Dados Principais */}
        <div className="space-y-5 ">
          <Input label="Referente a:" name="referente" value={formData.referente} onChange={handleChange} />
          <Input label="CNPJ ou CPF:" name="cnpjcpf" value={formData.cnpjcpf} onChange={handleChange} />
          <Input label="Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} />
          <Input label="Dados Bancários:" name="dadosBancarios" value={formData.dadosBancarios} onChange={handleChange} />
        </div>

        {/* Dados Financeiros */}
        <div className="space-y-5">
          <Input label="Valor da Parcela (R$):" name="valorParcela" type="number" value={formData.valorParcela} onChange={handleChange} />
<label>Quantidade de parcelas:</label>
<select
  name="parcela"
  value={formData.parcela}
  onChange={handleChange}
  disabled={formData.periodicidade === 'Pagamento Único'}
  className="w-full border bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
>
  <option value="">Selecione</option>
  {Array.from({ length: 36 }, (_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ))}
</select>
          <div>
            <label className="block mb-1 font-medium">Periodicidade:</label>
            <select
              name="periodicidade"
              value={formData.periodicidade}
              onChange={handleChange}
              className="w-full border bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione</option>
              <option value="Pagamento Único">Pagamento Único</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
              <option value="semestral">Semestral</option>
              <option value="trimestral">Trimestral</option>              
            </select>
          </div>
          <Input label="Primeira Parcela:" name="primeiraParcela" type="date" value={formData.primeiraParcela} onChange={handleChange} />
        </div>

        {/* Centros de Custo */}
        <div className="md:col-span-2 bg-white border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Centros de Custo</h2>
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
              <option value="Galpão">Galpão</option>
              <option value="SP">SP</option>
            </select>
            <input
              type="number"
              placeholder="%"
              value={centroPercentual}
              onChange={(e) => setCentroPercentual(e.target.value)}
              className="border rounded-xl px-4 py-2 w-1/4"
            />
            <button
              type="button"
              onClick={addCentroCusto}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
          <ul className="space-y-2">
            {formData.centrosDeCusto.map((c, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-xl"
              >
                <span>
                  {c.nome} - {c.percentual}%
                </span>
                <button
                  type="button"
                  onClick={() => removeCentro(index)}
                  className="text-red-600 hover:underline"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-sm">
            Total: <strong>{totalPercentual}%</strong>
          </div>
        </div>

        {/* Check + Upload */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="renovacaoAutomatica"
              checked={formData.renovacaoAutomatica}
              onChange={handleChange}
              className="h-5 w-5 text-emerald-600"
            />
            <label className="font-medium">Renovação Automática</label>
          </div>

          <FileInput
            label="Anexar Boleto:"
            name="boleto"
            onChange={handleFileChange}
            icon={<FilePlus className="w-4 h-4" />}
          />
          <FileInput
            label="Anexar Contrato:"
            name="contrato"
            onChange={handleFileChange}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>

        {/* Botão */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl px-8 py-3 font-semibold transition-transform hover:scale-105"
          >
            Salvar Despesa
          </button>
        </div>
      </form>

      {isLoading && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <p className="text-lg font-semibold">Salvando informações...</p>
      <div className="mt-4 animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
    </div>
  </div>
)}
    </div>
    
  );
}

/* COMPONENTES REUTILIZÁVEIS */
const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: any) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border rounded-xl bg-white px-4 py-3 focus:ring-2 focus:ring-emerald-500"
      required
    />
  </div>
);

const FileInput = ({ label, name, onChange, icon }: any) => (
  <div>
    <label className="block mb-1 font-medium flex items-center gap-2">
      {icon}
      {label}
    </label>
    <input
      type="file"
      name={name}
      accept=".pdf,.jpg,.png"
      onChange={onChange}
      className="block w-full bg-white text-sm text-gray-700 border rounded-xl px-4 py-2 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>
);

'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, ArrowLeft } from "lucide-react";
import writtenNumber from "written-number";
import { useUser } from '@/components/UserContext';

interface Contrato {
  id: number;
  nome: string;
  clausulas: string[];
  objeto: string;
}

interface Parte {
  nome: string;
  cpfCnpj: string;
  endereco: string;
}

// Templates de contratos
const modelosDeContrato: Record<string, Partial<Contrato> & {
  obrigacoesContratado?: string[];
  obrigacoesContratante?: string[];
  condicoesPagamento?: string;
  condicoesRescisao?: string;
  prazoConfidencialidade?: string;
}> = {
servico: {
  nome: "Contrato de Prestação de Serviço",
  objeto: "Prestação de serviços especializados conforme descrito entre as partes.",
  clausulas: [
    "O CONTRATADO prestará serviços conforme escopo definido.",
    "Os valores poderão ser reajustados anualmente de acordo com índice oficial.",
    "Em caso de descumprimento das obrigações, poderão ser aplicadas penalidades e multas.",
    "O CONTRATADO responderá civilmente por eventuais danos causados por dolo ou culpa.",
    "Este contrato não implica exclusividade entre as partes, salvo ajuste em contrário.",
    "É vedada a subcontratação dos serviços sem autorização expressa do CONTRATANTE.",
    "Alterações contratuais somente terão validade se feitas por escrito e assinadas pelas partes.",
    "O foro da comarca do CONTRATANTE será competente para dirimir controvérsias."
  ],
  obrigacoesContratado: [
    "Executar os serviços conforme especificações.",
    "Cumprir prazos estabelecidos.",
    "Manter sigilo sobre informações do CONTRATANTE.",
    "Zelar pela qualidade dos serviços prestados.",
    "Cumprir integralmente a legislação trabalhista, previdenciária e fiscal aplicável.",
    "Arcar com tributos, encargos e taxas referentes à execução do serviço.",
    "Comunicar imediatamente ao CONTRATANTE qualquer fato que possa atrasar ou comprometer a execução.",
    "Apresentar relatórios de acompanhamento da execução do serviço, quando solicitado.",
    "Não utilizar nome, marca ou logotipo do CONTRATANTE sem autorização expressa."
  ],
  obrigacoesContratante: [
    "Fornecer informações e documentos necessários.",
    "Efetuar pagamento conforme acordado.",
    "Garantir acesso a recursos necessários.",
    "Pagar despesas adicionais previamente autorizadas.",
    "Fornecer condições adequadas para execução do serviço (ambiente, equipamentos, materiais).",
    "Aprovar ou rejeitar entregas parciais dentro de prazo razoável.",
    "Responsabilizar-se por informações incorretas ou incompletas fornecidas ao CONTRATADO.",
    "Cumprir a legislação aplicável às atividades relacionadas ao objeto do contrato."
  ],
  condicoesPagamento: "O pagamento será realizado em até 30 dias após a entrega da nota fiscal.",
  condicoesRescisao: "Encerramento por comum acordo ou por descumprimento das obrigações.",
  prazoConfidencialidade: "Enquanto durar o contrato"
},

aluguel: {
  nome: "Contrato de Aluguel",
  objeto: "Cessão do uso de bem imóvel ou móvel (descreva o bem) conforme acordado.",
  clausulas: [
    "O LOCATÁRIO se compromete a conservar o bem durante todo o período de locação.",
    "O LOCADOR garante que o bem se encontra em condições adequadas de uso no momento da entrega.",
    "O LOCATÁRIO não poderá sublocar, ceder ou transferir o uso do bem sem autorização expressa do LOCADOR.",
    "Em caso de atraso no pagamento, incidirá multa e juros conforme legislação vigente.",
    "As despesas ordinárias de manutenção e consumo ficam a cargo do LOCATÁRIO.",
    "O LOCADOR será responsável por reparos estruturais ou defeitos ocultos preexistentes.",
    "O presente contrato poderá ser renovado por acordo entre as partes, mediante aditivo.",
   ],
  obrigacoesContratante: [ 
    "Pagar pontualmente o valor do aluguel nas datas acordadas.",
    "Utilizar o bem apenas para os fins previstos no contrato.",
    "Conservar e zelar pelo bem, devolvendo-o no estado em que recebeu, salvo desgaste natural.",
    "Arcar com contas de consumo (água, luz, gás, condomínio, etc.), quando aplicável.",
    "Comunicar imediatamente ao LOCADOR qualquer dano ou defeito no bem.",
    "Não realizar modificações no bem sem prévia autorização por escrito do LOCADOR.",
    "Permitir a vistoria do bem pelo LOCADOR, mediante aviso prévio razoável."
  ],
  obrigacoesContratado: [ 
    "Entregar o bem em condições adequadas de uso.",
    "Garantir o direito de uso pacífico do bem durante o período de locação.",
    "Realizar reparos estruturais ou de responsabilidade do proprietário.",
    "Fornecer recibos ou comprovantes dos pagamentos efetuados.",
    "Cumprir com obrigações fiscais e legais relacionadas à propriedade do bem.",
    "Comunicar ao LOCATÁRIO com antecedência razoável sobre necessidade de vistoria ou reparos."
  ],
  condicoesPagamento: "O pagamento será realizado em até 30 dias após a emissão da nota fiscal.",
  condicoesRescisao: "Rescisão em caso de atraso superior a 30 dias ou descumprimento contratual.",
  prazoConfidencialidade: "Enquanto durar o contrato"
},

comodato: {
  nome: "Contrato de Comodato",
  objeto: "Empréstimo gratuito de bem por prazo determinado.",
  clausulas: [
    "O COMODATÁRIO deve devolver o bem ao final do prazo estabelecido.",
    "O bem deverá ser devolvido nas mesmas condições em que foi entregue, salvo desgaste natural.",
    "É vedada a utilização do bem para fins diversos dos previstos neste contrato.",
    "O COMODANTE poderá solicitar a devolução do bem em caso de necessidade urgente, mediante aviso prévio.",
    "Fica eleito o foro da comarca do COMODANTE para solução de eventuais controvérsias."
  ],
  obrigacoesContratante: [ // COMODATÁRIO
    "Zelar pela conservação do bem recebido em comodato.",
    "Utilizar o bem apenas para os fins ajustados.",
    "Devolver o bem no prazo estabelecido.",
    "Arcar com despesas de uso e manutenção ordinária do bem.",
    "Comunicar imediatamente ao COMODANTE qualquer dano ou defeito ocorrido."
  ],
  obrigacoesContratado: [ // COMODANTE
    "Entregar o bem em condições adequadas de uso.",
    "Garantir ao COMODATÁRIO o uso pacífico do bem durante o prazo do contrato.",
    "Arcar com reparos estruturais ou defeitos ocultos preexistentes.",
    "Fornecer informações necessárias ao correto uso do bem."
  ],
  condicoesPagamento: "O pagamento será realizado em até 30 dias após a emissão da nota fiscal.",
  condicoesRescisao: "Rescisão por descumprimento contratual ou comum acordo.",
  prazoConfidencialidade: "Enquanto durar o contrato"
},



parceria: {
  nome: "Contrato de Parceria Comercial",
  objeto: "União de esforços entre as partes para execução de projeto conjunto.",
  clausulas: [
    "As partes dividirão custos e lucros proporcionalmente.",
    "As responsabilidades serão distribuídas conforme definido no plano de trabalho.",
    "É vedada a atuação de qualquer das partes em concorrência desleal com a parceria.",
    "O contrato poderá ser alterado por comum acordo, mediante aditivo escrito.",
    "O foro da comarca definida pelas partes será competente para resolver litígios."
  ],
  obrigacoesContratado: [ // Parceiro A
    "Cumprir as responsabilidades assumidas no projeto conjunto.",
    "Aportar os recursos financeiros, materiais ou humanos acordados.",
    "Respeitar a confidencialidade das informações compartilhadas.",
    "Prestar contas de sua atuação dentro da parceria."
  ],
  obrigacoesContratante: [ // Parceiro B
    "Cumprir igualmente as responsabilidades assumidas.",
    "Aportar os recursos prometidos para viabilizar o projeto.",
    "Respeitar os prazos acordados para execução de tarefas.",
    "Comunicar tempestivamente quaisquer problemas que afetem a parceria."
  ],
  condicoesRescisao: "Rescisão por descumprimento contratual ou comum acordo.",
  condicoesPagamento: "O pagamento será realizado em até 30 dias após a emissão da nota fiscal.",
  prazoConfidencialidade: "Enquanto durar o contrato"
},


confidencialidade: {
  nome: "Acordo de Confidencialidade (NDA)",
  objeto: "Proteção de informações sigilosas trocadas entre as partes.",
  clausulas: [
    "As informações confidenciais não poderão ser divulgadas a terceiros.",
    "As partes deverão utilizar as informações apenas para os fins previstos no acordo.",
    "O dever de confidencialidade permanecerá válido mesmo após o término da relação contratual.",
    "Excluem-se do dever de confidencialidade informações de conhecimento público ou obtidas de forma independente."
  ],
  obrigacoesContratado: [
    "Manter em sigilo todas as informações recebidas.",
    "Utilizar as informações confidenciais apenas para o fim permitido.",
    "Não copiar ou reproduzir informações sem autorização expressa.",
    "Devolver ou destruir documentos sigilosos ao término da relação."
  ],
  obrigacoesContratante: [
    "Fornecer apenas informações necessárias ao objeto do acordo.",
    "Classificar claramente o que é considerado informação confidencial.",
    "Cumprir o mesmo dever de confidencialidade em relação às informações recebidas da outra parte."
  ],
  condicoesRescisao: "Rescisão por descumprimento contratual ou comum acordo.",
  condicoesPagamento: "O pagamento será realizado em até 30 dias após a emissão da nota fiscal.",
  prazoConfidencialidade: "5 anos após a assinatura"
},

compra_venda: {
  nome: "Contrato de Compra e Venda",
  objeto: "Transferência de propriedade de um bem (descreva o bem) mediante pagamento.",
  clausulas: [
    "O vendedor declara ser legítimo proprietário do bem.",
    "O comprador se compromete a pagar o valor ajustado nas condições estabelecidas.",
    "A transferência da propriedade se dará após o pagamento integral.",
    "O vendedor garante que o bem está livre de ônus ou gravames.",
    "Em caso de vícios ocultos, aplicam-se as disposições do Código Civil."
  ],
  obrigacoesContratado: [ // Comprador
    "Efetuar o pagamento conforme acordado.",
    "Receber o bem na data e local estipulados.",
    "Assumir os riscos e responsabilidades sobre o bem a partir da entrega."
  ],
  obrigacoesContratante: [ // Vendedor
    "Entregar o bem nas condições ajustadas.",
    "Garantir a legitimidade da propriedade transferida.",
    "Responder por vícios ou defeitos ocultos existentes antes da entrega."
  ],
  condicoesPagamento: "Pagamento à vista na assinatura do contrato.",
  condicoesRescisao: "Rescisão por descumprimento contratual ou comum acordo.",
  prazoConfidencialidade: "Sem prazo de confidencialidade"
},


estagio: {
  nome: "Contrato de Estágio",
  objeto: "Atividades educacionais e de aprendizado supervisionadas.",
  clausulas: [
    "O estágio terá acompanhamento pedagógico e duração definida pela lei.",
    "Não gera vínculo empregatício, desde que atendidas as condições legais.",
    "A jornada de estágio deverá ser compatível com o horário escolar.",
    "A concessão de bolsa e auxílio-transporte seguirá acordo entre as partes."
  ],
  obrigacoesContratado: [ // Estagiário
    "Cumprir a jornada e atividades designadas no plano de estágio.",
    "Manter conduta ética e respeitosa no ambiente de estágio.",
    "Informar ao supervisor quaisquer dificuldades ou necessidades.",
    "Cumprir regulamentos internos da concedente."
  ],
  obrigacoesContratante: [ // Concedente
    "Oferecer ambiente adequado ao aprendizado.",
    "Designar supervisor responsável pelo acompanhamento do estágio.",
    "Cumprir a legislação relativa ao estágio (Lei nº 11.788/2008).",
    "Emitir relatórios de avaliação periódica."
  ],
  condicoesRescisao: "Rescisão por interesse de qualquer das partes com aviso prévio de 5 dias.",
  condicoesPagamento: "O pagamento será realizado até o 5º dia útil",
  prazoConfidencialidade: "Sem prazo de confidencialidade"
},



freelancer: {
  nome: "Contrato de Freelancer",
  objeto: "Execução de trabalho autônomo conforme escopo acordado.",
  clausulas: [
    "O FREELANCER prestará o serviço com independência técnica.",
    "Não há vínculo empregatício entre FREELANCER e CONTRATANTE.",
    "O pagamento será efetuado conforme as entregas aprovadas.",
    "O FREELANCER garante a originalidade e autoria do trabalho entregue."
  ],
  obrigacoesContratado: [ // Freelancer
    "Executar o trabalho conforme especificações e prazos.",
    "Manter sigilo sobre informações do contratante.",
    "Entregar o trabalho em formato e qualidade acordados.",
    "Corrigir eventuais falhas ou ajustes solicitados dentro de prazo razoável."
  ],
  obrigacoesContratante: [ // Contratante
    "Fornecer briefing e informações necessárias à execução.",
    "Avaliar e aprovar entregas dentro de prazo razoável.",
    "Efetuar o pagamento conforme acordado.",
    "Não exigir exclusividade não prevista em contrato."
  ],
  condicoesPagamento: "Pagamento integral após a entrega do trabalho.",
  condicoesRescisao: "Rescisão por interesse de qualquer das partes com aviso prévio de 5 dias.",
  prazoConfidencialidade: "Sem prazo de confidencialidade"
},


representacao: {
  nome: "Contrato de Representação Comercial",
  objeto: "Representação de produtos ou serviços em nome da empresa.",
  clausulas: [
    "O REPRESENTANTE deverá atuar conforme as diretrizes da empresa.",
    "A remuneração será calculada com base em comissão sobre vendas efetivas.",
    "O REPRESENTANTE não poderá assumir obrigações em nome da empresa sem autorização.",
    "O contrato não gera vínculo empregatício entre as partes."
  ],
  obrigacoesContratado: [ // Representante
    "Promover os produtos ou serviços da empresa.",
    "Cumprir metas e diretrizes comerciais.",
    "Prestar contas periódicas das atividades realizadas.",
    "Não atuar em concorrência direta sem autorização da empresa."
  ],
  obrigacoesContratante: [ // Empresa
    "Fornecer material de apoio e informações sobre os produtos.",
    "Pagar pontualmente as comissões devidas.",
    "Comunicar alterações nas políticas comerciais.",
    "Respeitar a autonomia técnica do representante dentro dos limites estabelecidos."
  ],
  condicoesPagamento: "Remuneração por comissão sobre vendas.",
  condicoesRescisao: "Rescisão por interesse de qualquer das partes com aviso prévio de 5 dias.",
  prazoConfidencialidade: "Sem prazo de confidencialidade"
},
licenciamento: {
  nome: "Contrato de Licenciamento de Uso",
  objeto: "Autorização de uso de software, marca ou patente.",
  clausulas: [
    "O LICENCIADO poderá utilizar o bem licenciado dentro dos limites estabelecidos.",
    "É vedada a cessão ou sublicenciamento sem autorização do LICENCIANTE.",
    "O LICENCIANTE garante que possui os direitos sobre o bem licenciado.",
    "Em caso de violação, o contrato poderá ser rescindido imediatamente."
  ],
  obrigacoesContratado: [ // Licenciado
    "Utilizar o objeto licenciado conforme os limites do contrato.",
    "Não reproduzir, copiar ou redistribuir sem autorização.",
    "Efetuar o pagamento das taxas ou royalties devidos.",
    "Comunicar qualquer violação de direitos que venha a tomar conhecimento."
  ],
  obrigacoesContratante: [ // Licenciante
    "Garantir ao LICENCIADO o uso pacífico do objeto licenciado.",
    "Assegurar que possui legitimidade sobre o objeto licenciado.",
    "Prestar suporte técnico ou informações necessárias, quando aplicável.",
    "Respeitar a duração e condições do contrato de licenciamento."
  ],
  condicoesPagamento: "Pagamento mensal de royalties conforme contrato.",
  condicoesRescisao: "Rescisão por interesse de qualquer das partes com aviso prévio de 5 dias.",
  prazoConfidencialidade: "Sem prazo de confidencialidade"
}
};

export default function CriacaoDeContratos() {
  
  const { nome } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Contratos');
  const [loading, setLoading] = useState(false);

  // Dados do formulário
  const [contrato, setContrato] = useState<Contrato>({
    id: Date.now(),
    nome: '',
    clausulas: [''],
    objeto: '',
  });

  const [contratante, setContratante] = useState<Parte>({ nome: '12 TEC Engenharia LTDA', cpfCnpj: '30.257.741/0001-13', endereco: 'Travessa Iguaçu, n.30, bairro: 18 do forte, Aracaju-Sergipe, CEP: 49072-330' });
  const [contratado, setContratado] = useState<Parte>({ nome: '', cpfCnpj: '', endereco: '' });
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [prazoMeses, setPrazoMeses] = useState('');
  const [valorNum, setValorNum] = useState('');
  const [valorExtenso, setValorExtenso] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState('O pagamento será realizado após 30 (trinta) dias da emissão da nota fiscal pelo CONTRATANTE');
  const [condicoesRescisao, setCondicoesRescisao] = useState('Encerramento do prazo do contrato ou por convenção entre as partes a qualquer momento');
  const [prazoConfidencialidade, setPrazoConfidencialidade] = useState('duração do contrato');
  const [cidade, setCidade] = useState('Aracaju');
  const [estado, setEstado] = useState('Sergipe');
  const [foroCidade, setForoCidade] = useState('Aracaju');
  const [foroEstado, setForoEstado] = useState('Sergipe');
  const [geradoPor, setGeradoPor] = useState(nome);

  // Obrigações padrão
  const [obrigacoesContratado, setObrigacoesContratado] = useState([
''
  ]);

  const [obrigacoesContratante, setObrigacoesContratante] = useState([
''
  ]);

  // Aplicar template
  function aplicarTemplate(tipo: string) {
    const modelo = modelosDeContrato[tipo];
    if (!modelo) return;

    setContrato({
      ...contrato,
      nome: modelo.nome || contrato.nome,
      objeto: modelo.objeto || contrato.objeto,
      clausulas: modelo.clausulas || contrato.clausulas,
    });
    if (modelo.obrigacoesContratado) setObrigacoesContratado(modelo.obrigacoesContratado);
    if (modelo.obrigacoesContratante) setObrigacoesContratante(modelo.obrigacoesContratante);
    if (modelo.condicoesPagamento) setCondicoesPagamento(modelo.condicoesPagamento);
    if (modelo.condicoesRescisao) setCondicoesRescisao(modelo.condicoesRescisao);
    if (modelo.prazoConfidencialidade) setPrazoConfidencialidade(modelo.prazoConfidencialidade);
  }

function formatarDataPorExtenso(data: Date) {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();

  return `${dia} de ${mes} de ${ano}`;
}

const dataInicioFormatada = formatarDataPorExtenso(new Date(dataInicio));



function formatarDataNumerica(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro = 0
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

const dataAssinaturaFormatada = formatarDataNumerica(new Date(dataAssinatura));


  // Função para enviar para API (mesma que você já tinha)
  async function gerarContrato() {
    if (!contrato.objeto) return alert("Informe o objeto do contrato");
    if (!dataAssinatura) return alert("Informe a data de assinatura");

    setLoading(true);
    const resHtml = await fetch('/modelos/CONTRATOSERVICO.html');
    const htmlTemplate = await resHtml.text();

    const payload = {
      contrato: {
        ...contrato,
        html: htmlTemplate,
        contratante,
        contratado,
        data_assinatura: dataAssinaturaFormatada,
        data_inicio: dataInicioFormatada,
        prazo_meses: prazoMeses,
        valor_num: valorNum,
        valor_extenso: valorExtenso,
        condicoes_pagamento: condicoesPagamento,
        condicoes_rescisao: condicoesRescisao,
        prazo_confidencialidade: prazoConfidencialidade,
        cidade,
        estado,
        foro_cidade: foroCidade,
        foro_estado: foroEstado,
        gerado_por: geradoPor,
        obrigacoes_contratado_lista: obrigacoesContratado,
        obrigacoes_contratante_lista: obrigacoesContratante,
      }
    };

    try {
      const res = await fetch('/api/gerar_contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao gerar contrato');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contrato.nome || 'contrato'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      alert("Contrato gerado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar contrato");
    } finally {
      setLoading(false);
    }
  }








    // Formata valor em R$
  const formatarValor = (valor: string) => {
    // Remove tudo que não é número
    const num = valor.replace(/\D/g, "");
    if (!num) return "";
    
    // Formata em R$ 1.234,56
    const numero = parseFloat(num) / 100;
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };


writtenNumber.defaults.lang = 'pt';

// Atualiza valor numérico e por extenso
const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Pega o valor digitado
  const raw = e.target.value;

  // Formata o valor em R$ usando a função utilitária
  const valorFormatado = formatarValor(raw);
  setValorNum(valorFormatado);

  // Converte para número para calcular por extenso
  const numero = parseFloat(valorFormatado.replace(/[R$\s\.]/g, "").replace(",", ".")) || 0;

  // Inteiro e centavos
  const inteiro = Math.floor(numero);
  const centavos = Math.round((numero - inteiro) * 100);

  // Valor por extenso
  let ext = writtenNumber(inteiro, { lang: 'pt' });
  ext += inteiro === 1 ? ' real' : ' reais';
  if (centavos > 0) {
    ext += ` e ${writtenNumber(centavos, { lang: 'pt' })}`;
    ext += centavos === 1 ? ' centavo' : ' centavos';
  }

  setValorExtenso(ext);
};


  // Formata CPF ou CNPJ automaticamente
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // remove não numérico
    if (val.length <= 11) {
      // CPF
      val = val.replace(/(\d{3})(\d)/, "$1.$2")
               .replace(/(\d{3})(\d)/, "$1.$2")
               .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ
      val = val.replace(/^(\d{2})(\d)/, "$1.$2")
               .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
               .replace(/\.(\d{3})(\d)/, ".$1/$2")
               .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    setContratado({ ...contratado, cpfCnpj: val })};
  








  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
      {/* Topbar */}
      <div className={`flex items-center justify-between bg-[#200101] p-0 text-white shadow-md ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => router.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              📄 GERADOR DE CONTRATOS
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={(tab: string) => setActiveTab(tab)}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <main ref={containerRef} className={`content flex-1 p-8 min-h-screen overflow-y-auto ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
          <section className="max-w-5xl mx-auto bg-gray-700 p-8 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-green-400 font-extrabold text-3xl mb-4">📄 Dados do Contrato</h2>

            {/* Escolher template */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Tipo de Contrato</label>
              <select
                className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                onChange={(e) => aplicarTemplate(e.target.value)}
              >
                <option value="">Selecione um modelo...</option>
                <option value="servico">Prestação de Serviço</option>
                <option value="aluguel">Aluguel / Locação</option>
                <option value="comodato">Comodato</option>
                <option value="parceria">Parceria Comercial</option>
                <option value="confidencialidade">Confidencialidade / NDA</option>
                <option value="compra_venda">Compra e Venda</option>
                <option value="estagio">Estágio</option>
                <option value="freelancer">Freelancer / Trabalho Autônomo</option>
                <option value="representacao">Representação Comercial</option>
                <option value="licenciamento">Licenciamento de Uso</option>
              </select>
            </div>

            {/* Nome do contrato */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Nome do Contrato</label>
              <input
                type="text"
                placeholder="Digite o nome do contrato"
                className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                value={contrato.nome}
                onChange={e => setContrato({ ...contrato, nome: e.target.value })}
              />
            </div>

            {/* Objeto do contrato */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Objeto do Contrato</label>
              <textarea
                placeholder="Descreva o objeto do contrato..."
                className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                value={contrato.objeto}
                onChange={e => setContrato({ ...contrato, objeto: e.target.value })}
              />
            </div>

            {/* Restante do formulário continua igual */}
            {/* Contratante */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-green-300 font-semibold">Contratante</label>
                <input type="text" placeholder="Nome" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratante.nome} onChange={e => setContratante({ ...contratante, nome: e.target.value })} />
                <input type="text" placeholder="CPF/CNPJ" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratante.cpfCnpj} onChange={e => setContratante({ ...contratante, cpfCnpj: e.target.value })} />
                <input type="text" placeholder="Endereço" className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                  value={contratante.endereco} onChange={e => setContratante({ ...contratante, endereco: e.target.value })} />
              </div>

              {/* Contratado */}
              <div>
                <label className="block text-green-300 font-semibold">Contratado</label>
                <input type="text" placeholder="Nome" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratado.nome} onChange={e => setContratado({ ...contratado, nome: e.target.value })} />
                <input type="text" placeholder="CPF/CNPJ" className="w-full rounded-xl px-4 py-2 mb-2 text-white bg-gray-600"
                  value={contratado.cpfCnpj} onChange={handleCpfCnpjChange} />
                <input type="text" placeholder="Endereço" className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
                  value={contratado.endereco} onChange={e => setContratado({ ...contratado, endereco: e.target.value })} />
              </div>
            </div>

{/* Datas, prazos e valores */}
<div className="grid grid-cols-3 gap-6">
  <div>
    <label className="block text-green-300 font-semibold mb-2">Data da Assinatura</label>
    <input
      type="date"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={dataAssinatura}
      onChange={e => setDataAssinatura(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Data de Início</label>
    <input
      type="date"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={dataInicio}
      onChange={e => setDataInicio(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Prazo (meses)</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={prazoMeses}
      onChange={e => setPrazoMeses(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Valor numérico</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={valorNum}
      onChange={handleValorChange}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Valor por extenso</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={valorExtenso}
      readOnly
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Condições de pagamento</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={condicoesPagamento}
      onChange={e => setCondicoesPagamento(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Condições de rescisão</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={condicoesRescisao}
      onChange={e => setCondicoesRescisao(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Prazo de confidencialidade</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={prazoConfidencialidade}
      onChange={e => setPrazoConfidencialidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Foro cidade</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={foroCidade}
      onChange={e => setForoCidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Foro estado</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={foroEstado}
      onChange={e => setForoEstado(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Gerado por</label>
    <input
      type="text"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={geradoPor}
      onChange={e => setGeradoPor(e.target.value)}
      readOnly
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Cidade</label>
    <input
      type="text"
      placeholder="Digite a cidade"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={cidade}
      onChange={e => setCidade(e.target.value)}
    />
  </div>

  <div>
    <label className="block text-green-300 font-semibold mb-2">Estado</label>
    <input
      type="text"
      placeholder="Digite o estado"
      className="w-full rounded-xl px-4 py-2 text-white bg-gray-600"
      value={estado}
      onChange={e => setEstado(e.target.value)}
    />
  </div>
</div>


            {/* Cláusulas e Obrigações continuam iguais */}
            {/* Cláusulas */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Cláusulas</label>
              {contrato.clausulas.map((c, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={c} onChange={e => {
                      const copy = [...contrato.clausulas];
                      copy[idx] = e.target.value;
                      setContrato({ ...contrato, clausulas: copy });
                    }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setContrato({ ...contrato, clausulas: contrato.clausulas.filter((_, i) => i !== idx) })}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setContrato({ ...contrato, clausulas: [...contrato.clausulas, ''] })}>Adicionar Cláusula</button>
            </div>

            {/* Obrigações Contratado */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Obrigações do Contratado</label>
              {obrigacoesContratado.map((o, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={o} onChange={e => { const copy = [...obrigacoesContratado]; copy[idx] = e.target.value; setObrigacoesContratado(copy); }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setObrigacoesContratado(obrigacoesContratado.filter((_, i) => i !== idx))}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setObrigacoesContratado([...obrigacoesContratado, ''])}>Adicionar Obrigação</button>
            </div>

            {/* Obrigações Contratante */}
            <div>
              <label className="block text-green-300 font-semibold mb-2">Obrigações do Contratante</label>
              {obrigacoesContratante.map((o, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" className="flex-1 rounded-xl px-4 py-2 text-white bg-gray-600"
                    value={o} onChange={e => { const copy = [...obrigacoesContratante]; copy[idx] = e.target.value; setObrigacoesContratante(copy); }} />
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    onClick={() => setObrigacoesContratante(obrigacoesContratante.filter((_, i) => i !== idx))}>Remover</button>
                </div>
              ))}
              <button className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-xl mt-2"
                onClick={() => setObrigacoesContratante([...obrigacoesContratante, ''])}>Adicionar Obrigação</button>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="bg-green-400 hover:bg-green-500 active:bg-green-600 px-10 py-3 rounded-lg text-white font-semibold shadow-md"
                onClick={gerarContrato} disabled={loading}>
                {loading ? 'Gerando...' : '🚀 Gerar Contrato'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

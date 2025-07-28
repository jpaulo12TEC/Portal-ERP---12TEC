'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import { Search, ArrowLeft } from "lucide-react";
import { useUser } from '@/components/UserContext';
import { supabase } from '../../../../lib/superbase';
import Select from "react-select";


const processos = [
  { value: "Serviços de Engenharia", label: "Serviços de Engenharia" },
  { value: "PCO", label: "PCO" },
  { value: "Treinamento", label: "Treinamento" },
  { value: "Gestão da Aquisição", label: "Gestão da Aquisição" },
  { value: "Gestão da Infraestrutura", label: "Gestão da Infraestrutura" },
  { value: "Gestão Financeira", label: "Gestão Financeira" },
  { value: "Gestão de RH", label: "Gestão de RH" },
];

export default function AdmissaoColaborador() {
  const { nome } = useUser();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const router = useRouter();
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

// Estado dos campos do colaborador
const [formData, setFormData] = useState({
  nome_completo: '',        // nome
  nivel_acesso: 'básico',
  abreviatura: '',
  cargo: '',
  tipo_regime: '',
  matricula: '',
  data_nascimento: '',      // nascimento
  rg: '',
  cpf: '',
  pis: '',
  data_admissao: '',        // admissao
  processo: '',
  periculosidade: false,
  insalubridade: '',
  salario_familia: false,
  qtd_dependentes: 0,
  situacao: 'Ativo',        // ou 'Inativo', 'Afastado'
  email: '',
  telefone: '',
  endereco: '',
  departamento: '',
  estado_civil: '',
  genero: '',
  observacoes: '',
  filial: '',
  foto: ''                  // nome do arquivo, ou pode ser a URL vinda do Supabase Storage
});

  function formatRG(value: string): string {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers.replace(/^(\d{1,2})(\d{0,3})(\d{0,3})/, (_, p1, p2, p3) => {
      let result = p1;
      if (p2) result += '.' + p2;
      if (p3) result += '.' + p3;
      return result;
    });
  }


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  function formatarNomeArquivo(nome: string, cpf: string) {
    const nomeSemAcento = nome
      .normalize("NFD") // separa letras de seus acentos
      .replace(/[\u0300-\u036f]/g, "") // remove os acentos
      .replace(/\s+/g, "_") // troca espaços por underscores
      .replace(/[^\w\-]/g, ""); // remove qualquer outro caractere especial
  
    const cpfFormatado = cpf.replace(/\D/g, ""); // remove pontos e traços do CPF
    return `${nomeSemAcento}_${cpfFormatado}.jpg`;
  }
  
  function formatCPF(value: string): string {
    const onlyNumbers = value.replace(/\D/g, '');
    return onlyNumbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value, type } = e.target;

  let formattedValue: string | boolean | number | string[] = value;

  if (type === "checkbox" && e.target instanceof HTMLInputElement) {
    formattedValue = e.target.checked;
  } else if (e.target instanceof HTMLSelectElement && e.target.multiple) {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    formattedValue = selectedOptions;
  } else {
    if (name === "cpf") {
      formattedValue = formatCPF(value);
    } else if (name === "rg") {
      formattedValue = formatRG(value);
    } else if (name === "dependentes") {
      formattedValue = value === "" ? "" : Number(value);
    }
  }

  setFormData((prev) => ({
    ...prev,
    [name]: formattedValue,
  }));
};


  const handleSubmit = async () => {
    setLoading(true); // Inicia o loading
    try {
      // Campos obrigatórios
      const camposObrigatorios = [
        { campo: 'nome_completo', label: 'Nome completo' },
        { campo: 'abreviatura', label: 'Abreviatura' },
        { campo: 'cargo', label: 'Cargo' },
        { campo: 'tipo_regime', label: 'Tipo de Regime' },
        { campo: 'matricula', label: 'Matrícula' },
        { campo: 'data_nascimento', label: 'Data de Nascimento' },
        { campo: 'rg', label: 'RG' },
        { campo: 'cpf', label: 'CPF' },
        { campo: 'data_admissao', label: 'Data de Admissão' },
        { campo: 'processo', label: 'Processo' },
        { campo: 'filial', label: 'Filial' },
        { campo: 'departamento', label: 'Departamento' },
        { campo: 'estado_civil', label: 'Estado civil' },
        { campo: 'genero', label: 'Gênero' },
      ];
  
      // Se tipo_regime for CLT, o campo 'pis' também é obrigatório
      if (formData.tipo_regime.toLowerCase() === 'clt') {
        camposObrigatorios.push({ campo: 'pis', label: 'PIS' });
      }
  
      const formDataTyped = formData as Record<string, string | boolean | number>;
  
      // Validação dos campos obrigatórios
      for (const item of camposObrigatorios) {
        const valor = formDataTyped[item.campo];
        if (!valor || valor.toString().trim() === '') {
          alert(`Por favor, preencha o campo: ${item.label}`);
          setLoading(false);
          return;
        }
      }

      // Verifica quantidade de dependentes caso salário família esteja marcado
if (formData.salario_familia && (!formData.qtd_dependentes || formData.qtd_dependentes <= 0)) {
  alert('Por favor, informe a quantidade de dependentes (maior que 0) para o salário família.');
  setLoading(false);
  return;
}
  
      // Verifica se imagem foi selecionada
      if (!selectedImage) {
        alert('Por favor, selecione uma foto.');
        setLoading(false);
        return;
      }

          // Verifica se o arquivo é realmente uma imagem
    if (!selectedImage.type.startsWith('image/')) {
      alert('O arquivo selecionado não é uma imagem válida.');
      setLoading(false);
      return;
    }
  
      // Upload da foto
      let fotoUrl = null;
  
      if (selectedImage) {
        const fileName = formatarNomeArquivo(formData.nome_completo, formData.cpf);
  
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotofuncionarios')
          .upload(fileName, selectedImage, {
            cacheControl: '3600',
            upsert: true,
            contentType: selectedImage.type,
          });
  
        if (uploadError) {
          console.error('Erro ao fazer upload da imagem:', uploadError.message);
          alert(`Erro ao fazer upload da imagem: ${uploadError.message}`);
          setLoading(false);
          return;
        }
  
        fotoUrl = `${fileName}`;
      }
  
      // Dados a serem inseridos
      const dadosFuncionario = {
        ...formData,
        foto: fotoUrl,
        feito_por: nome,
      };
  
      console.log('Dados sendo enviados para o Supabase:', dadosFuncionario);
  
      // Inserção no Supabase
      const { error: insertError } = await supabase
        .from('funcionarios')
        .insert([dadosFuncionario]);
  
      if (insertError) {
        console.error('Erro ao inserir no Supabase:', insertError.message);
        alert(`Erro ao salvar funcionário: ${insertError.message}`);
        setLoading(false);
        return;
      }
  
      // Sucesso!
      setSelectedImage(null);
      handleNext();
      alert('Funcionário salvo com sucesso!');
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Erro desconhecido:', err);
      alert('Erro inesperado ao salvar funcionário. Verifique o console para detalhes.');
    } finally {
      setLoading(false); // Finaliza o loading
    }
  };
  
  








  const handleNext = () => {
    // Armazena temporariamente ou envia para API (você pode adaptar)
    console.log("Dados do colaborador:", formData);

    // Redireciona para a próxima etapa
    router.push('/dashboard/RH/admissao/documentos');
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? "ml-[300px]" : "ml-[80px]"}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] p-0 text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="px-3 py-3 h-[50px]">
            <button className="w-full text-left hover:text-gray-300">
              Admissão de colaborador
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-[400px] ml-6 mr-70">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full h-[30px] w-full bg-white border-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={17} />
        </div>

        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={() => {}}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        {/* Formulário */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white rounded-2xl shadow-lg">


  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
{/* Foto do Colaborador */}
<div className="flex flex-col items-center">
  {previewUrl ? (
    <img src={previewUrl} alt="Pré-visualização" className="w-90 h-90 object-cover rounded-lg border" />
  ) : (
    <div className="w-90 h-90 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm bg-gray-50">
      Foto
    </div>
  )}

  <input
    type="file"
    accept="image/*"
    id="upload-foto"
    onChange={handleImageChange}
    className="hidden"
  />
  <label htmlFor="upload-foto" className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer">
    Adicionar Foto
  </label>
  <textarea name="observacoes" placeholder="Observações" value={formData.observacoes} onChange={handleChange} className="w-full mt-10 border border-gray-300 rounded-md px-4 py-3 text-base resize-none" rows={3}></textarea>
  <fieldset className="border border-gray-300 rounded-md p-4 w-full mt-10">
  <legend className="text-lg font-medium text-gray-800 mb-2">Benefícios e Adicionais</legend>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Insalubridade */}
    <div>
      <label htmlFor="insalubridade" className="text-gray-700 block mb-1">Insalubridade</label>
      <select
        name="insalubridade"
        value={formData.insalubridade}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Nenhum</option>
        <option value="10%">10%</option>
        <option value="20%">20%</option>
        <option value="30%">30%</option>
      </select>
    </div>

    {/* Checkboxes */}
    <div className="flex flex-col gap-3 mt-1 sm:mt-0">
      <label className="flex items-center gap-2 text-gray-700">
        <input
          type="checkbox"
          name="salario_familia"
          checked={formData.salario_familia}
          onChange={handleChange}
        />
        Salário Família
      </label>

      {/* Campo de dependentes visível apenas se salário_familia estiver marcado */}
      {formData.salario_familia && (
        <div className="mt-1">
          <label htmlFor="dependentes" className="text-gray-700 block mb-1">Quantidade de Dependentes</label>
          <input
            type="number"
            name="qtd_dependentes"
            min="0"
            value={formData.qtd_dependentes || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-gray-700">
        <input
          type="checkbox"
          name="periculosidade"
          checked={formData.periculosidade}
          onChange={handleChange}
        />
        Periculosidade
      </label>
    </div>
  </div>
</fieldset>



</div>

    {/* Dados Pessoais */}
<div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
  <div>
    <label>Nome completo</label>
    <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Abreviatura</label>
    <input name="abreviatura" value={formData.abreviatura} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Cargo</label>
    <select name="cargo" value={formData.cargo} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" >
    <option value="">Selecione um cargo</option>

    <option value="Engenheiro Civil">Engenheiro Civil</option>
    <option value="Assistente de Engenharia">Assistente de Engenharia</option>
    <option value="Engenheiro Mecânico">Engenheiro Mecânico</option>
    <option value="Arquiteto">Arquiteto</option>

    <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
    <option value="Assistente Administrativo">Assistente Administrativo</option>
    <option value="Almoxarife">Almoxarife</option>
    <option value="Cordenador de Qualidade">Cordenador de Qualidade</option>
    <option value="Técnico de Segurança do Trabalho">Técnico de Segurança do Trabalho</option>
    <option value="Gerente de RH">Gerente de RH</option>
    <option value="Auxiliar de Planejamento">Auxiliar de Planejamento</option>

    <option value="Meio Oficial de Obras">Meio Oficial de Obras</option>
    <option value="Ajudante">Ajudante</option>
    <option value="Ajudante de Obras">Ajudante de Obras</option>
    <option value="Técnico de Campo II">Técnico de Campo II</option>
    <option value="Auxiliar Técnico Campo I">Auxiliar Técnico Campo I</option>
    <option value="Encarregado de Mecanica">Encarregado de Mecanica</option>
    <option value="Encarregado de Caldeiraria">Encarregado de Caldeiraria</option>
    <option value="Técnico em Mecatrônica">Técnico em Mecatrônica</option>

    <option value="Pedreiro">Pedreiro</option>
    <option value="Eletricista">Eletricista</option>
    <option value="Pintor">Pintor</option>
    <option value="Montador de Andaime">Montador de Andaime</option>
    <option value="Diretor">Diretor</option>
    <option value="Mecânico II">Mecânico II</option>
    <option value="Mecânico">Mecânico</option>
    <option value="Caldereiro">Caldereiro</option>

    <option value="Estagiário">Estagiário</option>
    {/* Adicione mais opções conforme necessário */}
  </select>
  </div>
  <div>
    <label>Tipo de Regime</label>
    <select name="tipo_regime" value={formData.tipo_regime} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" >
    <option value="">Selecione um regime</option>
    <option value="CLT">CLT</option>
    <option value="PJ">PJ</option>
    <option value="Temporário">Temporário</option>
    <option value="Estatutário">Estatutário</option>

    {/* Adicione mais opções conforme necessário */}
  </select>
  </div>
  <div>
    <label>Matrícula</label>
    <input name="matricula" value={formData.matricula} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Data de Nascimento</label>
    <input name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>RG</label>
    <input name="rg" value={formData.rg} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>CPF</label>
    <input name="cpf" value={formData.cpf} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>PIS</label>
    <input name="pis" value={formData.pis} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Data de Admissão</label>
    <input name="data_admissao" type="date" value={formData.data_admissao} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Departamento</label>
    <input name="departamento" value={formData.departamento} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Filial</label>
    <select name="filial" value={formData.filial} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base">
      <option value=""></option>
      <option value="São Paulo">São Paulo</option>
      <option value="Sergipe">Sergipe</option>
      <option value="Outro">Outro</option>
    </select>
  </div>

  
  <div>
    <label>E-mail</label>
    <input name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Telefone</label>
    <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
  <div>
    <label>Endereço</label>
    <input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base" />
  </div>
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Processo</label>
<Select
  isMulti
  name="processo"
  options={processos}
  value={formData.processo
    ?.split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => ({ value: d, label: d }))
  }
  onChange={(selectedOptions) => {
    const values = selectedOptions.map((opt) => opt.value).join("; ");
    setFormData((prev) => ({
      ...prev,
      processo: values,
    }));
  }}
  className="basic-multi-select"
  classNamePrefix="select"
/>
</div>

  <div>
    <label>Estado Civil</label>
    <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base">
      <option value="">Estado Civil</option>
      <option value="Solteiro">Solteiro(a)</option>
      <option value="Casado">Casado(a)</option>
      <option value="Divorciado">Divorciado(a)</option>
      <option value="Viúvo">Viúvo(a)</option>
      <option value="União Estável">União Estável</option>
    </select>
  </div>
  <div>
    <label>Gênero</label>
    <select name="genero" value={formData.genero} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-3 text-base">
      <option value="">Gênero</option>
      <option value="Masculino">Masculino</option>
      <option value="Feminino">Feminino</option>
      <option value="Outro">Outro</option>
    </select>
  </div>
</div>
  
  </div>

  <hr className="my-8" />



  {/* Botão */}
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

<div className="mt-10 text-right">
  <button
    disabled={loading}
    onClick={handleSubmit}
    className={`w-32 flex items-center justify-center gap-2 px-4 py-2 rounded text-white transition ${
      loading
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700'
    }`}
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
      'Próximo'
    )}
  </button>
</div>

</div>


      </div>
    </div>
  );
}

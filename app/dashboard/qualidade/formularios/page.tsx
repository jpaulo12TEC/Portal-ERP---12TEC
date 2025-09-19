'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/superbase';
import Sidebar from '@/components/Sidebar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FilePlus, FileText, Upload } from 'lucide-react';
import { useUser } from '@/components/UserContext';
import { MoreVertical, Download, Edit, RefreshCw } from "lucide-react";

interface Formulario {
  id: number;
  nome_do_formulario: string;
  sobre: string;
  versao: number;
  tipo: string;
  ultima_modificacao: string;
  created_at: string;
  url: string;
  item_id: string;
}

const tiposDocumento = [
  "Tabela", "Procedimento", "Formulario", "Apostila", 
  "Apresentação", "Ficha Técnica", "Manual", "Template"
];

export default function ListaFormularios() {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Qualidade');
  const [menuActive, setMenuActive] = useState(false);
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<Formulario | null>(null);

  const [updateMode, setUpdateMode] = useState(false);
  

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [sobre, setSobre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<string>(tiposDocumento[0]);

  useEffect(() => {
    fetchFormularios();
  }, []);

  const fetchFormularios = async () => {
    // Buscar última versão de cada formulário
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('nome_do_formulario', { ascending: true })
      .order('versao', { ascending: false });

    if (error) console.error(error);
    else {
      // Pega apenas a última versão de cada formulário
      const latestVersions: Record<string, Formulario> = {};
      (data || []).forEach((f: Formulario) => {
        if (!latestVersions[f.nome_do_formulario]) {
          latestVersions[f.nome_do_formulario] = f;
        }
      });
      setFormularios(Object.values(latestVersions));
    }
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  const handleNovoFormulario = () => {
    setEditingForm(null);
    setNome('');
    setSobre('');
    setFile(null);
    setTipo(tiposDocumento[0]);
    setModalOpen(true);
  };

  const handleEditarFormulario = (form: Formulario) => {
    setEditingForm(form);
    setNome(form.nome_do_formulario);
    setSobre(form.sobre);
    setTipo(form.tipo);
    setFile(null);
    setModalOpen(true);

    setUpdateMode(false); // apenas edição, pode gerar nova versão
  };




const [searchTerm, setSearchTerm] = useState("");

// 🔍 Filtragem por nome ou tipo
const filteredFormularios = formularios.filter(
  (form) =>
    form.nome_do_formulario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.tipo.toLowerCase().includes(searchTerm.toLowerCase())
);

// 📂 Baixar documento
const handleDownload = (form: Formulario) => {
  if (form.url) {
    window.open(form.url, "_blank");
  } else {
    alert("Este documento não possui arquivo anexado.");
  }
};


// 🔄 Atualizar documento (substituir arquivo)
const handleUpdate = (form: Formulario) => {
  setEditingForm(form);
  setNome(form.nome_do_formulario);
  setSobre(form.sobre);
  setTipo(form.tipo);
  setFile(null);
  setModalOpen(true);

  setUpdateMode(true); // agora é update direto
};





const handleSalvarFormulario = async () => {
  console.log(">> handleSalvarFormulario INICIADO", {
    editingForm,
    updateMode,
    nome,
    sobre,
    tipo,
    file
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn("⚠️ Usuário não autenticado!");
    alert("Usuário não autenticado!");
    return;
  }

  try {
    let fileUrl = editingForm?.url || '';
    let fileId = editingForm?.item_id || '';

    // Se enviou arquivo novo → faz upload via API
    if (file) {
      console.log("Arquivo recebido para upload:", {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const extension = file.name.split('.').pop() || '';
      const fileName = `formulario_${Date.now()}.${extension}`;
      console.log("Nome do arquivo gerado:", fileName);

      // FormData para rota API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);
      formData.append("tipo", "formularios");
      formData.append("caminho", editingForm?.item_id || "novo");

      const res = await fetch("/api/onedrive/upload", {
        method: "POST",
        body: formData,
      });

      const uploaded = await res.json();
      if (!uploaded?.success) throw new Error(uploaded?.error || "Erro ao enviar arquivo via API");

      fileUrl = uploaded.file?.url || '';
      fileId = uploaded.file?.id || '';

      console.log("Arquivo novo -> url:", fileUrl, "id:", fileId);

      // Opcional: mover arquivo antigo para "Não Vigentes"
      if (editingForm?.item_id) {
        try {
          console.log("Tentando mover arquivo antigo (item_id):", editingForm.item_id);
          const moveRes = await fetch("/api/onedrive/move", {
            method: "POST",
            body: JSON.stringify({ itemId: editingForm.item_id, destino: "formularios/nao-vigentes" }),
            headers: { "Content-Type": "application/json" }
          });
          const moveData = await moveRes.json();
          console.log("Arquivo antigo movido:", moveData);
        } catch (moveErr) {
          console.warn("Falha ao mover arquivo antigo (não fatal):", moveErr);
        }
      }
    } else {
      console.log("Nenhum arquivo novo enviado - mantendo fileUrl/item_id existentes:", { fileUrl, fileId });
    }

    const now = new Date().toISOString();

    if (editingForm) {
      if (updateMode) {
        // 🔄 Atualizar o mesmo registro
        const payload = {
          nome_do_formulario: nome,
          sobre,
          tipo,
          ultima_modificacao: now,
          url: fileUrl,
          item_id: fileId,
          usuario_id: user.id,
        };
        console.log("Fazendo UPDATE com payload:", payload, " onde id =", editingForm.id);

        const { data, error } = await supabase
          .from("formularios")
          .update(payload)
          .eq("id", editingForm.id)
          .select();

        console.log("Resposta UPDATE Supabase:", { data, error });
        if (error) throw error;
      } else {
        // ➕ Criar nova versão
        console.log("Criando nova versão para:", editingForm.nome_do_formulario);
        const { data: ultimaVersaoData, error: ultimaErr } = await supabase
          .from('formularios')
          .select('versao')
          .eq('nome_do_formulario', editingForm.nome_do_formulario)
          .order('versao', { ascending: false })
          .limit(1)
          .single();

        const ultimaVersao = (ultimaVersaoData as any)?.versao;
        const novaVersao = (ultimaVersao ?? 0) + 1;

        const insertPayload = {
          nome_do_formulario: nome,
          sobre,
          tipo,
          versao: novaVersao,
          ultima_modificacao: now,
          created_at: now,
          url: fileUrl,
          item_id: fileId,
          usuario_id: user.id,
        };
        console.log("Fazendo INSERT com payload:", insertPayload);

        const { data, error } = await supabase.from("formularios").insert([insertPayload]).select();
        console.log("Resposta INSERT Supabase:", { data, error });
        if (error) throw error;
      }
    } else {
      // 🆕 Novo formulário
      const insertPayload = {
        nome_do_formulario: nome,
        sobre,
        tipo,
        versao: 1,
        ultima_modificacao: now,
        created_at: now,
        url: fileUrl,
        item_id: fileId,
        usuario_id: user.id,
      };
      console.log("Inserindo novo formulário com payload:", insertPayload);

      const { data, error } = await supabase.from("formularios").insert([insertPayload]).select();
      console.log("Resposta INSERT (novo) Supabase:", { data, error });
      if (error) throw error;
    }

    console.log("✔️ Salvar formulário concluído com sucesso.");
    setModalOpen(false);
    fetchFormularios();
    setUpdateMode(false);

  } catch (err: any) {
    console.error("Erro ao salvar formulário:", err);
    alert(`Erro ao salvar formulário: ${err.message ?? err}`);
  }
};



  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
      {/* Topbar */}
      <div className="flex items-center justify-between bg-[#200101] text-white shadow-md">
        <div className="flex space-x-4 w-full h-[40px] items-center">
          <button
            onClick={() => window.history.back()}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-full transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="px-3 py-3 h-[50px]">
            <span className="w-full text-left">Formulários</span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-auto pr-4">
          <img src="/Logobranca.png" alt="Logo da Empresa" className="h-[40px] w-auto" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={handleNavClick}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        <div className="p-6 w-full max-w-[1100px] mx-auto">


          


          {/* Barra de busca */}
<div className="flex items-center justify-between mb-6">
  <input
    type="text"
    placeholder="Buscar por nome ou tipo..."
    className="border rounded-lg px-4 py-2 w-full max-w-md shadow-sm focus:ring-2 focus:ring-[#5a0d0d]"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button
    onClick={handleNovoFormulario}
    className="ml-4 flex items-center gap-2 px-4 py-2 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-lg shadow-sm transition-all"
  >
    <FilePlus size={18} />
    Novo Formulário
  </button>
</div>

<Separator className="mb-6" />

          {/* Lista */}
{/* Lista moderna */}
{/* Lista moderna */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {filteredFormularios.map((form) => (
    <div
      key={form.id}
      className="p-5 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
    >
      {/* Nome e tipo */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <FileText className="text-[#5a0d0d] w-6 h-6" />
          <h4 className="text-md font-semibold text-[#200101]">
            {form.nome_do_formulario}
          </h4>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-[#5a0d0d]/10 text-[#5a0d0d] rounded-full">
          {form.tipo}
        </span>
      </div>

      {/* Descrição */}
      <p className="text-sm text-gray-600 mb-4 ">{form.sobre}</p>

      {/* Metadados */}
      <div className="text-xs text-gray-500 space-y-1 mb-4">
        <p><strong>Versão:</strong> {form.versao}</p>
        <p><strong>Última modificação:</strong> {new Date(form.ultima_modificacao).toLocaleDateString()}</p>
      </div>

      {/* Ações - direto no card */}
      <div className="flex justify-between items-center border-t pt-3">
        <button
          onClick={() => handleDownload(form)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
        >
          <Download size={16} /> Baixar
        </button>
        <button
          onClick={() => handleEditarFormulario(form)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-blue-700 hover:bg-blue-50 transition"
        >
          <Edit size={16} /> Editar
        </button>
        <button
          onClick={() => handleUpdate(form)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-green-700 hover:bg-green-50 transition"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
    </div>
  ))}
</div>

        </div>
      </div>

      {/* Modal Novo/Editar */}
{modalOpen && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-[500px]">
      <h3 className="text-lg font-semibold mb-4">
        {editingForm
          ? updateMode
            ? "Atualizar Formulário"
            : "Editar Formulário"
          : "Novo Formulário"}
      </h3>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nome do formulário"
          className="w-full border rounded-lg px-3 py-2"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <textarea
          placeholder="Sobre"
          className="w-full border rounded-lg px-3 py-2"
          value={sobre}
          onChange={(e) => setSobre(e.target.value)}
        />
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {tiposDocumento.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Só mostra upload se NÃO estiver em modo update */}
        {!updateMode && (
          <input
            type="file"
            className="w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setModalOpen(false)}
          className="px-4 py-2 border rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleSalvarFormulario}
          className="flex items-center gap-2 px-4 py-2 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-lg shadow-sm"
        >
          <Upload size={16} />
          Salvar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

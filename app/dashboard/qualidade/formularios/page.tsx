'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/superbase';
import Sidebar from '@/components/Sidebar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FilePlus, FileText, Upload } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { uploadFileToOneDrive } from '@/lib/uploadFileToOneDrive';
import { moveFileOnOneDrive } from '@/lib/moveFileOnOneDrive';
import { useUser } from '@/components/UserContext';

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
  };

  const handleSalvarFormulario = async () => {
    const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
      console.warn("⚠️ Usuário não autenticado!");
      alert("Usuário não autenticado!");

      return;
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Token de acesso não encontrado.");

      let fileUrl = '';
      let fileId = '';

      // Upload do arquivo (se houver)
      if (file) {
        const extension = file.name.split('.').pop(); // 'pdf', 'docx', etc.
         const fileName = `formulario_${Date.now()}.${extension}`;
        const newFile = await uploadFileToOneDrive(
          accessToken,
          file,
          fileName,
          new Date().toISOString().slice(0,10),
          "",
          "formularios"
        );

        if (!newFile) throw new Error("Falha no upload do arquivo.");
        fileUrl = newFile.url;
        fileId = newFile.id;
      }

      // Determina a nova versão
      let novaVersao = 1;
      if (editingForm) {
        // Pega última versão existente do formulário
        const { data: ultimaVersao } = await supabase
          .from('formularios')
          .select('versao')
          .eq('nome_do_formulario', editingForm.nome_do_formulario)
          .order('versao', { ascending: false })
          .limit(1)
          .single();
        novaVersao = ultimaVersao?.versao + 1 || 1;

        // Move arquivo antigo para Não Vigentes
        if (editingForm.item_id) {
          await moveFileOnOneDrive(accessToken, editingForm.item_id, "formularios");
        }
      }

      // Insere nova versão sempre
      const { error } = await supabase.from('formularios').insert([
        {
          nome_do_formulario: nome,
          sobre,
          tipo,
          versao: novaVersao,
          ultima_modificacao: new Date().toISOString(),
          created_at: new Date().toISOString(),
          url: fileUrl,
          item_id: fileId,
          usuario_id: user.id
        },
      ]);

      if (error) throw error;

      setModalOpen(false);
      fetchFormularios();
    } catch (err) {
      console.error("Erro ao salvar formulário:", err);
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Lista de Formulários</h3>
            <button
              onClick={handleNovoFormulario}
              className="flex items-center gap-2 px-4 py-2 bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white rounded-lg shadow-sm transition-all"
            >
              <FilePlus size={18} />
              Novo Formulário
            </button>
          </div>

          <Separator className="mb-6" />

          {/* Lista */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formularios.map((form) => (
              <div
                key={form.id}
                onClick={() => handleEditarFormulario(form)}
                className="p-5 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="text-[#5a0d0d] w-6 h-6" />
                  <h4 className="text-md font-semibold text-[#200101]">{form.nome_do_formulario}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">{form.sobre}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Tipo:</strong> {form.tipo}</p>
                  <p><strong>Versão:</strong> {form.versao}</p>
                  <p><strong>Última modificação:</strong> {new Date(form.ultima_modificacao).toLocaleDateString()}</p>
                  <p><strong>Criado em:</strong> {new Date(form.created_at).toLocaleDateString()}</p>
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
              {editingForm ? 'Editar Formulário' : 'Novo Formulário'}
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
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="file"
                className="w-full"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
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

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/superbase'; // usa a sua instância já configurada
import Sidebar from '@/components/Sidebar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FilePlus, FileText, Upload } from 'lucide-react';
import { getAccessToken } from '@/lib/auth'; 
import { uploadFileToOneDrive } from '@/lib/uploadFileToOneDrive'; 

interface Formulario {
  id: number;
  nome_do_formulario: string;
  sobre: string;
  versao: string;
  ultima_modificacao: string;
  created_at: string;
  url: string;
}

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
  const [versao, setVersao] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchFormularios();
  }, []);

  const fetchFormularios = async () => {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('ultima_modificacao', { ascending: false });

    if (error) console.error(error);
    else setFormularios(data || []);
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  const handleNovoFormulario = () => {
    setEditingForm(null);
    setNome('');
    setSobre('');
    setVersao('');
    setFile(null);
    setModalOpen(true);
  };

  const handleEditarFormulario = (form: Formulario) => {
    setEditingForm(form);
    setNome(form.nome_do_formulario);
    setSobre(form.sobre);
    setVersao(form.versao);
    setFile(null);
    setModalOpen(true);
  };

  const handleSalvarFormulario = async () => {
    let fileUrl = editingForm?.url || '';

    // Upload do arquivo (se houver)
    if (file) {
      const filePath = `formularios/${Date.now()}_${file.name}`;
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('arquivos') // bucket "arquivos"
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from('arquivos')
        .getPublicUrl(filePath);

      fileUrl = publicUrl.publicUrl;
    }

    if (editingForm) {
      // Atualizar
      const { error } = await supabase
        .from('formularios')
        .update({
          nome_do_formulario: nome,
          sobre,
          versao,
          ultima_modificacao: new Date().toISOString(),
          url: fileUrl,
        })
        .eq('id', editingForm.id);

      if (error) console.error(error);
    } else {
      // Inserir novo
      const { error } = await supabase.from('formularios').insert([
        {
          nome_do_formulario: nome,
          sobre,
          versao,
          ultima_modificacao: new Date().toISOString(),
          created_at: new Date().toISOString(),
          url: fileUrl,
        },
      ]);

      if (error) console.error(error);
    }

    setModalOpen(false);
    fetchFormularios();
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
              <input
                type="text"
                placeholder="Versão"
                className="w-full border rounded-lg px-3 py-2"
                value={versao}
                onChange={(e) => setVersao(e.target.value)}
              />
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

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/superbase';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { ArrowLeft, Search, Upload } from 'lucide-react';
import { useUser } from '@/components/UserContext';

export default function Perfil() {
  const { nome } = useUser();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Meu Perfil');
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


  
  const [telefoneEdit, setTelefoneEdit] = useState('');
  const [editandoTelefone, setEditandoTelefone] = useState(false);

  // Campos para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

const handleAlterarSenha = async () => {
  if (!senhaAtual || !novaSenha || !confirmaSenha) {
    alert('Por favor, preencha todos os campos de senha.');
    return;
  }

  if (novaSenha !== confirmaSenha) {
    alert('A nova senha e a confirmação não coincidem.');
    return;
  }

  try {
    setAlterandoSenha(true);

    // Pega o usuário atual para o email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert('Usuário não autenticado.');
      setAlterandoSenha(false);
      return;
    }

    // Valida a senha atual fazendo um re-login (signIn) com email + senhaAtual
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: senhaAtual,
    });

    if (signInError || !signInData.user) {
      alert('Senha atual incorreta.');
      setAlterandoSenha(false);
      return;
    }

    // Se senha atual correta, atualiza a senha
    const { data, error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      alert('Erro ao alterar a senha: ' + error.message);
      setAlterandoSenha(false);
      return;
    }

    alert('Senha alterada com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmaSenha('');
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    alert('Erro inesperado ao alterar senha.');
  } finally {
    setAlterandoSenha(false);
  }
};

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Erro ao obter usuário:', userError);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, empresa, cargo, nivel_acesso, email, telefone, departamento, fotocaminho')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else {
        setProfile(data);
        fetchFoto(data?.fotocaminho);
      }
    };





    const fetchFoto = async (fotocaminho: string) => {
      if (fotocaminho) {
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('fotoperfil')
          .createSignedUrl(fotocaminho, 600); // URL válida por 10 minutos

        if (urlError) {
          console.error('Erro ao gerar URL da foto:', urlError);
        } else {
          setFotoUrl(urlData?.signedUrl);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/${tab}`);
  };

  const handleFotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];

      if (!file) {
        alert('Nenhum arquivo selecionado.');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Usuário não autenticado.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload da imagem
      const { error: uploadError } = await supabase.storage
        .from('fotoperfil')
        .upload(filePath, file, {
          upsert: true, // substitui se já existir
        });

      if (uploadError) {
        throw uploadError;
      }

      // Atualiza o caminho da foto no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ fotocaminho: filePath })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Atualiza a foto exibida
      const { data: urlData } = await supabase.storage
        .from('fotoperfil')
        .createSignedUrl(filePath, 600);

      setFotoUrl(urlData?.signedUrl ?? null);
      alert('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da foto!');
    } finally {
      setUploading(false);
    }
  };

  const handleSalvarTelefone = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Usuário não autenticado.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ telefone: telefoneEdit })
      .eq('id', user.id);

    if (error) {
      alert('Erro ao atualizar telefone: ' + error.message);
      return;
    }

    setProfile({ ...profile, telefone: telefoneEdit });
    setEditandoTelefone(false);
    alert('Telefone atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar telefone:', error);
    alert('Erro ao salvar telefone.');
  }
};


return (
  <div className={`flex flex-col h-screen transition-all duration-300 ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
    {/* Topbar */}
    <header className="flex items-center justify-between bg-[#200101] p-3 text-white shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 bg-[#5a0d0d] hover:bg-[#7a1a1a] rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-700"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-semibold">Voltar</span>
        </button>

        <button className="text-white hover:text-gray-300 font-semibold text-lg focus:outline-none focus:underline">
          Meu Perfil na Intranet
        </button>
      </div>

      <div className="relative w-full max-w-md mx-6">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2 rounded-full h-10 bg-white text-black placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          aria-label="Buscar"
        />
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
      </div>

      <div className="flex-shrink-0 pr-4">
        <img src="/Logobranca.png" alt="Logo da Empresa" className="h-12 w-auto" />
      </div>
    </header>

    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        onNavClickAction={handleNavClick}
        className="h-full"
        menuActive={menuActive}
        setMenuActive={setMenuActive}
        activeTab={activeTab}
      />

      <main className="flex-1 p-10 max-w-5xl mx-auto w-full overflow-y-auto">
        {profile ? (
          <div className="flex flex-col sm:flex-row gap-12 items-center sm:items-start">
            {/* Foto */}
            <div className="flex flex-col items-center gap-6 min-w-[10rem]">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto de Perfil"
                  className="w-40 h-40 rounded-full object-cover border-4 border-[#5a0d0d] shadow-md"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center border-4 border-[#5a0d0d] shadow-inner">
                  <span className="text-gray-600 text-lg font-medium">Sem Foto</span>
                </div>
              )}

              <label
                htmlFor="upload-foto"
                className="cursor-pointer bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white px-6 py-2 rounded-full flex items-center gap-2 select-none transition focus:outline-none focus:ring-2 focus:ring-red-700"
              >
                <Upload size={18} />
                {uploading ? 'Carregando...' : 'Alterar Foto'}
              </label>
              <input
                id="upload-foto"
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                className="hidden"
              />
            </div>

            {/* Dados do perfil */}
            <section className="flex-1 space-y-6 w-full max-w-xl text-gray-800">
              <p><strong className="font-semibold">Nome:</strong> {profile.nome}</p>
              <p><strong className="font-semibold">Email:</strong> {profile.email}</p>

              {/* Telefone com edição inline */}
              <p>
                <strong className="font-semibold">Telefone:</strong>{' '}
                {editandoTelefone ? (
                  <div className="flex flex-wrap gap-3 items-center mt-1 max-w-sm">
                    <input
                      type="text"
                      value={telefoneEdit}
                      onChange={(e) => setTelefoneEdit(e.target.value)}
                      className="border border-gray-300 rounded-md px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="Digite o telefone"
                      aria-label="Editar telefone"
                    />
                    <button
                      onClick={handleSalvarTelefone}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-label="Salvar telefone"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditandoTelefone(false);
                        setTelefoneEdit(profile.telefone ?? '');
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-md shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                      aria-label="Cancelar edição do telefone"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-3 mt-1 text-gray-700">
                    <span>{profile.telefone}</span>
                    <button
                      onClick={() => {
                        setTelefoneEdit(profile.telefone ?? '');
                        setEditandoTelefone(true);
                      }}
                      className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
                      aria-label="Editar telefone"
                    >
                      Editar
                    </button>
                  </span>
                )}
              </p>

              <p><strong className="font-semibold">Empresa:</strong> {profile.empresa}</p>
              <p><strong className="font-semibold">Departamento:</strong> {profile.departamento}</p>
              <p><strong className="font-semibold">Cargo:</strong> {profile.cargo}</p>
              <p><strong className="font-semibold">Nível de Acesso:</strong> {profile.nivel_acesso}</p>
            </section>

            {/* Alterar senha */}
<section className="mt-8 max-w-md w-full bg-[#fff5f5] p-6 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-5 text-[#5a0d0d]">Alterar senha</h2>

  <input
    type="password"
    placeholder="Senha atual"
    value={senhaAtual}
    onChange={(e) => setSenhaAtual(e.target.value)}
    className="mb-3 w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition"
    disabled={alterandoSenha}
    autoComplete="current-password"
  />

  <input
    type="password"
    placeholder="Nova senha"
    value={novaSenha}
    onChange={(e) => setNovaSenha(e.target.value)}
    className="mb-3 w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition"
    disabled={alterandoSenha}
    autoComplete="new-password"
  />

  <input
    type="password"
    placeholder="Confirme a nova senha"
    value={confirmaSenha}
    onChange={(e) => setConfirmaSenha(e.target.value)}
    className="mb-6 w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition"
    disabled={alterandoSenha}
    autoComplete="new-password"
  />

  <button
    onClick={handleAlterarSenha}
    disabled={alterandoSenha}
    className="bg-[#5a0d0d] hover:bg-[#7a1a1a] text-white px-6 py-3 rounded-md font-semibold w-full transition"
  >
    {alterandoSenha ? 'Alterando...' : 'Alterar senha'}
  </button>
</section>

          </div>
        ) : (
          <p className="text-center text-gray-500">Carregando perfil...</p>
        )}
      </main>
    </div>
  </div>
);


}

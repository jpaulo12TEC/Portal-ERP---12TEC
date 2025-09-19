'use client';

import React, { useEffect, useState } from 'react';
import { FaHome, FaUser, FaComment, FaBoxes, FaChartBar, FaCheckCircle, FaCogs, FaFileContract, FaTruck, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import '../app/stylesidebar.css';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SidebarProps {
  className?: string;
  onNavClickAction: (tab: string) => void;
  menuActive: boolean;
  setMenuActive: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
}

const Sidebar = ({ className = '', onNavClickAction, menuActive, setMenuActive, activeTab }: SidebarProps) => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [fotoCaminho, setFotoCaminho] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [cargo, setCargo] = useState<string | null>(null);

  const toggleSidebar = () => setMenuActive(!menuActive);

const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('cargoUsuario');
    localStorage.removeItem('fotoCaminho');
    window.location.href = "/api/auth/logout";
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    router.push('/');
  }
};


  const navigateTo = (tab: string, path: string) => {
    onNavClickAction(tab);
    router.push(path);
  };

useEffect(() => {
  const fetchUserData = async () => {
    // Verifica se já tem a foto no localStorage
    const cachedPhoto = localStorage.getItem('fotoCaminho');
    const cachedNome = localStorage.getItem('nomeUsuario');
    const cachedCargo = localStorage.getItem('cargoUsuario');

    if (cachedPhoto || cachedNome || cachedCargo) {
      if (cachedPhoto) setFotoCaminho(cachedPhoto);
      if (cachedNome) setNome(cachedNome);
      if (cachedCargo) setCargo(cachedCargo);
      return; // sai do fetch
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) return console.error('Erro ao obter usuário:', userError.message);
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('nome, cargo, fotocaminho')
      .eq('id', user.id)
      .single();

    if (error) return console.error('Erro ao buscar perfil:', error.message);

    setNome(data?.nome);
    setCargo(data?.cargo);
    localStorage.setItem('nomeUsuario', data?.nome || '');
    localStorage.setItem('cargoUsuario', data?.cargo || '');

    if (data?.fotocaminho) {
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('fotoperfil')
        .createSignedUrl(data.fotocaminho, 60 * 60 * 24 * 1); // expira em 7 dias
      if (signedUrlError) {
        setFotoCaminho(null);
      } else {
        setFotoCaminho(signedUrlData.signedUrl);
        localStorage.setItem('fotoCaminho', signedUrlData.signedUrl);
      }
    } else {
      setFotoCaminho(null);
    }
  };

  fetchUserData();
}, [supabase]);


  return (
    <div>
      <div
        className={`sidebarWrapper ${menuActive ? 'menu-active' : ''}`}
        onMouseEnter={() => setMenuActive(true)}
        onMouseLeave={() => setMenuActive(false)}
        onClick={toggleSidebar}
      >
        <div className={`sidebar ${menuActive ? 'active' : ''}`} onClick={toggleSidebar}>
          <ul>
            <div className="Menu">
              <div className="Primeiro">
                <li className="Perfil">
                  <a href="/dashboard/meuperfil" onClick={(e) => { e.preventDefault(); navigateTo('', '/dashboard/meuperfil'); }}>
                    <div className="Perfil2">
                      <div className="icon">
                        <div className="imgBx">
                          <img src={fotoCaminho || '/img.png'} alt="Profile" />
                        </div>
                      </div>
                      <div className={`text ${menuActive ? '' : 'collapsed'}`}>{nome || 'Carregando...'}</div>
                      <div className={`text ${menuActive ? '' : 'collapsed'}`}>{cargo || ''}</div>
                    </div>
                  </a>
                </li>
              </div>

              <div className="Menulist">
                <li className={activeTab === 'Início' ? 'active' : ''}>
                  <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigateTo('Início', '/dashboard'); }}>
                    <div className="icon"><FaHome /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Início</div>
                  </a>
                </li>

                <li className={activeTab === 'Qualidade' ? 'active' : ''}>
                  <a href="/dashboard/qualidade" onClick={(e) => { e.preventDefault(); navigateTo('Qualidade', '/dashboard/qualidade'); }}>
                    <div className="icon"><FaCheckCircle /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Qualidade</div>
                  </a>
                </li>

                <li className={activeTab === 'Pessoal' ? 'active' : ''}>
                  <a href="/dashboard/RH" onClick={(e) => { e.preventDefault(); navigateTo('Pessoal', '/dashboard/RH'); }}>
                    <div className="icon"><FaUser /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Pessoal</div>
                  </a>
                </li>

                <li className={activeTab === 'Solicitação' ? 'active' : ''}>
                  <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('Solicitação', '/'); }}>
                    <div className="icon"><FaComment /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Solicitação</div>
                  </a>
                </li>

                <li className={activeTab === 'Ordens de Serviço' ? 'active' : ''}>
                  <a href="/dashboard/ordensdeservico" onClick={(e) => { e.preventDefault(); navigateTo('Ordens de Serviço', '/dashboard/ordensdeservico'); }}>
                    <div className="icon"><FaCogs /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Operações</div>
                  </a>
                </li>

                <li className={activeTab === 'Logística' ? 'active' : ''}>
                  <a href="/dashboard/logistica" onClick={(e) => { e.preventDefault(); navigateTo('Logística', '/dashboard/logistica'); }}>
                    <div className="icon"><FaTruck /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Logística</div>
                  </a>
                </li>

                <li className={activeTab === 'Financeiro' ? 'active' : ''}>
                  <a href="/dashboard/financeiro" onClick={(e) => { e.preventDefault(); navigateTo('Financeiro', '/dashboard/financeiro'); }}>
                    <div className="icon"><FaChartBar /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Financeiro</div>
                  </a>
                </li>

                <li className={activeTab === 'Contratos' ? 'active' : ''}>
                  <a href="/dashboard/contratos" onClick={(e) => { e.preventDefault(); navigateTo('Contratos', '/dashboard/contratos-servicos'); }}>
                    <div className="icon"><FaFileContract /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Contratos</div>
                  </a>
                </li>

                <li className={activeTab === 'Suprimentos' ? 'active' : ''}>
                  <a href="/dashboard/suprimentos" onClick={(e) => { e.preventDefault(); navigateTo('Suprimentos', '/dashboard/suprimentos'); }}>
                    <div className="icon"><FaBoxes /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Suprimentos</div>
                  </a>
                </li>

                <li className={activeTab === 'SSMA' ? 'active' : ''}>
                  <a href="/ssma" onClick={(e) => { e.preventDefault(); navigateTo('SSMA', '/dashboard/SSMA'); }}>
                    <div className="icon"><FaShieldAlt /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>SSMA</div>
                  </a>
                </li>
              </div>

              <div className="bottom">
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <a href="#">
                    <div className="icon"><FaSignOutAlt /></div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Logout</div>
                  </a>
                </li>
              </div>
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

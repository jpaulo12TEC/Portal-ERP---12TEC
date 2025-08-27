'use client';

import React, { useEffect, useState } from 'react';
import { FaHome, FaUser, FaComment, FaChartBar, FaShoppingCart, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { FaFileContract } from 'react-icons/fa';
import msalInstance from "@/lib/msalConfig";
import Link from 'next/link';
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

  const [openFinanceiro, setOpenFinanceiro] = useState(false);
  const [nome, setNome] = useState<string | null>(null);
  const [cargo, setCargo] = useState<string | null>(null);

  const toggleSidebar = () => {
    setMenuActive(!menuActive);
  };

const handleLogout = async () => {
  try {
    // 1️⃣ Logout Supabase
    await supabase.auth.signOut();

    // 2️⃣ Logout MSAL (remove conta do cache)
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await msalInstance.logoutRedirect({
        account: accounts[0], // pode iterar se tiver várias contas
        postLogoutRedirectUri: window.location.origin,
      });
    } else {
      // Se não houver conta MSAL, só redireciona
      router.push('/');
    }
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    router.push('/');
  }
};

  const activeLink = (e: React.MouseEvent, tab: string) => {
    onNavClickAction(tab);
  };

  // 🔥 Puxando dados do Supabase
useEffect(() => {
  const fetchUserData = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Erro ao obter usuário:', userError.message);
      return;
    }

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, cargo, fotocaminho')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
      } else {
        setNome(data?.nome);
        setCargo(data?.cargo);

        if (data?.fotocaminho) {
          // gera signed URL para a foto
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('fotoperfil')
            .createSignedUrl(data.fotocaminho, 60); // expira em 60 segundos

          if (signedUrlError) {
            console.error('Erro ao gerar URL da foto:', signedUrlError.message);
            setFotoCaminho(null);
          } else {
            setFotoCaminho(signedUrlData.signedUrl);
          }
        } else {
          setFotoCaminho(null);
        }
      }
    }
  };

  fetchUserData();
}, [supabase]);

  return (
    <div>
      <div className={`sidebarWrapper ${menuActive ? 'menu-active' : ''}`}   onMouseEnter={() => setMenuActive(true)}
  onMouseLeave={() => setMenuActive(false)} onClick={toggleSidebar}>
        <div className={`sidebar ${menuActive ? 'active' : ''}`} onClick={toggleSidebar}>
          <ul>
            <div className="Menu">
              <div className="Primeiro" >
                <li className={"Perfil"} onClick={(e) => activeLink(e, '')}>
                  <a href="/dashboard/meuperfil">
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
                <li className={activeTab === 'Início' ? 'active' : ''} onClick={(e) => activeLink(e, '')}>
                  <Link href="">
                    <div className="icon">
                      <FaHome />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Início</div>
                  </Link>
                </li>
                <li className={activeTab === 'Pessoal' ? 'active' : ''} onClick={(e) => activeLink(e, '')}>
                  <Link href="/">
                    <div className="icon">
                      <FaUser />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Pessoal</div>
                  </Link>
                </li>
                <li className={activeTab === 'Solicitação' ? 'active' : ''} onClick={(e) => activeLink(e, '')}>
                  <Link href="/">
                    <div className="icon">
                      <FaComment />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Solicitação</div>
                  </Link>
                </li>
                <li className={activeTab === 'Financeiro' ? 'active' : ''} onClick={(e) => activeLink(e, 'Financeiro')}>
                  <Link href="">
                    <div className="icon">
                      <FaChartBar />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Financeiro</div>
                  </Link>
                </li>
                <li className={activeTab === 'contratos' ? 'active' : ''} onClick={(e) => activeLink(e, 'contratos-servicos')}>
                  <Link href="">
                    <div className="icon">
                      <FaFileContract />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Contratos</div>
                  </Link>
                </li>
                <li className={activeTab === 'Compras' ? 'active' : ''} onClick={(e) => activeLink(e, '')}>
                  <Link href="">
                    <div className="icon">
                      <FaShoppingCart />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Compra</div>
                  </Link>
                </li>
                <li className={activeTab === 'Configurações' ? 'active' : ''} onClick={(e) => activeLink(e, '')}>
                  <Link href="/">
                    <div className="icon">
                      <FaCog />
                    </div>
                    <div className={`text ${menuActive ? '' : 'collapsed'}`}>Configurações</div>
                  </Link>
                </li>
              </div>

              <div className="bottom">
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <a href="#">
                    <div className="icon">
                      <FaSignOutAlt />
                    </div>
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

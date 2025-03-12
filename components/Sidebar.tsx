import React from 'react';
import { FaApple, FaHome, FaUser, FaComment, FaChartBar, FaShoppingCart, FaCog, FaSignOutAlt } from 'react-icons/fa';
import Link from 'next/link';
import '../app/stylesidebar.css';

interface SidebarProps {
  className?: string;
  onNavClickAction: (tab: string) => void;
  menuActive: boolean; 
  setMenuActive: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string; // Recebe o item ativo
}

const Sidebar = ({ className = '', onNavClickAction, menuActive, setMenuActive, activeTab }: SidebarProps) => {
  const toggleSidebar = () => {
    setMenuActive(!menuActive);
  };

  const activeLink = (e: React.MouseEvent, tab: string) => {
    onNavClickAction(tab); // Chama a função do pai para atualizar o item ativo
  };

  return (
    <div>
      <div className={`sidebarWrapper ${menuActive ? 'menu-active' : ''}`} onClick={toggleSidebar}>
        <div className={`sidebar ${menuActive ? 'active' : ''}`} onClick={toggleSidebar}>


          
          <ul>
            <div className = "Menu">

              
            <div className= "Primeiro">
            <li className="Perfil">
              <a href="#">
                <div className="Perfil2">
                  <div className="icon">
                    <div className="imgBx">
                      <img src="/img.png" alt="Profile" />
                    </div>
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>João Paulo Santana Melo</div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Gestor de compras</div>
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
              <li className={activeTab === 'Pessoal' ? 'active' : ''} onClick={(e) => activeLink(e, 'Pessoal')}>
                <Link href="/pessoal">
                  <div className="icon">
                    <FaUser />
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Pessoal</div>
                </Link>
              </li>
              <li className={activeTab === 'Solicitação' ? 'active' : ''} onClick={(e) => activeLink(e, 'Solicitação')}>
                <Link href="/solicitacao">
                  <div className="icon">
                    <FaComment />
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Solicitação</div>
                </Link>
              </li>
              <li className={activeTab === 'Financeiro' ? 'active' : ''} onClick={(e) => activeLink(e, 'Financeiro')}>
                <a href="">
                  <div className="icon">
                    <FaChartBar />
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Financeiro</div>
                </a>
              </li>
              <li className={activeTab === 'Compras' ? 'active' : ''} onClick={(e) => activeLink(e, 'Compras')}>
                <Link href="">
                  <div className="icon">
                    <FaShoppingCart />
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Compra</div>
                </Link>
              </li>
              <li className={activeTab === 'Configurações' ? 'active' : ''} onClick={(e) => activeLink(e, 'Configurações')}>
                <Link href="/configuracoes">
                  <div className="icon">
                    <FaCog />
                  </div>
                  <div className={`text ${menuActive ? '' : 'collapsed'}`}>Configurações</div>
                </Link>
              </li>
            </div>




            <div className="bottom">
              <li>
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

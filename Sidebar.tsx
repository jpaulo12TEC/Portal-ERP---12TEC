'use client';
import { useState } from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';

interface SidebarProps {
  onNavClickAction: (page: string) => void;
  className?: string; // Propriedade opcional className para customizar a aparência
}

export default function Sidebar({ onNavClickAction, className = '' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`fixed top-0 left-0 h-screen transition-all duration-300 ${className} ${
        collapsed ? 'w-16' : 'w-60'
      } bg-gray-800 text-white p-4 flex flex-col relative`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <button
        className="absolute -right-4 top-6 bg-gray-600 p-1 rounded-full"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
      <nav className="mt-10 space-y-4">
        <button
          onClick={() => onNavClickAction('Compras')}
          className="block p-2 hover:bg-gray-700 rounded"
        >
          Financeiro
        </button>
        <button
          onClick={() => onNavClickAction('RH')}
          className="block p-2 hover:bg-gray-700 rounded"
        >
          RH
        </button>
        <button
          onClick={() => onNavClickAction('novaCompra')}
          className="block p-2 hover:bg-gray-700 rounded"
        >
          Nova compra
        </button>
      </nav>
    </div>
  );
}

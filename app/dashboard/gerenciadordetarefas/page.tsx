'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, PlusCircle, Star, Calendar, CheckCircle, ClipboardList, Users } from "lucide-react";
import { useUser } from '@/components/UserContext';
import Sidebar from '../../../components/Sidebar';

export default function GerenciarTarefas() {
  const { nome } = useUser();
  const [menuActive, setMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('Meu dia');
  const router = useRouter();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Estudar React', completed: false, important: true },
    { id: 2, title: 'Fazer revisão semanal', completed: true, important: false },
  ]);

  const toggleComplete = (id: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const sections = [
    { name: 'Meu dia', icon: <Calendar size={18} /> },
    { name: 'Minha semana', icon: <ClipboardList size={18} /> },
    { name: 'Meu mês', icon: <CheckCircle size={18} /> },
    { name: 'Importante', icon: <Star size={18} /> },
    { name: 'Planejados', icon: <Calendar size={18} /> },
    { name: 'Solicitados', icon: <Users size={18} /> },
  ];

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
              Gerenciamento de Tarefas e Atribuições
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

      {/* Conteúdo */}
      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={() => {}}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={activeTab}
        />

        {/* Área principal */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Botões das seções */}
          <div className="flex flex-wrap gap-3 mb-6">
            {sections.map((section) => (
              <button
                key={section.name}
                onClick={() => setActiveTab(section.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-all
                  ${activeTab === section.name ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-100'}
                `}
              >
                {section.icon}
                {section.name}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4 text-gray-800">{activeTab}</h2>

          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-white px-4 py-3 rounded-md shadow hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="w-5 h-5"
                  />
                  <span className={`text-md ${task.completed ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </span>
                </div>
                {task.important && <Star size={18} className="text-yellow-400" />}
              </div>
            ))}

            <button
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4"
              onClick={() =>
                setTasks(prev => [
                  ...prev,
                  { id: Date.now(), title: 'Nova Tarefa', completed: false, important: false },
                ])
              }
            >
              <PlusCircle size={20} />
              Adicionar Tarefa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

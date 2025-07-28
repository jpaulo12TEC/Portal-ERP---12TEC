'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, PlusCircle } from 'lucide-react';
import { useUser } from '@/components/UserContext';
import Sidebar from '../../../../components/Sidebar';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


export default function PlannerTarefas() {
  const { nome } = useUser();
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);

  const [buckets, setBuckets] = useState([
    {
      id: 'todo',
      title: 'A Fazer',
      tasks: [
        { id: '1', title: 'Montar proposta comercial', tags: ['Urgente'] },
        { id: '2', title: 'Revisar contratos' },
      ],
    },
    {
      id: 'inProgress',
      title: 'Em andamento',
      tasks: [
        { id: '3', title: 'Desenvolver página inicial', tags: ['Front-end'] },
      ],
    },
    {
      id: 'done',
      title: 'Concluído',
      tasks: [
        { id: '4', title: 'Planejar sprint semanal' },
      ],
    },
  ]);

  const addTaskToBucket = (bucketId: string) => {
    const newTask = { id: Date.now().toString(), title: 'Nova Tarefa' };
    setBuckets(prev =>
      prev.map(bucket =>
        bucket.id === bucketId
          ? { ...bucket, tasks: [...bucket.tasks, newTask] }
          : bucket
      )
    );
  };

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceBucket = buckets.find(b => b.id === source.droppableId)!;
    const destBucket = buckets.find(b => b.id === destination.droppableId)!;

    const [movedTask] = sourceBucket.tasks.splice(source.index, 1);
    destBucket.tasks.splice(destination.index, 0, movedTask);

    setBuckets([...buckets]);
  };

  return (
    <div className={`flex flex-col h-screen ${menuActive ? 'ml-[300px]' : 'ml-[80px]'}`}>
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
              Planner de Tarefas
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
          activeTab={'Planner'}
        />

        {/* Planner visual */}
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full">
              {buckets.map(bucket => (
                <Droppable droppableId={bucket.id} key={bucket.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white border border-gray-200 rounded-xl w-[300px] min-h-[500px] flex flex-col shadow-md transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                    >
                      <div className="p-4 border-b font-semibold text-gray-700 text-lg flex justify-between items-center">
                        {bucket.title}
                      </div>

                      <div className="p-4 space-y-3 flex-1 overflow-auto">
                        {bucket.tasks.map((task, index) => (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-gray-50 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer ${snapshot.isDragging ? 'bg-blue-100' : ''}`}
                              >
                                <div className="text-sm font-medium text-gray-800">{task.title}</div>
                                {task.tags && (
                                  <div className="mt-1 text-xs text-blue-600 bg-blue-100 inline-block px-2 py-0.5 rounded-full">
                                    {task.tags.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>

                      <button
                        onClick={() => addTaskToBucket(bucket.id)}
                        className="flex items-center gap-2 p-3 text-sm text-blue-600 hover:text-blue-800 border-t"
                      >
                        <PlusCircle size={16} /> Adicionar tarefa
                      </button>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}

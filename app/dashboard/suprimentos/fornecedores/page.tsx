'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from '@/components/Sidebar';
import { Users } from 'lucide-react';

type Fornecedor = {
  cnpj: string;
  nome: string;
  categoria: string;
  tipo: string; // Material ou Serviço
  local: string;
};

export default function FornecedoresPage() {
  const router = useRouter();
  const [menuActive, setMenuActive] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<Fornecedor>({
    cnpj: '',
    nome: '',
    categoria: '',
    tipo: '',
    local: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFornecedores([...fornecedores, form]);
    setForm({ cnpj: '', nome: '', categoria: '', tipo: '', local: '' });
  };

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
              Departamento de Compras
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

      <div className="flex flex-1">
        <Sidebar
          onNavClickAction={() => {}}
          className="h-full"
          menuActive={menuActive}
          setMenuActive={setMenuActive}
          activeTab={'Suprimentos'}
        />

        {/* Conteúdo principal */}
        <div className="p-6 w-[85%] mx-auto space-y-6">
          <h3 className="text-lg font-semibold text-[#5a0d0d] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5"/> Cadastro de Fornecedores
          </h3>

          {/* Formulário de cadastro */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <input
              type="text"
              name="cnpj"
              value={form.cnpj}
              onChange={handleInputChange}
              placeholder="CNPJ"
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleInputChange}
              placeholder="Nome do Fornecedor"
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              name="categoria"
              value={form.categoria}
              onChange={handleInputChange}
              placeholder="Categoria"
              className="p-2 border rounded"
              required
            />
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleInputChange}
              className="p-2 border rounded"
              required
            >
              <option value="">Material ou Serviço</option>
              <option value="Material">Material</option>
              <option value="Serviço">Serviço</option>
            </select>
            <input
              type="text"
              name="local"
              value={form.local}
              onChange={handleInputChange}
              placeholder="Local"
              className="p-2 border rounded"
              required
            />
            <button
              type="submit"
              className="sm:col-span-2 lg:col-span-1 bg-[#5a0d0d] text-white rounded p-2 hover:bg-[#7a1a1a]"
            >
              Cadastrar
            </button>
          </form>

          {/* Tabela de fornecedores */}
          <div className="overflow-x-auto border rounded-lg shadow">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">CNPJ</th>
                  <th className="px-4 py-2 text-left">Nome do Fornecedor</th>
                  <th className="px-4 py-2 text-left">Categoria</th>
                  <th className="px-4 py-2 text-left">Material ou Serviço</th>
                  <th className="px-4 py-2 text-left">Local</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-100`}>
                    <td className="px-4 py-2">{f.cnpj}</td>
                    <td className="px-4 py-2">{f.nome}</td>
                    <td className="px-4 py-2">{f.categoria}</td>
                    <td className="px-4 py-2">{f.tipo}</td>
                    <td className="px-4 py-2">{f.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

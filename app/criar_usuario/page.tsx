'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/superbase';

export default function CriarUsuarioPage() {
  const [token, setToken] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState('');

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao obter sessão:', error.message);
      } else {
        setToken(data.session?.access_token ?? null);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setToken(session?.access_token ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const criarUsuario = async () => {
    try {
      const res = await fetch('/api/criar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          senha,
          nome,
          empresa,
          cargo,
          nivelAcesso,
        }),
      });

      const data = await res.json();
      console.log('Resposta da API:', data);

      if (res.ok) {
        alert('Usuário criado com sucesso!');
        setEmail('');
        setSenha('');
        setNome('');
        setEmpresa('');
        setCargo('');
        setNivelAcesso('');
      } else {
        alert('Erro ao criar usuário: ' + (data.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 500 }}>
      <h1>Criar Novo Usuário</h1>

      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <label>Senha:</label>
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <label>Nome:</label>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <label>Empresa:</label>
      <input
        type="text"
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <label>Cargo:</label>
      <input
        type="text"
        value={cargo}
        onChange={(e) => setCargo(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <label>Nível de Acesso:</label>
      <input
        type="text"
        value={nivelAcesso}
        onChange={(e) => setNivelAcesso(e.target.value)}
        placeholder="ex: admin, colaborador, etc."
        style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
      />

      <button
        onClick={criarUsuario}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Criar Usuário
      </button>
    </div>
  );
}

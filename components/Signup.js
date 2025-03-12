'use client'
// components/Signup.js
import { useState } from 'react';
import { supabase } from '../lib/superbase';

const allowedEmails = [
  'compras@12tec.com.br',
  'levy@12tec.com.br',
  'email3@exemplo.com',
];

const predefinedPassword = 'jp12tec';  // Senha fixa para todos os usuários

const Signup = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allowedEmails.includes(email)) {
      setError('Este e-mail não está autorizado para criar uma conta.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Cria o usuário com o e-mail e a senha pré-definida
      const { user, error: signupError } = await supabase.auth.signUp(
        {
          email,
          password: predefinedPassword,  // Usando a senha fixa
        }
      );

      if (signupError) throw signupError;

      setSuccess(true);
      console.log(`Conta criada com sucesso para o usuário ${email} com a senha: ${predefinedPassword}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Criar Conta</h2>
      {success ? (
        <div className="text-green-500 mb-4">
          Conta criada com sucesso! A senha foi definida como "jp12tec".
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 border border-gray-300 rounded-lg mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded-lg"
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Cadastrar'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Signup;

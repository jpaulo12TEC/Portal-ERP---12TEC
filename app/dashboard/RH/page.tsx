import React from 'react';
import Link from 'next/link';

const RHPage: React.FC = () => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#003366', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1>Bem-vindo à Página do RH</h1>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
        {/* Left Column: Aniversariantes */}
        <div style={{ width: '48%', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f4f4f4' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Aniversariantes</div>
          <ul>
            <li>01/03 - João Silva</li>
            <li>02/03 - Maria Oliveira</li>
            <li>03/03 - Carlos Souza</li>
            {/* Adicionar mais aniversariantes aqui */}
          </ul>
        </div>

        {/* Right Column: Avisos */}
        <div style={{ width: '48%', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#e9f7fe' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Avisos</div>
          <ul>
            <li>Demissão de Junior</li>
            <li>Solicitação de documento</li>
            <li>Folha de ponto irá fechar 17h</li>
            {/* Adicionar mais avisos aqui */}
          </ul>
        </div>
      </div>

      {/* Navigation Buttons Section */}
      <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '20px' }}>
        <Link href="/funcionarios">
          <button style={buttonStyle}>FUNCIONÁRIOS</button>
        </Link>
        <Link href="/admissao">
          <button style={buttonStyle}>ADMISSÃO</button>
        </Link>
        <Link href="/demissao">
          <button style={buttonStyle}>DEMISSÃO</button>
        </Link>
        <Link href="/contracheques">
          <button style={buttonStyle}>CONTRACHEQUES</button>
        </Link>
        <Link href="/folhas_de_ponto">
          <button style={buttonStyle}>FOLHAS DE PONTO</button>
        </Link>
        <Link href="/documentacao_geral">
          <button style={buttonStyle}>DOCUMENTAÇÃO GERAL</button>
        </Link>
        <Link href="/enviar_documento">
          <button style={buttonStyle}>ENVIAR DOCUMENTO</button>
        </Link>
        <Link href="/solicitar_documento">
          <button style={buttonStyle}>SOLICITAR DOCUMENTO</button>
        </Link>
        <Link href="/treinamentos">
          <button style={buttonStyle}>TREINAMENTOS</button>
        </Link>
        <Link href="/asos">
          <button style={buttonStyle}>ASO'S</button>
        </Link>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#003366',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

export default RHPage;

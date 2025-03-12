import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  className?: string; // className para customizar
  disabled?: boolean; // Adicionando a propriedade disabled
  variant?: string; // Aqui estamos adicionando a propriedade variant
};

const Button = ({ children, onClick, className, disabled }: ButtonProps) => {
  return (
    <button
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} // Estilo para botão desabilitado
      onClick={disabled ? undefined : onClick} // Desabilita o clique se disabled for true
      disabled={disabled}
      style={{
        padding: '10px 20px', // Ajustando o padding
        backgroundColor: '#6c757d', // Cor cinza
        color: '#fff',
        border: 'none',
        borderRadius: '5px', // Bordas arredondadas leves
        cursor: 'pointer',
        fontSize: '12px', // Ajustando o tamanho da fonte
        fontWeight: '600', // Ajustando o peso da fonte
        letterSpacing: '1px',
        textTransform: 'uppercase',
        transition: 'all 0.3s ease-in-out', // Transição suave
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Sombra mais suave
        width: 'auto',
        maxWidth: '250px', // Evitar que o botão fique largo demais
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#5a6268'; // Hover para um tom de cinza mais escuro
        e.currentTarget.style.transform = 'scale(1.05)'; // Aumento suave ao passar o mouse
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#6c757d'; // Retorna ao tom de cinza
        e.currentTarget.style.transform = 'scale(1)'; // Retorna ao tamanho original
      }}
    >
      {children}
    </button>
  );
};



export default Button;

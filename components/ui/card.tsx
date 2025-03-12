import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => {
  return <div className={`p-0 ${className}`}>{children}</div>;
};

export const CardContent = ({
  children,
  className,
  style, // Adicionando o estilo aqui
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties; // Definindo o tipo de style
}) => {
  return (
    <div className={`p-4 ${className}`} style={style}>
      {children}
    </div>
  );
};

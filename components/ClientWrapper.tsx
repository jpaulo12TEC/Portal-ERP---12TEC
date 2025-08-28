'use client';

import { useState, useEffect } from 'react';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && window.innerWidth <= 1440) {
        setScale(0.85);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="w-full min-h-screen flex justify-center"
      style={{
        overflow: 'auto', // garante que nada seja cortado
      }}
    >
      <div
        className="w-full max-w-[1440px]"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center', // escala igual ao zoom do navegador
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

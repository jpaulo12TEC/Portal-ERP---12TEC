'use client';
import './globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserContext';
import SessionWrapper from '@/components/SessionWrapper';
import { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Sua aplicação',
  description: 'Descrição aqui',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && window.innerWidth <= 1440) {
        setScale(0.85);
      } else {
        setScale(1);
      }
    };

    handleResize(); // verifica no load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <html lang="pt-BR">
      <body>
        <UserProvider>
          <SessionWrapper>
            <div
              className="w-full min-h-screen"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {children}
            </div>
          </SessionWrapper>
        </UserProvider>
      </body>
    </html>
  );
}

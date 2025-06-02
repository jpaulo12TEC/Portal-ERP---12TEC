import './globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserContext';
import SessionWrapper from '@/components/SessionWrapper';

export const metadata: Metadata = {
  title: 'Sua aplicação',
  description: 'Descrição aqui',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <UserProvider>
          <SessionWrapper>
            {/* Aqui o children já será exibido depois que a sessão for carregada */}
            {children}
          </SessionWrapper>
        </UserProvider>
      </body>
    </html>
  );
}

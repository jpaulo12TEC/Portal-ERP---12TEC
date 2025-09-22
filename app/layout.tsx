import './globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserContext';
import SessionWrapper from '@/components/SessionWrapper';
import ClientWrapper from '@/components/ClientWrapper'; // <-- novo

export const metadata: Metadata = {
  title: 'Portal 12 TEC',
  description: 'Portal coorporativo da 12 TEC Engenharia',
   icons: {
    icon: "/12TEC.ico",      // favicon principal
    shortcut: "/12TEC.ico",  // favicon para navegadores que usam shortcut
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <UserProvider>
          <SessionWrapper>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </SessionWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
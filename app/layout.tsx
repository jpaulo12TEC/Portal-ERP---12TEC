import './globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserContext';
import SessionWrapper from '@/components/SessionWrapper';
import ClientWrapper from '@/components/ClientWrapper'; // <-- novo

export const metadata: Metadata = {
  title: 'Portal 12 TEC',
  description: 'Portal coorporativo da 12 TEC Engenharia',
    icons: {
    icon: [
      { url: '/favicon.ico?v=3', type: 'image/x-icon' },   // principal
      { url: '/12TEC.ico?v=3', type: 'image/x-icon' }      // alternativo (opcional)
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/favicon.ico?v=3',
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
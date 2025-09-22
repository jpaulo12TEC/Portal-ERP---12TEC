// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserContext';
import SessionWrapper from '@/components/SessionWrapper';
import ClientWrapper from '@/components/ClientWrapper';

// Função para quebrar cache da CDN e navegador
const getFaviconUrl = (fileName: string) => `${fileName}?v=${Date.now()}`;

export const metadata: Metadata = {
  title: 'Portal 12 TEC',
  description: 'Portal corporativo da 12 TEC Engenharia',
  icons: {
    icon: [
      { url: getFaviconUrl('/favicon.ico'), type: 'image/x-icon' },
      { url: getFaviconUrl('/12TEC.ico'), type: 'image/x-icon' }, // alternativo (opcional)
    ],
    shortcut: getFaviconUrl('/favicon.ico'),
    apple: getFaviconUrl('/favicon.ico'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const faviconUrl = getFaviconUrl('/favicon.ico');
  const appleIconUrl = getFaviconUrl('/favicon.ico');

  return (
    <html lang="pt-BR">
      <head>
        {/* Serve favicon como arquivo estático, evitando .rsc */}
        <link rel="icon" href={faviconUrl} type="image/x-icon" />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={appleIconUrl} />
      </head>
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

'use client';

import { useEffect } from 'react';

export default function ClientZoomWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Aplica zoom global
    document.body.style.zoom = '85%';

    // Opcional: remove zoom ao desmontar
    return () => {
      document.body.style.zoom = '100%';
    };
  }, []);

  return <>{children}</>;
}

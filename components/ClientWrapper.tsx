'use client';

import { useState, useEffect } from 'react';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && window.innerWidth <= 1440) {
        setZoom(0.85);
      } else {
        setZoom(1);
      }
    };

    handleResize(); // executa no load
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="w-full min-h-screen flex justify-center"
      style={{
        zoom,
      }}
    >
      <div className="w-full max-w-[1440px]">
        {children}
      </div>
    </div>
  );
}

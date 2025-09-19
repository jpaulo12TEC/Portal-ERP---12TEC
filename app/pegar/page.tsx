'use client';

import { useEffect, useState } from 'react';

interface SharePointData {
  site: any;
  drive: any;
  error?: string;
}

export default function SharePointPage() {
  const [data, setData] = useState<SharePointData | null>(null);

  useEffect(() => {
    fetch('/api/sharepoint')
      .then(res => res.json())
      .then(setData)
      .catch(err => setData({ site: null, drive: null, error: err.message }));
  }, []);

  if (!data) return <div>Carregando...</div>;
 if (data.error) {
  return (
    <div>
      <h2>Erro ao acessar SharePoint</h2>
      <pre>{JSON.stringify(data.error, null, 2)}</pre>
    </div>
  );
}


  return (
    <div>
      <h1>Informações do SharePoint</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

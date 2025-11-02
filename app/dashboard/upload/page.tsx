'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/superbase';

type DocumentoPreview = {
  id: number;
  funcionarioNome: string;
  funcionarioCpf: string;
  nome_arquivo_antigo: string;
  nome_arquivo_novo: string;
};

export default function PreviewAtualizarUrls() {
  const [docsPreview, setDocsPreview] = useState<DocumentoPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [fetchLog, setFetchLog] = useState<string[]>([]);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setFetchLog([]);

      try {
        // busca todos os comprovantes
        const { data: docs, error: docsError } = await supabase
          .from('comprovantesfuncionarios')
          .select('id, nome_arquivo, funcionario_id');

        if (docsError) throw docsError;
        if (!docs || docs.length === 0) {
          setFetchLog(prev => [...prev, 'Nenhum comprovante encontrado']);
          return;
        }

        const preview: DocumentoPreview[] = [];

        for (const doc of docs) {
          try {
            // busca dados do funcionário
            const { data: func, error: funcError } = await supabase
              .from('funcionarios')
              .select('nome_completo, cpf')
              .eq('id', doc.funcionario_id)
              .single();

            if (funcError || !func) {
              setFetchLog(prev => [...prev, `Funcionário não encontrado para doc ${doc.id}`]);
              continue;
            }

            const limparNomeParaUrl = (nome: string) =>
              nome
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/ /g, '_')
                .replace(/[^a-zA-Z0-9_\-]/g, '');

            const regex = /Documenta%C3%A7%C3%A3o%20de%20Funcion%C3%A1rios\/(.*?)\//;
            const match = doc.nome_arquivo.match(regex);
            const oldFolder = match ? match[1] : '';

            const newFolderName = `${limparNomeParaUrl(func.nome_completo)}-${func.cpf}`;
            const novaUrl = doc.nome_arquivo.replace(oldFolder, encodeURIComponent(newFolderName));

            preview.push({
              id: doc.id,
              funcionarioNome: func.nome_completo,
              funcionarioCpf: func.cpf,
              nome_arquivo_antigo: doc.nome_arquivo,
              nome_arquivo_novo: novaUrl,
            });

            setFetchLog(prev => [
              ...prev,
              `Doc ${doc.id} - ${func.nome_completo}`,
              `URL antiga: ${doc.nome_arquivo}`,
              `URL nova:   ${novaUrl}`,
            ]);
          } catch (innerErr: any) {
            setFetchLog(prev => [...prev, `Erro ao processar doc ${doc.id}: ${innerErr.message}`]);
          }
        }

        setDocsPreview(preview);
      } catch (err: any) {
        setFetchLog(prev => [...prev, `Erro geral: ${err.message}`]);
        console.error('Erro ao gerar preview:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateLog([]);

    for (const doc of docsPreview) {
      const { error: updateError } = await supabase
        .from('comprovantesfuncionarios')
        .update({ nome_arquivo: doc.nome_arquivo_novo })
        .eq('id', doc.id);

      if (updateError) {
        setUpdateLog(prev => [...prev, `Erro ao atualizar doc ${doc.id}: ${updateError.message}`]);
      } else {
        setUpdateLog(prev => [...prev, `Atualizado doc ${doc.id}`]);
      }
    }

    setUpdating(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Preview de Atualização de URLs</h1>

      {loading && <p>Carregando comprovantes...</p>}

      {fetchLog.length > 0 && (
        <div className="mb-4 p-2 bg-gray-100 rounded h-48 overflow-auto">
          {fetchLog.map((log, i) => (
            <p key={i} className="text-sm">{log}</p>
          ))}
        </div>
      )}

      {docsPreview.length > 0 && (
        <>
          <table className="w-full border border-gray-300 rounded overflow-hidden mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Nome do Funcionário</th>
                <th className="border px-2 py-1">CPF</th>
                <th className="border px-2 py-1">URL Antiga</th>
                <th className="border px-2 py-1">URL Nova</th>
              </tr>
            </thead>
            <tbody>
              {docsPreview.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{doc.funcionarioNome}</td>
                  <td className="border px-2 py-1">{doc.funcionarioCpf}</td>
                  <td className="border px-2 py-1 break-all">{doc.nome_arquivo_antigo}</td>
                  <td className="border px-2 py-1 break-all">{doc.nome_arquivo_novo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? 'Atualizando...' : 'Confirmar Atualização no Supabase'}
          </button>

          {updateLog.length > 0 && (
            <div className="mt-4 bg-gray-100 p-4 rounded h-64 overflow-auto">
              {updateLog.map((l, i) => (
                <p key={i} className="text-sm">{l}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

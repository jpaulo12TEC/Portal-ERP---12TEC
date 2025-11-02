// utils/limparString.ts
export function limparString(str: string) {
  return str
    .normalize('NFD')                // separa acentos
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9]/g, '_'); // substitui qualquer coisa que não seja letra ou número por _
}
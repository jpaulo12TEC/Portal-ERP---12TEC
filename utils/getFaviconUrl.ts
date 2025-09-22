// utils/getFaviconUrl.ts
export function getFaviconUrl(fileName: string) {
  return `${fileName}?v=${Date.now()}`; // timestamp quebra cache
}

declare module "numero-por-extenso" {
  export function escreverExtenso(
    valor: number,
    options?: { moeda?: boolean }
  ): string;
}
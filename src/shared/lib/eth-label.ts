/**
 * Exibe o valor decimal exatamente como trafega na API, sem arredondar (ex.: "1.19 ETH").
 * Fica separado de `decimal.ts` para que telas que só exibem valores não carreguem o decimal.js.
 */
export function ethLabel(value: string | { toString(): string }) {
  return `${typeof value === 'string' ? value : value.toString()} ETH`;
}

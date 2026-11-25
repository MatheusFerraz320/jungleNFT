import Decimal from 'decimal.js';
import { EthAmountSchema } from '@/shared/contracts';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function parseEth(value: string) {
  return new Decimal(EthAmountSchema.parse(value));
}

export function sumEth(values: readonly string[]) {
  return values.reduce<Decimal>((total, value) => total.plus(parseEth(value)), new Decimal(0));
}

export function multiplyEth(value: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('A quantidade deve ser um inteiro positivo.');
  }

  return parseEth(value).times(quantity);
}

export function formatEth(value: string | Decimal, maximumFractionDigits = 4) {
  const decimal = typeof value === 'string' ? parseEth(value) : value;

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(decimal.toNumber());
}

/** Exibe o valor decimal exatamente como trafega na API, sem arredondar (ex.: "1.19 ETH"). */
export function ethLabel(value: string | Decimal) {
  return `${typeof value === 'string' ? value : value.toString()} ETH`;
}

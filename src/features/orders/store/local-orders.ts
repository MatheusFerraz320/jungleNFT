import type { CartLine } from '@/features/cart';

/**
 * Pedidos locais (etapa visual). O recibo guarda um snapshot imutável dos itens e totais;
 * será substituído pelo contrato REST `/orders` na etapa de integração.
 */
export interface LocalOrder {
  id: string;
  createdAt: string;
  transactionHash: string;
  walletLabel: string;
  network: string;
  lines: Pick<CartLine, 'nftId' | 'name' | 'tokenId' | 'imageUrl' | 'priceEth' | 'quantity'>[];
  subtotalEth: string;
  discountEth: string;
  feeEth: string;
  totalEth: string;
}

const STORAGE_KEY = 'kurio.orders.v1';

function readAll(): LocalOrder[] {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as LocalOrder[];
  } catch {
    return [];
  }
}

export function saveOrder(order: LocalOrder) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readAll()]));
  } catch {
    // sem persistência: o recibo ainda abre na mesma sessão via navegação.
  }
}

export function getOrder(id: string) {
  return readAll().find((order) => order.id === id) ?? null;
}

export function createOrderId() {
  return `ord-${Date.now().toString(36)}`;
}

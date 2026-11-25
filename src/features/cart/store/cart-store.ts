import { useSyncExternalStore } from 'react';
import Decimal from 'decimal.js';
import type { NftSummary } from '@/shared/contracts';
import { multiplyEth, parseEth } from '@/shared/lib/decimal';

/**
 * Carrinho local (etapa visual). A interface consome apenas `useCart()`; quando o contrato REST
 * `/cart` for ligado, somente este módulo é substituído por hooks do TanStack Query.
 */
export interface CartLine {
  nftId: string;
  name: string;
  tokenId: string;
  imageUrl: string;
  collectionName: string;
  priceEth: string;
  totalEditions: number;
  maxQuantity: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
}

export const NETWORK_FEE_ETH = '0.016';

const STORAGE_KEY = 'kurio.cart.v1';
const listeners = new Set<() => void>();
let state: CartState = read();

function read(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartState;
  } catch {
    // armazenamento indisponível: segue com carrinho vazio.
  }
  return { lines: [], couponCode: null };
}

function commit(next: CartState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignora falha de persistência.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addToCart(nft: NftSummary, quantity = 1) {
  const max = Math.max(1, nft.availableEditions);
  const existing = state.lines.find((line) => line.nftId === nft.id);

  if (existing) {
    commit({
      ...state,
      lines: state.lines.map((line) =>
        line.nftId === nft.id
          ? { ...line, quantity: Math.min(line.maxQuantity, line.quantity + quantity) }
          : line,
      ),
    });
    return;
  }

  commit({
    ...state,
    lines: [
      ...state.lines,
      {
        nftId: nft.id,
        name: nft.name,
        tokenId: nft.tokenId,
        imageUrl: nft.imageUrl,
        collectionName: nft.collectionName,
        priceEth: nft.priceEth,
        totalEditions: nft.totalEditions,
        maxQuantity: max,
        quantity: Math.min(max, quantity),
      },
    ],
  });
}

export function setCartQuantity(nftId: string, quantity: number) {
  commit({
    ...state,
    lines: state.lines.map((line) =>
      line.nftId === nftId
        ? { ...line, quantity: Math.max(1, Math.min(line.maxQuantity, quantity)) }
        : line,
    ),
  });
}

export function removeFromCart(nftId: string) {
  commit({ ...state, lines: state.lines.filter((line) => line.nftId !== nftId) });
}

export function clearCart() {
  commit({ lines: [], couponCode: null });
}

export function setCoupon(code: string | null) {
  commit({ ...state, couponCode: code });
}

const COUPON_PERCENTAGE: Record<string, number> = { JUNGLE10: 10 };

export function couponPercentage(code: string | null) {
  return code ? (COUPON_PERCENTAGE[code.toUpperCase()] ?? null) : null;
}

export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );

  const subtotal = snapshot.lines.reduce<Decimal>(
    (total, line) => total.plus(multiplyEth(line.priceEth, line.quantity)),
    new Decimal(0),
  );
  const percentage = couponPercentage(snapshot.couponCode);
  const discount = percentage ? subtotal.times(percentage).div(100) : new Decimal(0);
  const fee = snapshot.lines.length ? parseEth(NETWORK_FEE_ETH) : new Decimal(0);
  const total = subtotal.minus(discount).plus(fee);

  return {
    lines: snapshot.lines,
    count: snapshot.lines.reduce((sum, line) => sum + line.quantity, 0),
    couponCode: snapshot.couponCode,
    subtotal,
    discount,
    fee,
    total,
  };
}

export type CartView = ReturnType<typeof useCart>;

import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth';
import { getErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/query-keys';
import type { Cart, Network, Quote } from '@/shared/contracts';
import { addCartItem, createQuote, getCart, removeCartItem, updateCartItem } from '../api/cart-api';
import { useCoupon } from '../store/coupon-store';

/** Escopo do cache: cada usuário (ou visitante) tem o seu carrinho. */
function useCartScope() {
  return useCurrentUser()?.id ?? 'guest';
}

export function cartQueryOptions(scope: string) {
  return queryOptions({
    queryKey: queryKeys.cart(scope),
    queryFn: ({ signal }) => getCart(signal),
  });
}

export function useCartQuery() {
  return useQuery(cartQueryOptions(useCartScope()));
}

export function useCartCount() {
  return useCartQuery().data?.itemCount ?? 0;
}

export function quoteQueryOptions(
  cart: Cart | undefined,
  network: Network,
  couponCode: string | null,
) {
  return queryOptions({
    queryKey: [...queryKeys.quote(cart?.id ?? 'none'), cart?.version, network, couponCode] as const,
    queryFn: ({ signal }) =>
      createQuote({ cartId: cart?.id ?? '', network, couponCode: couponCode ?? undefined }, signal),
    enabled: Boolean(cart && cart.items.length > 0),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 0,
  });
}

export interface CartLine {
  itemId: string;
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

/**
 * Visão do carrinho para a interface: itens da API e totais da **cotação** (subtotal, desconto,
 * taxa e total vêm da resposta da API, nunca recalculados no cliente).
 */
export function useCartView(network: Network = 'ethereum') {
  const cartQuery = useCartQuery();
  const coupon = useCoupon();
  const cart = cartQuery.data;
  const quoteQuery = useQuery(quoteQueryOptions(cart, network, coupon));
  const quote = quoteQuery.data;

  const lines: CartLine[] = (cart?.items ?? []).map((item) => ({
    itemId: item.id,
    nftId: item.nftId,
    name: item.nft.name,
    tokenId: item.nft.tokenId,
    imageUrl: item.nft.imageUrl,
    collectionName: item.nft.collectionName,
    priceEth: item.unitPriceEth,
    totalEditions: item.nft.totalEditions,
    maxQuantity: item.availableEditions,
    quantity: item.quantity,
  }));

  return {
    cart,
    lines,
    count: cart?.itemCount ?? 0,
    couponCode: coupon,
    quote: quote as Quote | undefined,
    quoteError: quoteQuery.error,
    isPending: cartQuery.isPending,
    isError: cartQuery.isError,
    error: cartQuery.error,
    isQuoting: quoteQuery.isFetching,
    subtotal: new Decimal(quote?.subtotalEth ?? cart?.subtotalEth ?? 0),
    discount: new Decimal(quote?.discountEth ?? 0),
    fee: new Decimal(quote?.networkFeeEth ?? 0),
    total: new Decimal(quote?.totalEth ?? cart?.subtotalEth ?? 0),
    refetch: () => cartQuery.refetch(),
  };
}

export type CartView = ReturnType<typeof useCartView>;

function useCartMutationCache() {
  const queryClient = useQueryClient();
  const scope = useCartScope();
  return {
    queryClient,
    store: (cart: Cart) => queryClient.setQueryData(queryKeys.cart(scope), cart),
    refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart(scope) }),
  };
}

export function useAddToCart() {
  const { store, refresh } = useCartMutationCache();

  return useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) =>
      addCartItem(nftId, quantity),
    onSuccess: store,
    onError: (error) => {
      toast.error(getErrorMessage(error));
      void refresh();
    },
  });
}

export function useUpdateCartItem() {
  const { store, refresh } = useCartMutationCache();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: store,
    onError: (error) => {
      toast.error(getErrorMessage(error));
      void refresh();
    },
  });
}

export function useRemoveCartItem() {
  const { store, refresh } = useCartMutationCache();

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: store,
    onError: (error) => {
      toast.error(getErrorMessage(error));
      void refresh();
    },
  });
}

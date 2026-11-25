import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/query-keys';
import type { Cart, NftDetail, NftListResponse, NftSummary, Order } from '@/shared/contracts';

const CART_KEY = [...queryKeys.all, 'cart'] as const;
const QUOTE_KEY = [...queryKeys.all, 'quote'] as const;
const CHECKOUT_QUOTE_KEY = ['checkout-quote'] as const;

/** Mantém catálogo, detalhe e carrinho coerentes com o `nft.updated` recebido. */
export function applyNftUpdate(queryClient: QueryClient, nft: NftSummary) {
  queryClient.setQueriesData<NftListResponse>(
    { queryKey: [...queryKeys.nfts.all, 'list'] },
    (current) =>
      current && {
        ...current,
        items: current.items.map((item) =>
          item.id === nft.id && nft.version > item.version ? nft : item,
        ),
      },
  );

  queryClient.setQueryData<NftDetail>(queryKeys.nfts.detail(nft.id), (current) =>
    current && nft.version > current.version ? { ...current, ...nft } : current,
  );

  // Consultas em andamento podem trazer uma resposta anterior ao evento (ou ainda não ter cache para
  // receber a atualização acima). `invalidateQueries` NÃO refaz uma busca inicial em voo (reaproveita a
  // mesma promessa), então cancelamos e refazemos explicitamente para nunca terminar com o dado antigo.
  const inFlight = queryClient
    .getQueryCache()
    .findAll({ queryKey: queryKeys.nfts.all, fetchStatus: 'fetching' })
    .map((query) => query.queryHash);
  if (inFlight.length > 0) {
    void queryClient
      .cancelQueries({
        queryKey: queryKeys.nfts.all,
        predicate: (query) => inFlight.includes(query.queryHash),
      })
      .then(() =>
        queryClient.refetchQueries({
          queryKey: queryKeys.nfts.all,
          type: 'active',
          predicate: (query) => inFlight.includes(query.queryHash),
        }),
      );
  }

  // Carrinho aberto: informa a mudança e atualiza o resumo (cotação) a partir da API.
  for (const [, cart] of queryClient.getQueriesData<Cart>({ queryKey: CART_KEY })) {
    const item = cart?.items.find((entry) => entry.nftId === nft.id);
    if (!item) continue;

    if (item.unitPriceEth !== nft.priceEth) {
      toast.info(`O preço de ${nft.name} mudou de ${item.unitPriceEth} para ${nft.priceEth} ETH.`);
    } else if (item.availableEditions !== nft.availableEditions) {
      toast.info(
        `A disponibilidade de ${nft.name} mudou: ${nft.availableEditions} edições restantes.`,
      );
    }
    void queryClient.invalidateQueries({ queryKey: CART_KEY });
    void queryClient.invalidateQueries({ queryKey: QUOTE_KEY });
    void queryClient.invalidateQueries({ queryKey: CHECKOUT_QUOTE_KEY });
    break;
  }
}

export function applyOrderUpdate(queryClient: QueryClient, order: Order) {
  queryClient.setQueryData<Order>(queryKeys.order(order.id), (current) =>
    !current || order.version > current.version ? order : current,
  );

  if (order.status === 'confirmed') {
    toast.success('Pagamento confirmado.');
  } else if (order.status === 'rejected') {
    toast.error('Pagamento recusado. Seus itens continuam no carrinho.');
  }
  if (order.status !== 'pending') {
    void queryClient.invalidateQueries({ queryKey: CART_KEY });
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.nfts.all, 'list'] });
  }
}

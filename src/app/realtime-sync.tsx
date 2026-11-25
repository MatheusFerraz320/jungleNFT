import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth';
import { queryKeys } from '@/shared/api/query-keys';
import {
  type Cart,
  type NftDetail,
  type NftListResponse,
  type NftSummary,
  type Order,
  type RealtimeEvent,
} from '@/shared/contracts';
import { createEventGuard } from '@/shared/lib/event-version';
import { useRealtimeEvents, useRealtimeReconnect } from '@/shared/realtime';

const CART_KEY = [...queryKeys.all, 'cart'] as const;
const QUOTE_KEY = [...queryKeys.all, 'quote'] as const;
const CHECKOUT_QUOTE_KEY = ['checkout-quote'] as const;

/** Mantém catálogo, detalhe e carrinho coerentes com o `nft.updated` recebido. */
function applyNftUpdate(queryClient: QueryClient, nft: NftSummary) {
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

  // Consultas em andamento podem trazer uma resposta anterior ao evento (ou nem ter cache ainda
  // para receber a atualização acima): refaz-as para nunca terminar com o dado mais antigo.
  void queryClient.invalidateQueries({
    queryKey: queryKeys.nfts.all,
    predicate: (query) => query.state.fetchStatus === 'fetching',
  });

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

function applyOrderUpdate(queryClient: QueryClient, order: Order) {
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

/**
 * Ponte Socket.IO → TanStack Query. Eventos duplicados ou antigos são descartados antes de
 * qualquer efeito; após reconexão os recursos ativos são reconciliados com a API REST.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient();
  const userId = useCurrentUser()?.id ?? null;
  const guard = useRef(createEventGuard());

  // Nova sessão: nenhum estado de versão da sessão anterior pode influenciar a atual.
  useEffect(() => {
    guard.current.reset();
  }, [userId]);

  useRealtimeEvents((event: RealtimeEvent) => {
    if (event.type === 'scene.ready' || !guard.current.accept(event.meta)) return;

    if (event.type === 'nft.updated') applyNftUpdate(queryClient, event.payload.nft);
    else applyOrderUpdate(queryClient, event.payload.order);
  });

  useRealtimeReconnect(() => {
    void queryClient.invalidateQueries({ refetchType: 'active' });
  });

  return null;
}

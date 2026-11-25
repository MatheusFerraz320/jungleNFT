import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useRef, useState } from 'react';
import { createQuote, useCartView } from '@/features/cart';
import { createOrder } from '@/features/orders/api/orders-api';
import { normalizeApiError } from '@/shared/api/errors';
import { queryKeys } from '@/shared/api/query-keys';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { CreateOrderRequest, Network, Quote, Wallet } from '@/shared/contracts';
import { ethLabel } from '@/shared/lib/decimal';
import { networkLabels } from '@/shared/lib/nft-labels';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: Network;
  wallet: Wallet;
  collector: { name: string; email: string };
  /** Total que o usuário viu ao abrir a revisão; qualquer mudança posterior exige reconfirmação. */
  reviewedTotal?: string;
}

const STALE_CODES = new Set(['PRICE_CHANGED', 'EDITION_SOLD_OUT', 'QUOTE_EXPIRED']);

const quoteProblems: Partial<Record<Quote['status'], string>> = {
  price_changed: 'O preço de um item mudou. Volte ao carrinho para revisar.',
  edition_sold_out: 'Uma das edições ficou indisponível. Volte ao carrinho para ajustar.',
  expired: 'A cotação expirou. Reabra a revisão para gerar uma nova.',
};

/**
 * Revisão final antes do envio. A cotação é refeita ao abrir (preço, disponibilidade, cupom e
 * taxas); qualquer mudança é exibida e exige nova confirmação. A mesma `Idempotency-Key` é
 * reutilizada em reenvios/timeouts da mesma cotação, nunca duplicando o pedido.
 */
export function ReviewDialog({
  open,
  onOpenChange,
  network,
  wallet,
  collector,
  reviewedTotal,
}: ReviewDialogProps) {
  const view = useCartView(network);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const keyRef = useRef<{ quoteId: string; key: string } | null>(null);
  const [changed, setChanged] = useState(false);
  const cartId = view.cart?.id ?? '';

  const quoteQuery = useQuery({
    queryKey: ['checkout-quote', cartId, view.cart?.version, network, view.couponCode],
    queryFn: ({ signal }) =>
      createQuote({ cartId, network, couponCode: view.couponCode ?? undefined }, signal),
    enabled: open && Boolean(cartId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const quote = quoteQuery.data;
  const totalsChanged = Boolean(quote && reviewedTotal && quote.totalEth !== reviewedTotal);

  const send = useMutation({
    mutationFn: (variables: { body: CreateOrderRequest; key: string }) =>
      createOrder(variables.body, variables.key),
    // Timeout/rede: repete com a MESMA chave; a API devolve o mesmo pedido.
    retry: (count, error) => {
      const api = normalizeApiError(error);
      return (
        count < 3 && (api.status === 504 || api.code === 'NETWORK_ERROR' || api.code === 'TIMEOUT')
      );
    },
    retryDelay: 800,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
      onOpenChange(false);
      void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } });
    },
    onError: (error) => {
      if (STALE_CODES.has(normalizeApiError(error).code)) {
        setChanged(true);
        void quoteQuery.refetch();
      }
    },
  });

  function submit() {
    if (!quote || send.isPending) return;

    // Nova cotação = nova tentativa = nova chave; a mesma cotação reaproveita a chave.
    if (keyRef.current?.quoteId !== quote.quoteId) {
      keyRef.current = { quoteId: quote.quoteId, key: crypto.randomUUID() };
    }
    setChanged(false);
    send.mutate({
      key: keyRef.current.key,
      body: {
        quoteId: quote.quoteId,
        cartId,
        walletId: wallet.id,
        network,
        collector,
        acceptTerms: true,
      },
    });
  }

  const problem = quote ? quoteProblems[quote.status] : undefined;
  const sendError = send.isError ? normalizeApiError(send.error) : null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !send.isPending && onOpenChange(next)}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby="review-description"
          className="bg-card border-b-primary fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-b-[10px] p-6 shadow-[0_0_20px_#0a060473] focus:outline-none"
        >
          <DialogPrimitive.Title className="text-xl leading-7 font-bold">
            Revisar pedido
          </DialogPrimitive.Title>
          <DialogPrimitive.Description
            id="review-description"
            className="text-muted-foreground mt-1 text-sm"
          >
            Confira os valores atualizados antes de enviar.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            aria-label="Fechar revisão"
            disabled={send.isPending}
            className="text-primary focus-visible:ring-ring absolute top-4 right-4 grid size-6 place-items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </DialogPrimitive.Close>

          <div aria-live="polite" className="mt-4 space-y-3">
            {changed || totalsChanged ? (
              <p
                role="status"
                className="border-primary text-primary rounded border px-3 py-2 text-sm"
              >
                Os valores mudaram desde a sua última revisão. Confira o novo total e confirme
                novamente.
              </p>
            ) : null}
            {problem ? (
              <p
                role="alert"
                className="border-destructive text-destructive rounded border px-3 py-2 text-sm"
              >
                {problem}
              </p>
            ) : null}
            {quoteQuery.isError ? (
              <p
                role="alert"
                className="border-destructive text-destructive rounded border px-3 py-2 text-sm"
              >
                {normalizeApiError(quoteQuery.error).fieldErrors?.[0]?.message ??
                  normalizeApiError(quoteQuery.error).message}
              </p>
            ) : null}
            {sendError && !STALE_CODES.has(sendError.code) ? (
              <p
                role="alert"
                className="border-destructive text-destructive rounded border px-3 py-2 text-sm"
              >
                {sendError.message} Você pode tentar novamente: o pedido não será duplicado.
              </p>
            ) : null}
          </div>

          {quoteQuery.isPending || !quote ? (
            <div role="status" aria-label="Atualizando cotação" className="mt-4 space-y-2">
              <Skeleton className="skeleton-shimmer h-10 w-full" />
              <Skeleton className="skeleton-shimmer h-24 w-full" />
            </div>
          ) : (
            <>
              <ul className="mt-4 flex flex-col gap-2">
                {quote.items.map((item) => {
                  const line = view.lines.find((entry) => entry.nftId === item.nftId);
                  return (
                    <li
                      key={item.nftId}
                      className="bg-background flex items-center gap-3 p-2 text-sm"
                    >
                      {line ? (
                        <img src={line.imageUrl} alt="" className="size-12 rounded object-cover" />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate font-bold">
                        {line?.name ?? item.nftId}
                      </span>
                      <span className="text-muted-foreground">
                        {item.quantity} × {item.unitPriceEth}
                      </span>
                      <span className="text-primary font-bold">{ethLabel(item.lineTotalEth)}</span>
                    </li>
                  );
                })}
              </ul>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{ethLabel(quote.subtotalEth)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Desconto{quote.couponCode ? ` (${quote.couponCode})` : ''}</dt>
                  <dd>(-) {quote.discountEth === '0' ? '00.00' : quote.discountEth}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Taxa de rede ({networkLabels[network]})</dt>
                  <dd>{ethLabel(quote.networkFeeEth)}</dd>
                </div>
                <div className="border-line flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{ethLabel(quote.totalEth)}</dd>
                </div>
                <div className="text-muted-foreground flex justify-between pt-1 text-xs">
                  <dt>Carteira</dt>
                  <dd>
                    {wallet.label} · {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                  </dd>
                </div>
              </dl>
            </>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            {problem ? (
              <Link
                to="/carrinho"
                onClick={() => onOpenChange(false)}
                className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-11 flex-1 items-center justify-center rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none"
              >
                Voltar ao carrinho
              </Link>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!quote || quote.status !== 'valid' || send.isPending}
                className="bg-primary text-primary-foreground focus-visible:ring-ring h-11 flex-1 rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
              >
                {send.isPending
                  ? 'Enviando pedido…'
                  : changed || totalsChanged
                    ? 'Confirmar novos valores'
                    : 'Enviar pedido'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={send.isPending}
              className="border-line focus-visible:ring-ring h-11 rounded border px-5 text-[15px] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
            >
              Voltar
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

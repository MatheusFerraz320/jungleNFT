import { Link, useNavigate } from '@tanstack/react-router';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useNftList } from '@/features/catalog';
import { Container } from '@/shared/components/layout/container';
import { MobileTopBar } from '@/shared/components/layout/mobile-top-bar';
import { NftRail } from '@/shared/components/nft/nft-rail';
import { cn } from '@/shared/lib/cn';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';
import { getErrorMessage, normalizeApiError } from '@/shared/api/errors';
import { ErrorState } from '@/shared/components/feedback/empty-error-states';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { createQuote } from '../api/cart-api';
import {
  useCartView,
  useRemoveCartItem,
  useUpdateCartItem,
  type CartLine,
  type CartView,
} from '../hooks/use-cart';
import { setCoupon } from '../store/coupon-store';

const pillClass =
  'bg-primary text-primary-foreground focus-visible:ring-ring grid h-[26px] w-5 place-items-center rounded-full border border-[#3a2218] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60 max-sm:size-6 max-sm:border-[#3a2218] max-sm:bg-[#2a1a14] max-sm:text-foreground';

function QuantityControl({ line }: { line: CartLine }) {
  const update = useUpdateCartItem();

  return (
    <div
      className="flex items-center gap-2.5"
      role="group"
      aria-label={`Quantidade de ${line.name}`}
    >
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${line.name}`}
        disabled={line.quantity <= 1 || update.isPending}
        onClick={() => update.mutate({ itemId: line.itemId, quantity: line.quantity - 1 })}
        className={pillClass}
      >
        <Minus aria-hidden="true" className="size-3.5" strokeWidth={3} />
      </button>
      <span aria-live="polite" className="w-4 text-center text-base">
        {line.quantity}
      </span>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${line.name}`}
        disabled={line.quantity >= line.maxQuantity || update.isPending}
        onClick={() => update.mutate({ itemId: line.itemId, quantity: line.quantity + 1 })}
        className={pillClass}
      >
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}

function RemoveButton({ line, className }: { line: CartLine; className?: string }) {
  const remove = useRemoveCartItem();

  return (
    <button
      type="button"
      aria-label={`Remover ${line.name} do carrinho`}
      disabled={remove.isPending}
      onClick={() => remove.mutate(line.itemId)}
      className={cn(
        'focus-visible:ring-ring hover:text-primary rounded-sm text-[#a48b6e] transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <Trash2 aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
    </button>
  );
}

const tableCols =
  'grid grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))_40px] items-center lg:grid-cols-[311px_139px_136px_151px_minmax(0,1fr)]';

function CartTable({ lines }: { lines: CartLine[] }) {
  return (
    <div role="table" aria-label="Itens do carrinho" className="max-sm:hidden">
      <div role="rowgroup">
        <div
          role="row"
          className={cn(tableCols, 'border-line border-b pb-2.5 text-[15px] leading-[18px]')}
        >
          <span role="columnheader" className="font-bold">
            NFTs
          </span>
          <span role="columnheader" className="font-medium">
            Preço
          </span>
          <span role="columnheader" className="font-medium">
            Edições
          </span>
          <span role="columnheader" className="font-medium">
            Total
          </span>
          <span role="columnheader" className="sr-only">
            Ações
          </span>
        </div>
      </div>
      <div role="rowgroup" className="mt-[13px] flex flex-col gap-3">
        {lines.map((line) => (
          <div
            key={line.itemId}
            role="row"
            className={cn(tableCols, 'bg-card h-[70px] rounded-lg')}
          >
            <div role="cell" className="flex items-center gap-4">
              <img
                src={line.imageUrl}
                alt=""
                width={140}
                height={140}
                className="size-[70px] rounded-l-lg object-cover"
              />
              <div>
                <Link
                  to="/nft/$nftId"
                  params={{ nftId: line.nftId }}
                  className="hover:text-primary text-base leading-[22px] font-bold"
                >
                  {line.name}
                </Link>
                <p className="text-sm leading-[18px] text-[#b39463]">
                  ID do token: #{line.tokenId}
                </p>
              </div>
            </div>
            <span role="cell" className="text-primary text-base font-bold">
              {ethLabel(line.priceEth)}
            </span>
            <div role="cell">
              <QuantityControl line={line} />
            </div>
            <span role="cell" className="text-primary text-base font-bold">
              {ethLabel(multiplyEth(line.priceEth, line.quantity))}
            </span>
            <div role="cell">
              <RemoveButton line={line} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartCards({ lines }: { lines: CartLine[] }) {
  return (
    <ul className="flex flex-col gap-5 px-7 pb-[372px] sm:hidden">
      {lines.map((line) => (
        <li
          key={line.nftId}
          className="bg-card relative flex h-[100px] overflow-hidden rounded-[16px]"
        >
          <img
            src={line.imageUrl}
            alt=""
            width={200}
            height={200}
            className="size-[100px] shrink-0 object-cover"
          />
          <div className="relative min-w-0 flex-1 pl-[9px]">
            <p className="mt-2.5 truncate text-base leading-[22px] font-bold">{line.name}</p>
            <p className="text-muted-foreground text-sm leading-5">
              Edição: 1/{line.totalEditions}
            </p>
            <p className="text-primary absolute bottom-[10px] text-xl leading-7 font-bold">
              {ethLabel(line.priceEth)}
            </p>
            <div className="absolute top-[39px] right-3">
              <QuantityControl line={line} />
            </div>
            <RemoveButton line={line} className="absolute right-3 bottom-2 [&_svg]:size-5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PromoForm({ mobile }: { mobile?: boolean }) {
  const view = useCartView();
  const [code, setCode] = useState(view.couponCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputId = mobile ? 'promo-code-mobile' : 'promo-code';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();

    if (!value) {
      setCoupon(null);
      setError(null);
      return;
    }
    if (!view.cart) return;

    setChecking(true);
    try {
      // A API valida o cupom (inválido/expirado); só então ele passa a valer na cotação.
      await createQuote({ cartId: view.cart.id, network: 'ethereum', couponCode: value });
      setCoupon(value.toUpperCase());
      setError(null);
      toast.success('Cupom aplicado.');
    } catch (failure) {
      const apiError = normalizeApiError(failure);
      setError(apiError.fieldErrors?.[0]?.message ?? apiError.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <label
        htmlFor={inputId}
        className={cn('text-sm leading-[18px] font-bold', mobile && 'sr-only')}
      >
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden',
          mobile
            ? 'border-line h-[50px] rounded-full border'
            : 'border-primary mt-1 h-10 rounded border',
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'min-w-0 flex-1 bg-transparent placeholder:text-[#b39463] focus-visible:outline-none',
            mobile ? 'px-4 text-sm' : 'px-2.5 text-xs',
          )}
        />
        <button
          type="submit"
          disabled={checking}
          className={cn(
            'text-primary-foreground focus-visible:ring-ring shrink-0 font-bold focus-visible:ring-2 focus-visible:outline-none',
            mobile
              ? 'w-[97px] rounded-full bg-[linear-gradient(90deg,#8d5e35,#d28a4c)] text-base text-white'
              : 'bg-primary w-[101px] text-[15px]',
          )}
        >
          Aplicar
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function SummaryRows({ cart, mobile }: { cart: CartView; mobile?: boolean }) {
  const row = 'flex items-center justify-between';
  const value = cn('text-right', mobile ? 'text-base' : 'text-lg');

  return (
    <dl className={cn('text-[15px] leading-5', mobile ? 'mt-[7px] text-base' : 'mt-[18px]')}>
      <div className={cn(row, 'h-8')}>
        <dt>Subtotal</dt>
        <dd className={value}>{ethLabel(cart.subtotal)}</dd>
      </div>
      <div className={cn(row, 'h-8')}>
        <dt>Desconto do lançamento</dt>
        <dd className={cn(value, !mobile && 'text-[15px]')}>
          (-) {cart.discount.isZero() ? '00.00' : cart.discount.toString()}
        </dd>
      </div>
      <div className={cn(row, 'h-8')}>
        <dt>Taxa de rede</dt>
        <dd className={value}>{ethLabel(cart.fee)}</dd>
      </div>
      <div>
        <dd className="text-primary mt-[7px] text-right text-[11px] leading-[14px] max-sm:mt-0 max-sm:text-xs">
          Taxa estimada
        </dd>
      </div>
      <div className={cn(row, 'mt-[21px] h-6 max-sm:mt-1')}>
        <dt className="font-bold">Total</dt>
        <dd className={cn(value, 'text-primary font-bold', mobile && 'text-[22px]')}>
          {ethLabel(cart.total)}
        </dd>
      </div>
    </dl>
  );
}

function CheckoutButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => void navigate({ to: '/pagamento' })}
      className={cn(
        'text-primary-foreground focus-visible:ring-ring font-bold focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      Conectar e finalizar
    </button>
  );
}

function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carrinho"
      aria-busy="true"
      className="grid gap-8 max-sm:px-6 sm:mt-[9px] lg:grid-cols-[782px_332px] lg:gap-x-[86px]"
    >
      <div className="flex flex-col gap-3 pt-10">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="skeleton-shimmer h-[70px] w-full rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-3 pt-10">
        <Skeleton className="skeleton-shimmer h-10 w-full" />
        <Skeleton className="skeleton-shimmer h-32 w-full" />
        <Skeleton className="skeleton-shimmer h-10 w-full" />
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mt-16 text-center max-sm:px-6">
      <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Explore o mercado e adicione NFTs para finalizar sua compra.
      </p>
      <Link
        to="/"
        hash="catalogo"
        className="bg-primary text-primary-foreground focus-visible:ring-ring mt-6 inline-flex h-10 items-center rounded px-6 text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none"
      >
        Explorar NFTs
      </Link>
    </div>
  );
}

export function CartPage() {
  const cart = useCartView();
  const alsoViewed = useNftList({ sort: 'newest', pageSize: 5, page: 2 });

  return (
    <main className="flex-1 pb-10">
      <Container className="pt-8 max-sm:px-0 max-sm:pt-0">
        <MobileTopBar title="Carrinho de NFTs" />
        <h1 className="sr-only max-sm:hidden">Carrinho de NFTs</h1>

        <nav
          aria-label="Trilha de navegação"
          className="hidden text-[15px] leading-[18px] font-bold sm:block"
        >
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden="true"> / </span>
          <Link to="/" hash="catalogo" className="hover:text-primary">
            Mercado
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Carrinho</span>
        </nav>

        {cart.isPending ? (
          <CartSkeleton />
        ) : cart.isError ? (
          <div className="mt-10">
            <ErrorState
              title="Não foi possível carregar o carrinho"
              description={getErrorMessage(cart.error)}
              onRetry={() => void cart.refetch()}
            />
          </div>
        ) : cart.lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid items-start sm:mt-[9px] lg:grid-cols-[782px_332px] lg:gap-x-[86px]">
            <section aria-label="Itens do carrinho">
              <CartTable lines={cart.lines} />
              <CartCards lines={cart.lines} />
            </section>

            <aside aria-labelledby="cart-summary-title" className="hidden sm:block">
              <h2
                id="cart-summary-title"
                className="border-line border-b pb-2.5 text-lg leading-[18px] font-bold"
              >
                Resumo da carteira
              </h2>
              <div className="mt-[22px]">
                <PromoForm />
              </div>
              <SummaryRows cart={cart} />
              <CheckoutButton className="bg-primary mt-5 h-10 w-full rounded text-[15px]" />
              <Link
                to="/"
                hash="catalogo"
                className="text-primary mt-3 block text-center text-[15px] leading-5 hover:underline"
              >
                Continuar explorando
              </Link>
            </aside>

            <aside
              aria-label="Resumo da carteira"
              className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[342px] max-w-[414px] rounded-t-[40px] bg-[#211511] px-6 pt-6 shadow-[0_-10px_30px_#0a060473] sm:hidden"
            >
              <PromoForm mobile />
              <SummaryRows cart={cart} mobile />
              <CheckoutButton className="mt-[27px] h-[60px] w-full rounded-full bg-[linear-gradient(135deg,#d28a4c,#b87a44)] text-base" />
            </aside>
          </div>
        )}

        {cart.lines.length > 0 ? (
          <NftRail
            id="also-viewed-title"
            title="Colecionadores também viram"
            items={alsoViewed.data?.items ?? []}
            isPending={alsoViewed.isPending}
            className="max-sm:hidden lg:mt-[100px]"
          />
        ) : null}
      </Container>
    </main>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { useCartView, type CartView } from '@/features/cart';
import { useWallets } from '@/features/wallets';
import { Field, SelectInput, TextInput, controlClass } from '@/shared/components/form/form-fields';
import { networkOptions, walletTypeOptions } from '@/shared/components/form/options';
import { Container } from '@/shared/components/layout/container';
import { MobileTopBar } from '@/shared/components/layout/mobile-top-bar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { NetworkSchema, type Network, type Wallet } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';
import { networkLabels } from '@/shared/lib/nft-labels';
import { useWalletConnection, type ConnectionState } from '../hooks/use-wallet-connection';
import { ReviewDialog } from './review-dialog';

const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
  username: z.string().trim().min(3, 'Informe um nome de usuário com 3+ caracteres.'),
  network: z.string().min(1, 'Selecione uma rede.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  walletAddress: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x válido (42 caracteres).'),
  secondaryWallet: z.string().trim().optional(),
  walletType: z.string().min(1, 'Selecione uma carteira.'),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
  useAnotherWallet: z.boolean().optional(),
  note: z.string().max(500).optional(),
});

type CollectorForm = z.infer<typeof collectorSchema>;

const connectionText: Record<ConnectionState, string> = {
  disconnected: 'Carteira desconectada',
  connecting: 'Conectando carteira…',
  connected: 'Carteira conectada',
  rejected: 'Conexão recusada. Tente novamente ou escolha outra carteira.',
};

function toNetwork(value: string | undefined): Network {
  const parsed = NetworkSchema.safeParse(value);
  return parsed.success ? parsed.data : 'ethereum';
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletRadios({
  wallets,
  selectedId,
  onSelect,
  name,
  mobile,
}: {
  wallets: Wallet[];
  selectedId: string;
  onSelect: (wallet: Wallet) => void;
  name: string;
  mobile?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Carteiras cadastradas" className="flex flex-col gap-4">
      {wallets.map((wallet) => {
        const selected = wallet.id === selectedId;
        return (
          <label
            key={wallet.id}
            className={cn(
              'focus-within:ring-ring flex cursor-pointer items-center gap-3 focus-within:ring-2',
              mobile
                ? 'bg-card min-h-[94px] items-start rounded-[16px] px-4 py-4'
                : 'border-line min-h-[46px] rounded border px-4 py-2 text-sm',
              selected && !mobile && 'border-primary',
            )}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onSelect(wallet)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'border-primary grid size-[18px] shrink-0 place-items-center rounded-full border-2',
                mobile && 'mt-6',
              )}
            >
              {selected ? <span className="bg-primary size-2 rounded-full" /> : null}
            </span>
            <span className={cn('leading-[22px]', mobile && 'text-sm')}>
              <span className={cn('block', mobile ? 'text-base font-bold' : 'font-bold')}>
                {wallet.label}
                {wallet.isPrimary ? <span className="sr-only"> (principal)</span> : null}
              </span>
              <span className="text-muted-foreground block">
                {shortAddress(wallet.address)} · {networkLabels[wallet.network]}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

interface SummaryProps {
  cart: CartView;
  wallets: Wallet[];
  walletId: string;
  onSelectWallet: (wallet: Wallet) => void;
  connection: ConnectionState;
  onDisconnect: () => void;
  onSubmit: () => void;
  pending: boolean;
}

function OrderSummary({
  cart,
  wallets,
  walletId,
  onSelectWallet,
  connection,
  onDisconnect,
  onSubmit,
  pending,
}: SummaryProps) {
  const groupId = useId();
  const row = 'flex items-center justify-between';

  return (
    <aside aria-labelledby="order-title" className="max-sm:hidden">
      <h2 id="order-title" className="text-[17px] leading-5 font-bold">
        Seus NFTs
      </h2>
      <div className="border-line mt-[7px] flex justify-between border-b pb-2 text-[15px] leading-[18px] font-bold">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>

      <ul className="mt-[11px] flex flex-col gap-3">
        {cart.lines.map((line) => (
          <li key={line.itemId} className="bg-card flex h-[70px] items-center gap-2 pr-3 pl-1">
            <img
              src={line.imageUrl}
              alt=""
              width={140}
              height={140}
              className="size-[70px] rounded-lg object-cover"
            />
            <div className="flex-1 whitespace-nowrap">
              <p className="text-base leading-[22px] font-bold">{line.name}</p>
              <p className="text-sm leading-[18px] text-[#b39463]">ID do token: #{line.tokenId}</p>
            </div>
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              (x {line.quantity})
            </span>
            <span className="text-primary text-right text-[17px] font-bold whitespace-nowrap">
              {ethLabel(multiplyEth(line.priceEth, line.quantity))}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-[13px] text-center text-sm leading-5">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="hover:text-primary">
          Aplique aqui
        </Link>
      </p>

      <dl className="mt-3 text-[15px] leading-5" aria-busy={cart.isQuoting}>
        <div className={cn(row, 'h-8')}>
          <dt>Subtotal</dt>
          <dd className="text-lg">{ethLabel(cart.subtotal)}</dd>
        </div>
        <div className={cn(row, 'h-8')}>
          <dt>Desconto do lançamento</dt>
          <dd>(-) {cart.discount.isZero() ? '00.00' : cart.discount.toString()}</dd>
        </div>
        <div className={cn(row, 'h-8')}>
          <dt>Taxa de rede</dt>
          <dd className="text-lg">{ethLabel(cart.fee)}</dd>
        </div>
        <div>
          <dd className="text-primary mt-1 text-center text-[11px] leading-[14px]">
            Taxa estimada
          </dd>
        </div>
        <div className={cn(row, 'border-line mt-3 justify-center gap-[165px] border-t pt-4')}>
          <dt className="font-bold">Total</dt>
          <dd className="text-primary text-lg font-bold">{ethLabel(cart.total)}</dd>
        </div>
      </dl>

      <fieldset className="mt-3 border-0 p-0">
        <legend id={groupId} className="mx-auto text-[17px] leading-5 font-bold">
          Carteira e rede
        </legend>
        <div className="mt-3">
          <WalletRadios
            wallets={wallets}
            selectedId={walletId}
            onSelect={onSelectWallet}
            name="wallet"
          />
        </div>
        <p
          role="status"
          className={cn(
            'mt-3 flex items-center justify-between text-xs',
            connection === 'rejected' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          <span>{connectionText[connection]}</span>
          {connection === 'connected' ? (
            <button type="button" onClick={onDisconnect} className="text-primary hover:underline">
              Desconectar
            </button>
          ) : null}
        </p>
      </fieldset>

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="bg-primary text-primary-foreground focus-visible:ring-ring mt-4 h-10 w-full rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        {connection === 'connecting' ? 'Conectando…' : 'Confirmar compra'}
      </button>
    </aside>
  );
}

function MobilePayment({
  cart,
  wallets,
  walletId,
  onSelectWallet,
  provider,
  onProvider,
  connection,
  onSubmit,
  pending,
}: {
  cart: CartView;
  wallets: Wallet[];
  walletId: string;
  onSelectWallet: (wallet: Wallet) => void;
  provider: string;
  onProvider: (provider: string) => void;
  connection: ConnectionState;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <div className="px-6 sm:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-base leading-5 font-bold">Carteira conectada</h2>
        <Link to="/carteiras" className="text-primary text-sm font-medium">
          Trocar carteira
        </Link>
      </div>

      <div className="mt-4">
        <WalletRadios
          wallets={wallets}
          selectedId={walletId}
          onSelect={onSelectWallet}
          name="saved-wallet"
          mobile
        />
      </div>

      <h2 className="mt-5 text-base leading-5 font-bold">Carteira e rede</h2>
      <div role="radiogroup" aria-label="Provedor de carteira" className="mt-4 flex flex-col gap-4">
        {walletTypeOptions.map((option) => (
          <label
            key={option.value}
            className="bg-card focus-within:ring-ring flex h-[62px] cursor-pointer items-center gap-4 rounded-[16px] px-4 focus-within:ring-2"
          >
            <input
              type="radio"
              name="provider"
              checked={provider === option.value}
              onChange={() => onProvider(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="border-line text-primary grid size-[42px] place-items-center rounded-full border bg-[#2a1a14] text-sm font-bold"
            >
              {option.label[0]}
            </span>
            <span className="flex-1 text-sm">{option.label}</span>
            <span
              aria-hidden="true"
              className="border-primary grid size-[18px] shrink-0 place-items-center rounded-full border-2"
            >
              {provider === option.value ? (
                <span className="bg-primary size-2 rounded-full" />
              ) : null}
            </span>
          </label>
        ))}
      </div>

      <p
        role="status"
        className={cn(
          'mt-3 text-xs',
          connection === 'rejected' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {connectionText[connection]}
      </p>

      <p className="mt-4 flex items-baseline justify-end gap-6 text-base">
        <span className="font-bold">Total:</span>
        <span className="text-primary text-[22px] font-bold">{ethLabel(cart.total)}</span>
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="text-primary-foreground focus-visible:ring-ring mt-[72px] h-[60px] w-full rounded-full bg-[linear-gradient(135deg,#d28a4c,#b87a44)] text-base font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        {connection === 'connecting' ? 'Conectando…' : 'Confirmar compra'}
      </button>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando pagamento"
      aria-busy="true"
      className="mt-6 grid gap-6 max-sm:px-6 lg:grid-cols-[763px_405px] lg:gap-x-8"
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="skeleton-shimmer h-14 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="skeleton-shimmer h-[70px] w-full" />
        <Skeleton className="skeleton-shimmer h-[70px] w-full" />
        <Skeleton className="skeleton-shimmer h-40 w-full" />
      </div>
    </div>
  );
}

function PaymentEmpty({
  title,
  text,
  to,
  cta,
}: {
  title: string;
  text: string;
  to: '/' | '/carteiras';
  cta: string;
}) {
  return (
    <div className="mt-16 text-center max-sm:px-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{text}</p>
      <Link
        to={to}
        className="bg-primary text-primary-foreground mt-6 inline-flex h-10 items-center rounded px-6 text-[15px] font-bold"
      >
        {cta}
      </Link>
    </div>
  );
}

interface CheckoutFormProps {
  wallets: Wallet[];
}

function CheckoutContent({ wallets }: CheckoutFormProps) {
  const user = useCurrentUser();
  const primary = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0];
  const [walletId, setWalletId] = useState(primary?.id ?? '');
  const [provider, setProvider] = useState('metamask');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewedTotal, setReviewedTotal] = useState<string | undefined>();
  const connection = useWalletConnection();
  const selected = wallets.find((wallet) => wallet.id === walletId) ?? primary;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CollectorForm>({
    resolver: zodResolver(collectorSchema),
    defaultValues: {
      displayName: user?.name ?? '',
      email: user?.email ?? '',
      network: primary?.network ?? 'ethereum',
      walletAddress: primary?.address ?? '',
      walletType: 'metamask',
    },
  });

  const [networkValue, displayName, email] = useWatch({
    control,
    name: ['network', 'displayName', 'email'],
  });
  const network = toNetwork(networkValue);
  const cart = useCartView(network);

  function selectWallet(wallet: Wallet) {
    setWalletId(wallet.id);
    setValue('walletAddress', wallet.address, { shouldValidate: true });
    setValue('network', wallet.network);
    connection.disconnect();
  }

  async function openReview(chosenProvider: string) {
    if (!selected) return;

    if (connection.state !== 'connected') {
      const connected = await connection.connect(chosenProvider);
      if (!connected) {
        toast.error('A carteira recusou a conexão.');
        return;
      }
    }
    setReviewedTotal(cart.quote?.totalEth);
    setReviewOpen(true);
  }

  const submitDesktop = handleSubmit((values) => openReview(values.walletType));

  const collector = {
    name: displayName || user?.name || 'Colecionador',
    email: email || user?.email || '',
  };

  if (cart.isPending) return <PaymentSkeleton />;
  if (cart.lines.length === 0) {
    return (
      <PaymentEmpty
        title="Nada para pagar ainda"
        text="Adicione NFTs ao carrinho primeiro."
        to="/"
        cta="Explorar NFTs"
      />
    );
  }

  const busy = connection.state === 'connecting';

  return (
    <>
      <div className="mt-[22px] hidden sm:grid lg:grid-cols-[763px_405px] lg:gap-x-8">
        <form
          onSubmit={(event) => void submitDesktop(event)}
          noValidate
          aria-label="Dados do colecionador"
        >
          <h1 className="text-[17px] leading-5 font-bold">Perfil do colecionador</h1>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-[18px]">
            <Field
              label="Nome de exibição"
              required
              error={errors.displayName}
              htmlFor="displayName"
            >
              <TextInput
                id="displayName"
                register={register('displayName')}
                error={errors.displayName}
              />
            </Field>
            <Field label="Nome de usuário" required error={errors.username} htmlFor="username">
              <TextInput id="username" register={register('username')} error={errors.username} />
            </Field>
            <Field label="Rede" required error={errors.network} htmlFor="network">
              <SelectInput
                id="network"
                register={register('network')}
                error={errors.network}
                placeholder="Selecione uma rede"
                options={networkOptions}
              />
            </Field>
            <Field label="Nome do perfil" required error={errors.profileName} htmlFor="profileName">
              <TextInput
                id="profileName"
                register={register('profileName')}
                error={errors.profileName}
              />
            </Field>
            <Field
              label="Endereço da carteira"
              required
              error={errors.walletAddress}
              htmlFor="walletAddress"
            >
              <TextInput
                id="walletAddress"
                register={register('walletAddress')}
                error={errors.walletAddress}
                placeholder="Endereço 0x da carteira"
                className="px-6"
              />
            </Field>
            <Field label="Carteira secundária" htmlFor="secondaryWallet" hideLabel>
              <TextInput
                id="secondaryWallet"
                register={register('secondaryWallet')}
                placeholder="ENS ou carteira secundária (opcional)"
                className="px-6"
              />
            </Field>
            <Field label="Tipo de carteira" required error={errors.walletType} htmlFor="walletType">
              <SelectInput
                id="walletType"
                register={register('walletType')}
                error={errors.walletType}
                placeholder="Selecione uma carteira"
                options={walletTypeOptions}
              />
            </Field>
            <Field
              label="Código de indicação"
              required
              error={errors.referralCode}
              htmlFor="referralCode"
            >
              <TextInput
                id="referralCode"
                register={register('referralCode')}
                error={errors.referralCode}
              />
            </Field>
            <Field label="E-mail" required error={errors.email} htmlFor="email">
              <TextInput
                id="email"
                type="email"
                register={register('email')}
                error={errors.email}
              />
            </Field>
            <Field label="Nome ENS" required error={errors.ensName} htmlFor="ensName">
              <div className="flex gap-2">
                <TextInput
                  id="ensName"
                  register={register('ensName')}
                  error={errors.ensName}
                  className="min-w-0 flex-1"
                />
                <span
                  className={cn(
                    controlClass,
                    'flex w-[78px] shrink-0 items-center justify-between',
                  )}
                >
                  .eth
                  <ChevronDown aria-hidden="true" className="size-4" />
                </span>
              </div>
            </Field>
          </div>

          <label className="mt-[25px] flex w-fit cursor-pointer items-center gap-2 text-[15px]">
            <input type="checkbox" className="peer sr-only" {...register('useAnotherWallet')} />
            <span
              aria-hidden="true"
              className="border-primary peer-checked:bg-primary peer-focus-visible:ring-ring size-4 rounded-full border-2 peer-focus-visible:ring-2"
            />
            Usar outra carteira?
          </label>

          <label htmlFor="note" className="mt-[22px] block text-[15px] leading-4">
            Observação do colecionador (opcional)
          </label>
          <textarea
            id="note"
            rows={5}
            className="border-line focus-visible:ring-ring mt-3 h-[150px] w-[350px] max-w-full resize-none rounded border bg-transparent p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            {...register('note')}
          />
        </form>

        <OrderSummary
          cart={cart}
          wallets={wallets}
          walletId={walletId}
          onSelectWallet={selectWallet}
          connection={connection.state}
          onDisconnect={connection.disconnect}
          onSubmit={() => void submitDesktop()}
          pending={busy}
        />
      </div>

      <MobilePayment
        cart={cart}
        wallets={wallets}
        walletId={walletId}
        onSelectWallet={selectWallet}
        provider={provider}
        onProvider={setProvider}
        connection={connection.state}
        onSubmit={() => void openReview(provider)}
        pending={busy}
      />

      {selected ? (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          network={network}
          wallet={selected}
          collector={collector}
          reviewedTotal={reviewedTotal}
        />
      ) : null}
    </>
  );
}

export function PaymentPage() {
  const wallets = useWallets();

  return (
    <main className="flex-1 pb-10">
      <Container className="pt-8 max-sm:px-0 max-sm:pt-0">
        <MobileTopBar title="Pagamento com carteira" fallbackTo="/carrinho" />

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
          <span aria-current="page">Pagamento</span>
        </nav>

        {wallets.isPending ? (
          <PaymentSkeleton />
        ) : !wallets.data || wallets.data.length === 0 ? (
          <PaymentEmpty
            title="Cadastre uma carteira"
            text="Você precisa de ao menos uma carteira cadastrada para concluir a compra."
            to="/carteiras"
            cta="Cadastrar carteira"
          />
        ) : (
          <CheckoutContent wallets={wallets.data} />
        )}
      </Container>
    </main>
  );
}

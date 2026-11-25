import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { clearCart, useCart } from '@/features/cart';
import { createOrderId, saveOrder } from '@/features/orders/store/local-orders';
import { Field, SelectInput, TextInput, controlClass } from '@/shared/components/form/form-fields';
import { networkOptions, walletTypeOptions } from '@/shared/components/form/options';
import { Container } from '@/shared/components/layout/container';
import { MobileTopBar } from '@/shared/components/layout/mobile-top-bar';
import { cn } from '@/shared/lib/cn';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';

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

const walletOptions = [
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'metamask', label: 'MetaMask' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
] as const;

function OrderSummary({
  cart,
  onSubmit,
  pending,
}: {
  cart: ReturnType<typeof useCart>;
  onSubmit: () => void;
  pending: boolean;
}) {
  const [wallet, setWallet] = useState<string>('coinbase');
  const groupId = useId();
  const row = 'flex items-baseline justify-between';

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
          <li key={line.nftId} className="bg-card flex h-[70px] items-center gap-2 pr-3 pl-1">
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

      <dl className="mt-3 text-[15px] leading-5">
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
        <p className="text-primary mt-1 text-center text-[11px] leading-[14px]">Taxa estimada</p>
        <div className={cn(row, 'border-line mt-3 justify-center gap-[165px] border-t pt-4')}>
          <dt className="font-bold">Total</dt>
          <dd className="text-primary text-lg font-bold">{ethLabel(cart.total)}</dd>
        </div>
      </dl>

      <fieldset className="mt-3 border-0 p-0">
        <legend className="mx-auto text-[17px] leading-5 font-bold">Carteira e rede</legend>
        <div role="radiogroup" aria-labelledby={groupId} className="mt-3 flex flex-col gap-4">
          <span id={groupId} className="sr-only">
            Carteira e rede
          </span>
          {walletOptions.map((option) => {
            const selected = wallet === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  'border-line focus-within:ring-ring flex h-[46px] cursor-pointer items-center gap-3 rounded border px-4 text-sm focus-within:ring-2',
                  selected && 'border-primary',
                )}
              >
                <input
                  type="radio"
                  name="wallet"
                  value={option.id}
                  checked={selected}
                  onChange={() => setWallet(option.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="border-primary grid size-4 place-items-center rounded-full border-2"
                >
                  {selected ? <span className="bg-primary size-2 rounded-full" /> : null}
                </span>
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="bg-primary text-primary-foreground focus-visible:ring-ring mt-6 h-10 w-full rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        Confirmar compra
      </button>
    </aside>
  );
}

function MobilePayment({
  cart,
  onSubmit,
  pending,
}: {
  cart: ReturnType<typeof useCart>;
  onSubmit: () => void;
  pending: boolean;
}) {
  const [saved, setSaved] = useState('reserva');
  const [wallet, setWallet] = useState('coinbase');

  const savedWallets = [
    { id: 'reserva', title: 'Reserva', address: 'nova.kurio.eth', network: 'Rede Polygon' },
    {
      id: 'principal',
      title: 'Principal',
      address: '0xA91F…E82C',
      network: 'Rede principal Ethereum',
    },
  ];

  const radio = (selected: boolean) => (
    <span
      aria-hidden="true"
      className="border-primary grid size-[18px] shrink-0 place-items-center rounded-full border-2"
    >
      {selected ? <span className="bg-primary size-2 rounded-full" /> : null}
    </span>
  );

  return (
    <div className="px-6 sm:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-base leading-5 font-bold">Carteira conectada</h2>
        <button type="button" className="text-primary text-sm font-medium">
          Trocar carteira
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Carteiras cadastradas"
        className="mt-4 flex flex-col gap-4"
      >
        {savedWallets.map((item) => (
          <label
            key={item.id}
            className="bg-card focus-within:ring-ring relative flex min-h-[94px] cursor-pointer items-start gap-4 rounded-[16px] px-4 py-4 focus-within:ring-2"
          >
            <input
              type="radio"
              name="saved-wallet"
              checked={saved === item.id}
              onChange={() => setSaved(item.id)}
              className="sr-only"
            />
            <span className="mt-6">{radio(saved === item.id)}</span>
            <span className="text-sm leading-[22px]">
              <span className="block text-base font-bold">{item.title}</span>
              <span className="text-muted-foreground block">{item.address}</span>
              <span className="text-muted-foreground block">{item.network}</span>
            </span>
            <span aria-hidden="true" className="text-muted-foreground absolute top-6 right-4">
              ⋮
            </span>
          </label>
        ))}
      </div>

      <h2 className="mt-5 text-base leading-5 font-bold">Carteira e rede</h2>
      <div role="radiogroup" aria-label="Carteira e rede" className="mt-4 flex flex-col gap-4">
        {walletOptions.map((option) => (
          <label
            key={option.id}
            className="bg-card focus-within:ring-ring flex h-[62px] cursor-pointer items-center gap-4 rounded-[16px] px-4 focus-within:ring-2"
          >
            <input
              type="radio"
              name="mobile-wallet"
              checked={wallet === option.id}
              onChange={() => setWallet(option.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="border-line text-primary grid size-[42px] place-items-center rounded-full border bg-[#2a1a14] text-sm font-bold"
            >
              {option.label[0]}
            </span>
            <span className="flex-1 text-sm">{option.label}</span>
            {radio(wallet === option.id)}
          </label>
        ))}
      </div>

      <p className="mt-4 flex items-baseline justify-end gap-6 text-base">
        <span className="font-bold">Total:</span>
        <span className="text-primary text-[22px] font-bold">{ethLabel(cart.total)}</span>
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="text-primary-foreground focus-visible:ring-ring mt-[96px] h-[60px] w-full rounded-full bg-[linear-gradient(135deg,#d28a4c,#b87a44)] text-base font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        Confirmar compra
      </button>
    </div>
  );
}

export function PaymentPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CollectorForm>({ resolver: zodResolver(collectorSchema), mode: 'onSubmit' });

  function finish() {
    if (cart.lines.length === 0) return;
    setPending(true);
    const id = createOrderId();
    saveOrder({
      id,
      createdAt: new Date().toISOString(),
      transactionHash: '0xA91F7c0d3b52E1f4a86B9d0C2e5f31a7D4b8E82C',
      walletLabel: 'MetaMask',
      network: 'Ethereum',
      lines: cart.lines.map(({ nftId, name, tokenId, imageUrl, priceEth, quantity }) => ({
        nftId,
        name,
        tokenId,
        imageUrl,
        priceEth,
        quantity,
      })),
      subtotalEth: cart.subtotal.toString(),
      discountEth: cart.discount.toString(),
      feeEth: cart.fee.toString(),
      totalEth: cart.total.toString(),
    });
    clearCart();
    void navigate({ to: '/pedido/$orderId', params: { orderId: id } });
  }

  const submitDesktop = handleSubmit(finish);

  if (cart.lines.length === 0) {
    return (
      <main className="flex-1 pb-10">
        <Container className="pt-8 max-sm:px-0 max-sm:pt-0">
          <MobileTopBar title="Pagamento com carteira" fallbackTo="/carrinho" />
          <div className="mt-16 text-center">
            <h1 className="text-xl font-bold">Nada para pagar ainda</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Adicione NFTs ao carrinho primeiro.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="bg-primary text-primary-foreground mt-6 inline-flex h-10 items-center rounded px-6 text-[15px] font-bold"
            >
              Explorar NFTs
            </Link>
          </div>
        </Container>
      </main>
    );
  }

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

        <div className="mt-[22px] hidden sm:grid lg:grid-cols-[763px_405px] lg:gap-x-8">
          <form onSubmit={submitDesktop} noValidate aria-label="Dados do colecionador">
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
              <Field
                label="Nome do perfil"
                required
                error={errors.profileName}
                htmlFor="profileName"
              >
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
              <Field
                label="Tipo de carteira"
                required
                error={errors.walletType}
                htmlFor="walletType"
              >
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

          <OrderSummary cart={cart} onSubmit={() => void submitDesktop()} pending={pending} />
        </div>

        <MobilePayment cart={cart} onSubmit={finish} pending={pending} />
      </Container>
    </main>
  );
}

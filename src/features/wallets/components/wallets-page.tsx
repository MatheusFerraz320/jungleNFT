import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCurrentUser, useLogout } from '@/features/auth';
import { getErrorMessage } from '@/shared/api/errors';
import { applyApiErrors } from '@/shared/api/form-errors';
import { ErrorState } from '@/shared/components/feedback/empty-error-states';
import { Field, SelectInput, TextInput, controlClass } from '@/shared/components/form/form-fields';
import { networkOptions, walletTypeOptions } from '@/shared/components/form/options';
import { AccountLayout } from '@/shared/components/layout/account-layout';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { Wallet } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import { useCreateWallet, useUpdateWallet } from '../hooks/use-wallet-mutations';
import { useWallets } from '../hooks/use-wallets';

const walletSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
  nickname: z
    .string()
    .trim()
    .min(2, 'Informe o apelido da carteira.')
    .max(40, 'Use até 40 caracteres.'),
  network: z.string().min(1, 'Selecione uma rede.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x válido (42 caracteres).'),
  secondaryAddress: z.string().trim().optional(),
  walletType: z.string().min(1, 'Selecione uma carteira.'),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
});

type WalletForm = z.infer<typeof walletSchema>;

const EMPTY: Partial<WalletForm> = {
  displayName: '',
  nickname: '',
  network: '',
  profileName: '',
  address: '',
  secondaryAddress: '',
  walletType: '',
  referralCode: '',
  ensName: '',
};

function toFormValues(wallet: Wallet | undefined, email: string): Partial<WalletForm> {
  if (!wallet) return { ...EMPTY, email };
  return {
    displayName: wallet.displayName ?? '',
    nickname: wallet.label,
    network: wallet.network,
    profileName: wallet.profileName ?? '',
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress ?? '',
    walletType: wallet.walletType ?? '',
    referralCode: wallet.referralCode ?? '',
    email: wallet.email ?? email,
    ensName: wallet.ensName ?? '',
  };
}

interface WalletFormProps {
  wallet?: Wallet;
  primary: boolean;
  /** Dados da carteira principal, usados pela opção "Igual à carteira principal". */
  copyFrom?: Wallet;
  idPrefix: string;
  submitLabel: string;
  onSaved?: () => void;
}

function WalletFormView({
  wallet,
  primary,
  copyFrom,
  idPrefix,
  submitLabel,
  onSaved,
}: WalletFormProps) {
  const user = useCurrentUser();
  const create = useCreateWallet();
  const update = useUpdateWallet();
  const [formError, setFormError] = useState<string | null>(null);
  const [same, setSame] = useState(false);
  const id = (name: string) => `${idPrefix}-${name}`;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: toFormValues(wallet, user?.email ?? ''),
  });

  const saving = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      label: values.nickname,
      address: values.address,
      network: values.network as Wallet['network'],
      displayName: values.displayName,
      profileName: values.profileName,
      walletType: values.walletType,
      referralCode: values.referralCode,
      email: values.email,
      ensName: values.ensName,
      secondaryAddress: values.secondaryAddress || undefined,
    };

    try {
      if (wallet) await update.mutateAsync({ id: wallet.id, body });
      else await create.mutateAsync({ ...body, isPrimary: primary });
      toast.success(wallet ? 'Carteira atualizada.' : 'Carteira cadastrada.');
      onSaved?.();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ['address', 'network'], { label: 'nickname' }));
    }
  });

  function toggleSame(checked: boolean) {
    setSame(checked);
    reset(
      checked && copyFrom
        ? toFormValues(copyFrom, user?.email ?? '')
        : toFormValues(wallet, user?.email ?? ''),
    );
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      aria-label={primary ? 'Carteira principal' : 'Carteira secundária'}
    >
      {!primary && copyFrom ? (
        <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={same}
            onChange={(event) => toggleSame(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="border-primary peer-checked:bg-primary peer-focus-visible:ring-ring size-3.5 rounded-full border-2 peer-focus-visible:ring-2"
          />
          Igual à carteira principal (preenche os dados; o endereço precisa ser diferente)
        </label>
      ) : null}

      <div className="grid gap-x-[28px] gap-y-[25px] md:grid-cols-2">
        <Field
          label="Nome de exibição"
          htmlFor={id('displayName')}
          required
          error={errors.displayName}
        >
          <TextInput
            id={id('displayName')}
            register={register('displayName')}
            error={errors.displayName}
          />
        </Field>
        <Field
          label="Apelido da carteira"
          htmlFor={id('nickname')}
          required
          error={errors.nickname}
        >
          <TextInput id={id('nickname')} register={register('nickname')} error={errors.nickname} />
        </Field>
        <Field label="Rede" htmlFor={id('network')} required error={errors.network}>
          <SelectInput
            id={id('network')}
            register={register('network')}
            error={errors.network}
            placeholder="Selecione uma rede"
            options={networkOptions}
          />
        </Field>
        <Field
          label="Nome do perfil"
          htmlFor={id('profileName')}
          required
          error={errors.profileName}
        >
          <TextInput
            id={id('profileName')}
            register={register('profileName')}
            error={errors.profileName}
          />
        </Field>
        <Field label="Endereço da carteira" htmlFor={id('address')} required error={errors.address}>
          <TextInput
            id={id('address')}
            register={register('address')}
            error={errors.address}
            placeholder="Endereço 0x da carteira"
          />
        </Field>
        <Field label="Carteira secundária" htmlFor={id('secondaryAddress')} hideLabel>
          <TextInput
            id={id('secondaryAddress')}
            register={register('secondaryAddress')}
            placeholder="ENS ou carteira secundária (opcional)"
          />
        </Field>
        <Field
          label="Tipo de carteira"
          htmlFor={id('walletType')}
          required
          error={errors.walletType}
        >
          <SelectInput
            id={id('walletType')}
            register={register('walletType')}
            error={errors.walletType}
            placeholder="Selecione uma carteira"
            options={walletTypeOptions}
          />
        </Field>
        <Field
          label="Código de indicação"
          htmlFor={id('referralCode')}
          required
          error={errors.referralCode}
        >
          <TextInput
            id={id('referralCode')}
            register={register('referralCode')}
            error={errors.referralCode}
          />
        </Field>
        <Field label="E-mail" htmlFor={id('email')} required error={errors.email}>
          <TextInput
            id={id('email')}
            type="email"
            register={register('email')}
            error={errors.email}
          />
        </Field>
        <Field label="Nome ENS" htmlFor={id('ensName')} required error={errors.ensName}>
          <div className="flex gap-2">
            <span
              className={cn(controlClass, 'flex w-[78px] shrink-0 items-center justify-between')}
            >
              .eth
              <ChevronDown aria-hidden="true" className="size-4" />
            </span>
            <TextInput
              id={id('ensName')}
              register={register('ensName')}
              error={errors.ensName}
              className="min-w-0 flex-1"
            />
          </div>
        </Field>
      </div>

      {formError ? (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-primary-foreground focus-visible:ring-ring mt-8 h-10 rounded px-4 text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
      >
        {saving ? 'Salvando…' : submitLabel}
      </button>
    </form>
  );
}

function WalletsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carteiras"
      aria-busy="true"
      className="grid gap-6 md:grid-cols-2"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="skeleton-shimmer h-16 w-full" />
      ))}
    </div>
  );
}

function WalletsContent({ wallets }: { wallets: Wallet[] }) {
  const primary = wallets.find((wallet) => wallet.isPrimary);
  const secondary = wallets.find((wallet) => !wallet.isPrimary);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <section aria-labelledby="wallet-title">
        <div className="flex items-start justify-between">
          <h1 id="wallet-title" className="text-base leading-5 font-bold">
            Carteira principal
          </h1>
        </div>
        <p className="text-muted-foreground mt-1.5 mb-[28px] text-[13px] leading-5">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        <WalletFormView
          key={`${primary?.id ?? 'new'}-${primary?.version ?? 0}`}
          wallet={primary}
          primary
          idPrefix="primary"
          submitLabel={primary ? 'Salvar carteira' : 'Cadastrar carteira'}
        />
      </section>

      <section aria-labelledby="secondary-title" className="mt-[52px]">
        <div className="flex items-start justify-between gap-4">
          <h2 id="secondary-title" className="text-base leading-5 font-bold">
            Carteira secundária
          </h2>
          {!secondary && primary && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-primary focus-visible:ring-ring rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              Adicionar
            </button>
          ) : null}
        </div>

        {secondary ? (
          <div className="mt-5">
            <WalletFormView
              key={`${secondary.id}-${secondary.version}`}
              wallet={secondary}
              primary={false}
              copyFrom={primary}
              idPrefix="secondary"
              submitLabel="Salvar carteira secundária"
            />
          </div>
        ) : adding && primary ? (
          <div className="mt-5">
            <WalletFormView
              primary={false}
              copyFrom={primary}
              idPrefix="secondary"
              submitLabel="Cadastrar carteira secundária"
              onSaved={() => setAdding(false)}
            />
          </div>
        ) : (
          <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
            {primary
              ? 'Você ainda não adicionou uma carteira secundária.'
              : 'Cadastre a carteira principal para poder adicionar uma secundária.'}
          </p>
        )}
      </section>
    </>
  );
}

export function WalletsPage() {
  const wallets = useWallets();
  const logout = useLogout();

  return (
    <AccountLayout active="wallets" title="Carteiras" onSignOut={() => logout.mutate()}>
      {wallets.isPending ? (
        <WalletsSkeleton />
      ) : wallets.isError ? (
        <ErrorState
          title="Não foi possível carregar as carteiras"
          description={getErrorMessage(wallets.error)}
          onRetry={() => void wallets.refetch()}
        />
      ) : (
        <WalletsContent wallets={wallets.data} />
      )}
    </AccountLayout>
  );
}

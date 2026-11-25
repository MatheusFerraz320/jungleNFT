import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { endSession, useSession } from '@/features/auth';
import { Field, SelectInput, TextInput, controlClass } from '@/shared/components/form/form-fields';
import { networkOptions, walletTypeOptions } from '@/shared/components/form/options';
import { AccountLayout } from '@/shared/components/layout/account-layout';
import { cn } from '@/shared/lib/cn';

const walletSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
  nickname: z.string().trim().min(2, 'Informe o apelido da carteira.'),
  network: z.string().min(1, 'Selecione uma rede.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x válido (42 caracteres).'),
  secondary: z.string().trim().optional(),
  walletType: z.string().min(1, 'Selecione uma carteira.'),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z.string().trim().min(1, 'Informe o nome ENS.'),
});

type WalletForm = z.infer<typeof walletSchema>;

export function WalletsPage() {
  const session = useSession();
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { email: session?.email ?? '' },
  });

  const onSubmit = handleSubmit(() => toast.success('Carteira salva (simulação).'));

  return (
    <AccountLayout active="wallets" title="Carteiras" onSignOut={endSession}>
      <form onSubmit={onSubmit} noValidate aria-labelledby="wallet-title">
        <div className="flex items-start justify-between">
          <h1 id="wallet-title" className="text-base leading-5 font-bold">
            Carteira principal
          </h1>
          <button
            type="button"
            onClick={() =>
              toast.info('Use o formulário abaixo para cadastrar a carteira principal.')
            }
            className="text-primary focus-visible:ring-ring rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            Adicionar
          </button>
        </div>
        <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>

        <div className="mt-[28px] grid gap-x-[28px] gap-y-[25px] md:grid-cols-2">
          <Field
            label="Nome de exibição"
            htmlFor="w-displayName"
            required
            error={errors.displayName}
          >
            <TextInput
              id="w-displayName"
              register={register('displayName')}
              error={errors.displayName}
            />
          </Field>
          <Field label="Apelido da carteira" htmlFor="w-nickname" required error={errors.nickname}>
            <TextInput id="w-nickname" register={register('nickname')} error={errors.nickname} />
          </Field>
          <Field label="Rede" htmlFor="w-network" required error={errors.network}>
            <SelectInput
              id="w-network"
              register={register('network')}
              error={errors.network}
              placeholder="Selecione uma rede"
              options={networkOptions}
            />
          </Field>
          <Field label="Nome do perfil" htmlFor="w-profileName" required error={errors.profileName}>
            <TextInput
              id="w-profileName"
              register={register('profileName')}
              error={errors.profileName}
            />
          </Field>
          <Field label="Endereço da carteira" htmlFor="w-address" required error={errors.address}>
            <TextInput
              id="w-address"
              register={register('address')}
              error={errors.address}
              placeholder="Endereço 0x da carteira"
            />
          </Field>
          <Field label="Carteira secundária" htmlFor="w-secondary" hideLabel>
            <TextInput
              id="w-secondary"
              register={register('secondary')}
              placeholder="ENS ou carteira secundária (opcional)"
            />
          </Field>
          <Field label="Tipo de carteira" htmlFor="w-walletType" required error={errors.walletType}>
            <SelectInput
              id="w-walletType"
              register={register('walletType')}
              error={errors.walletType}
              placeholder="Selecione uma carteira"
              options={walletTypeOptions}
            />
          </Field>
          <Field
            label="Código de indicação"
            htmlFor="w-referralCode"
            required
            error={errors.referralCode}
          >
            <TextInput
              id="w-referralCode"
              register={register('referralCode')}
              error={errors.referralCode}
            />
          </Field>
          <Field label="E-mail" htmlFor="w-email" required error={errors.email}>
            <TextInput
              id="w-email"
              type="email"
              register={register('email')}
              error={errors.email}
            />
          </Field>
          <Field label="Nome ENS" htmlFor="w-ensName" required error={errors.ensName}>
            <div className="flex gap-2">
              <span
                className={cn(controlClass, 'flex w-[78px] shrink-0 items-center justify-between')}
              >
                .eth
                <ChevronDown aria-hidden="true" className="size-4" />
              </span>
              <TextInput
                id="w-ensName"
                register={register('ensName')}
                error={errors.ensName}
                className="min-w-0 flex-1"
              />
            </div>
          </Field>
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground focus-visible:ring-ring mt-8 h-10 rounded px-4 text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none"
        >
          Salvar carteira
        </button>

        <section aria-labelledby="secondary-title" className="mt-[52px]">
          <div className="flex items-start justify-between gap-4">
            <h2 id="secondary-title" className="text-base leading-5 font-bold">
              Carteira secundária
            </h2>
            <div className="flex items-center gap-3 text-[13px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(event) => setSameAsPrimary(event.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="border-primary peer-checked:bg-primary peer-focus-visible:ring-ring size-3.5 rounded-full border-2 peer-focus-visible:ring-2"
                />
                Igual à carteira principal
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info('Cadastro de carteira secundária disponível na etapa de integração.')
                }
                className="text-primary text-sm"
              >
                Adicionar
              </button>
            </div>
          </div>
          <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
            Você ainda não adicionou uma carteira secundária.
          </p>
        </section>
      </form>
    </AccountLayout>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { endSession, useSession } from '@/features/auth';
import { Field, PasswordInput, TextInput } from '@/shared/components/form/form-fields';
import { AccountLayout } from '@/shared/components/layout/account-layout';
import { controlClass } from '@/shared/components/form/form-fields';
import { cn } from '@/shared/lib/cn';

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
    username: z.string().trim().min(3, 'Informe um nome de usuário com 3+ caracteres.'),
    email: z.email('Informe um e-mail válido.'),
    ensName: z.string().trim().optional(),
    walletNickname: z.string().trim().min(2, 'Informe o apelido da carteira.'),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const wantsPassword = values.currentPassword || values.newPassword || values.confirmPassword;
    if (!wantsPassword) return;

    if (!values.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      });
    }
    if (!values.newPassword || values.newPassword.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'A nova senha deve ter pelo menos 8 caracteres.',
      });
    }
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não conferem.',
      });
    }
  });

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const session = useSession();
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: session?.email ?? '', displayName: session?.name ?? '' },
  });

  const onSubmit = handleSubmit(() => {
    toast.success('Dados do perfil salvos (simulação).');
  });

  function handleAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Envie um arquivo de imagem.');
      return;
    }
    setAvatar(URL.createObjectURL(file));
  }

  return (
    <AccountLayout active="profile" title="Perfil do colecionador" onSignOut={endSession}>
      <form onSubmit={onSubmit} noValidate aria-labelledby="profile-title">
        <h1 id="profile-title" className="text-base leading-5 font-bold max-sm:hidden">
          Perfil do colecionador
        </h1>

        <div className="mt-[39px] grid gap-x-7 gap-y-[31px] max-sm:mt-6 md:grid-cols-2">
          <div className="flex flex-col gap-[31px]">
            <Field
              label="Nome de exibição"
              htmlFor="displayName"
              required
              error={errors.displayName}
            >
              <TextInput
                id="displayName"
                register={register('displayName')}
                error={errors.displayName}
              />
            </Field>
            <Field label="E-mail" htmlFor="email" required error={errors.email}>
              <TextInput
                id="email"
                type="email"
                register={register('email')}
                error={errors.email}
              />
            </Field>
            <Field
              label="Apelido da carteira"
              htmlFor="walletNickname"
              required
              error={errors.walletNickname}
            >
              <TextInput
                id="walletNickname"
                register={register('walletNickname')}
                error={errors.walletNickname}
              />
            </Field>

            <section aria-labelledby="password-title" className="mt-[3px] flex flex-col gap-[27px]">
              <h2 id="password-title" className="text-base leading-5 font-bold">
                Alterar senha
              </h2>
              <Field label="Senha atual" htmlFor="currentPassword" error={errors.currentPassword}>
                <PasswordInput
                  id="currentPassword"
                  register={register('currentPassword')}
                  error={errors.currentPassword}
                />
              </Field>
              <Field label="Nova senha" htmlFor="newPassword" error={errors.newPassword}>
                <PasswordInput
                  id="newPassword"
                  register={register('newPassword')}
                  error={errors.newPassword}
                />
              </Field>
              <Field
                label="Confirmar nova senha"
                htmlFor="confirmPassword"
                error={errors.confirmPassword}
              >
                <PasswordInput
                  id="confirmPassword"
                  register={register('confirmPassword')}
                  error={errors.confirmPassword}
                />
              </Field>
              <button
                type="submit"
                className="bg-primary text-primary-foreground focus-visible:ring-ring mt-[3px] h-10 w-[100px] rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none"
              >
                Salvar
              </button>
            </section>
          </div>

          <div className="flex flex-col gap-[31px]">
            <Field label="Nome de usuário" htmlFor="username" required error={errors.username}>
              <TextInput id="username" register={register('username')} error={errors.username} />
            </Field>
            <Field label="Nome ENS" htmlFor="ensName" required>
              <div className="flex gap-2">
                <span
                  className={cn(
                    controlClass,
                    'flex w-[78px] shrink-0 items-center justify-between',
                  )}
                >
                  .eth
                  <ChevronDown aria-hidden="true" className="size-4" />
                </span>
                <TextInput id="ensName" register={register('ensName')} className="min-w-0 flex-1" />
              </div>
            </Field>

            <div role="group" aria-labelledby="avatar-label">
              <p id="avatar-label" className="mb-3 text-[15px] leading-4">
                Avatar
              </p>
              <div className="flex items-center gap-6">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar atual"
                    className="size-[50px] rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="border-line text-primary grid size-[50px] place-items-center rounded-full border bg-[#2a1a14]"
                  >
                    <ImageIcon className="size-5" />
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Selecionar imagem de avatar"
                  onChange={(event) => handleAvatar(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="bg-primary text-primary-foreground focus-visible:ring-ring h-10 w-[98px] rounded text-sm font-bold focus-visible:ring-2 focus-visible:outline-none"
                >
                  Alterar
                </button>
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="focus-visible:ring-ring rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AccountLayout>
  );
}

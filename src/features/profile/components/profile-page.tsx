import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useLogout } from '@/features/auth';
import { applyApiErrors } from '@/shared/api/form-errors';
import { getErrorMessage } from '@/shared/api/errors';
import { ErrorState } from '@/shared/components/feedback/empty-error-states';
import {
  Field,
  PasswordInput,
  TextInput,
  controlClass,
} from '@/shared/components/form/form-fields';
import { AccountLayout } from '@/shared/components/layout/account-layout';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { User } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import { resizeToAvatar } from '@/shared/lib/image';
import { useChangePassword, useProfile, useUpdateProfile } from '../hooks/use-profile';

const PLACEHOLDER_AVATAR = '/assets/avatar-placeholder.svg';

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
    username: z.string().trim().min(3, 'Informe um nome de usuário com 3+ caracteres.'),
    email: z.email('Informe um e-mail válido.'),
    ensName: z.string().trim().max(60, 'Use até 60 caracteres.').optional(),
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

function ProfileFormView({ user }: { user: User }) {
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.name,
      email: user.email,
      username: user.username ?? '',
      ensName: user.ensName ?? '',
      walletNickname: user.walletNickname ?? '',
    },
  });

  const currentAvatar = avatar ?? user.avatarUrl;
  const hasAvatar = currentAvatar !== PLACEHOLDER_AVATAR;
  const saving = updateProfile.isPending || changePassword.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await updateProfile.mutateAsync({
        name: values.displayName,
        email: values.email,
        username: values.username,
        ensName: values.ensName || undefined,
        walletNickname: values.walletNickname,
        avatarUrl: avatar,
      });
    } catch (error) {
      setFormError(
        applyApiErrors(error, setError, ['email', 'username', 'walletNickname'], {
          name: 'displayName',
        }),
      );
      return;
    }

    if (values.currentPassword && values.newPassword) {
      try {
        await changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      } catch (error) {
        setFormError(applyApiErrors(error, setError, ['currentPassword', 'newPassword']));
        return;
      }
    }

    setAvatar(undefined);
    reset({
      ...values,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    toast.success('Perfil salvo.');
  });

  async function handleAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Envie um arquivo de imagem (PNG, JPG ou WebP).');
      return;
    }
    try {
      setAvatar(await resizeToAvatar(file));
    } catch {
      toast.error('Não foi possível processar a imagem.');
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-base leading-5 font-bold max-sm:hidden">
        Perfil do colecionador
      </h1>

      <div className="mt-[39px] grid gap-x-7 gap-y-[31px] max-sm:mt-6 md:grid-cols-2">
        <div className="flex flex-col gap-[31px]">
          <Field label="Nome de exibição" htmlFor="displayName" required error={errors.displayName}>
            <TextInput
              id="displayName"
              register={register('displayName')}
              error={errors.displayName}
            />
          </Field>
          <Field label="E-mail" htmlFor="email" required error={errors.email}>
            <TextInput id="email" type="email" register={register('email')} error={errors.email} />
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

            {formError ? (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground focus-visible:ring-ring mt-[3px] h-10 w-[100px] rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-[31px]">
          <Field label="Nome de usuário" htmlFor="username" required error={errors.username}>
            <TextInput id="username" register={register('username')} error={errors.username} />
          </Field>
          <Field label="Nome ENS" htmlFor="ensName" error={errors.ensName}>
            <div className="flex gap-2">
              <span
                className={cn(controlClass, 'flex w-[78px] shrink-0 items-center justify-between')}
              >
                .eth
                <ChevronDown aria-hidden="true" className="size-4" />
              </span>
              <TextInput
                id="ensName"
                register={register('ensName')}
                error={errors.ensName}
                className="min-w-0 flex-1"
              />
            </div>
          </Field>

          <div role="group" aria-labelledby="avatar-label">
            <p id="avatar-label" className="mb-3 text-[15px] leading-4">
              Avatar
            </p>
            <div className="flex items-center gap-6">
              {hasAvatar ? (
                <img
                  src={currentAvatar}
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
                onChange={(event) => void handleAvatar(event.target.files?.[0])}
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
                onClick={() => setAvatar(PLACEHOLDER_AVATAR)}
                className="focus-visible:ring-ring rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                Remover
              </button>
            </div>
            {avatar ? (
              <p role="status" className="text-muted-foreground mt-2 text-xs">
                Alteração pendente: clique em Salvar para confirmar.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}

function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando perfil"
      aria-busy="true"
      className="mt-10 grid gap-6 md:grid-cols-2"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="skeleton-shimmer h-16 w-full" />
      ))}
    </div>
  );
}

export function ProfilePage() {
  const profile = useProfile();
  const logout = useLogout();

  return (
    <AccountLayout
      active="profile"
      title="Perfil do colecionador"
      onSignOut={() => logout.mutate()}
    >
      {profile.isPending ? (
        <ProfileSkeleton />
      ) : profile.isError ? (
        <ErrorState
          title="Não foi possível carregar o perfil"
          description={getErrorMessage(profile.error)}
          onRetry={() => void profile.refetch()}
        />
      ) : (
        <ProfileFormView user={profile.data} />
      )}
    </AccountLayout>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { HomePage } from '@/features/catalog';
import { PasswordInput, TextInput } from '@/shared/components/form/form-fields';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/lib/cn';
import { startSession } from '../store/session-store';

type AuthMode = 'login' | 'register';

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe um nome de usuário com 2+ caracteres.'),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  });

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.28a12 12 0 0 0 0 10.8l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.87 8.88 4.76 12 4.76Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-[#3b5999]">
      <path d="M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.6C11.4 2 10 3.7 10 6v2H7.5v3H10v11h4V11h2.8l.4-3H14Z" />
    </svg>
  );
}

function SocialButtons({ className }: { className?: string }) {
  const unavailable = () =>
    toast.info('Login social indisponível na simulação. Use e-mail e senha.');
  const base =
    'border-line text-muted-foreground focus-visible:ring-ring flex h-10 w-full items-center justify-center gap-3 rounded border text-[13px] font-medium focus-visible:ring-2 focus-visible:outline-none';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <button type="button" onClick={unavailable} className={base}>
        <GoogleIcon />
        Continuar com Google
      </button>
      <button type="button" onClick={unavailable} className={base}>
        <FacebookIcon />
        Continuar com Facebook
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative mt-[22px] flex items-center justify-center max-sm:mt-6">
      <span className="border-line absolute inset-x-0 border-t sm:-mx-0" />
      <span className="bg-card max-sm:bg-background relative px-3 text-[13px]">
        Ou continue com
      </span>
    </div>
  );
}

function AuthForm({ mode, redirectTo }: { mode: AuthMode; redirectTo?: string }) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';
  const login = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const register = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  function finish(name: string, email: string) {
    startSession({ name, email });
    toast.success(isLogin ? 'Login realizado.' : 'Conta criada.');
    void navigate({ to: redirectTo && redirectTo.startsWith('/') ? redirectTo : '/' });
  }

  const submitLogin = login.handleSubmit((values) =>
    finish(values.email.split('@')[0] ?? 'Colecionador', values.email),
  );
  const submitRegister = register.handleSubmit((values) => finish(values.name, values.email));

  const mobile = 'max-sm:h-[50px] max-sm:rounded-[12px] max-sm:px-4';

  return (
    <form
      onSubmit={isLogin ? submitLogin : submitRegister}
      noValidate
      aria-label={isLogin ? 'Entrar' : 'Criar conta'}
      className="flex flex-col gap-3"
    >
      {isLogin ? (
        <>
          <div>
            <label htmlFor="login-email" className="sr-only">
              E-mail
            </label>
            <TextInput
              id="login-email"
              type="email"
              placeholder="contato@email.com"
              register={login.register('email')}
              error={login.formState.errors.email}
              className={mobile}
            />
            {login.formState.errors.email ? (
              <p id="login-email-error" role="alert" className="text-destructive mt-1 text-xs">
                {login.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="login-password" className="sr-only">
              Senha
            </label>
            <PasswordInput
              id="login-password"
              placeholder="Senha"
              register={login.register('password')}
              error={login.formState.errors.password}
              className={mobile}
            />
            {login.formState.errors.password ? (
              <p id="login-password-error" role="alert" className="text-destructive mt-1 text-xs">
                {login.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => toast.info('Recuperação de senha indisponível na simulação.')}
            className="text-primary focus-visible:ring-ring -mt-1 ml-auto rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            Esqueceu a senha?
          </button>
        </>
      ) : (
        <>
          {(
            [
              ['name', 'Nome de usuário', 'text'],
              ['email', 'Digite seu e-mail', 'email'],
            ] as const
          ).map(([field, placeholder, type]) => (
            <div key={field}>
              <label htmlFor={`register-${field}`} className="sr-only">
                {placeholder}
              </label>
              <TextInput
                id={`register-${field}`}
                type={type}
                placeholder={placeholder}
                register={register.register(field)}
                error={register.formState.errors[field]}
                className={mobile}
              />
              {register.formState.errors[field] ? (
                <p
                  id={`register-${field}-error`}
                  role="alert"
                  className="text-destructive mt-1 text-xs"
                >
                  {register.formState.errors[field]?.message}
                </p>
              ) : null}
            </div>
          ))}
          {(
            [
              ['password', 'Senha'],
              ['confirmPassword', 'Confirmar senha'],
            ] as const
          ).map(([field, placeholder]) => (
            <div key={field}>
              <label htmlFor={`register-${field}`} className="sr-only">
                {placeholder}
              </label>
              <PasswordInput
                id={`register-${field}`}
                placeholder={placeholder}
                register={register.register(field)}
                error={register.formState.errors[field]}
                className={mobile}
              />
              {register.formState.errors[field] ? (
                <p
                  id={`register-${field}-error`}
                  role="alert"
                  className="text-destructive mt-1 text-xs"
                >
                  {register.formState.errors[field]?.message}
                </p>
              ) : null}
            </div>
          ))}
        </>
      )}

      <button
        type="submit"
        className={cn(
          'bg-primary text-primary-foreground focus-visible:ring-ring h-11 w-full rounded text-base font-bold focus-visible:ring-2 focus-visible:outline-none',
          isLogin ? 'mt-3' : 'mt-3.5',
          'max-sm:mt-5 max-sm:h-[60px] max-sm:rounded-[12px]',
        )}
      >
        {isLogin ? 'Entrar' : 'Criar conta'}
      </button>
    </form>
  );
}

function ModeTabs({ mode, redirectTo }: { mode: AuthMode; redirectTo?: string }) {
  const search = redirectTo ? { redirect: redirectTo } : {};

  return (
    <div className="flex items-center justify-center text-xl leading-7 font-bold">
      <Link
        to="/login"
        search={search}
        aria-current={mode === 'login' ? 'page' : undefined}
        className={cn(
          'focus-visible:ring-ring rounded-sm pr-2 focus-visible:ring-2 focus-visible:outline-none',
          mode === 'login' && 'text-primary',
        )}
      >
        Entrar
      </Link>
      <span aria-hidden="true" className="bg-primary h-5 w-px" />
      <Link
        to="/cadastro"
        search={search}
        aria-current={mode === 'register' ? 'page' : undefined}
        className={cn(
          'focus-visible:ring-ring rounded-sm pl-2 focus-visible:ring-2 focus-visible:outline-none',
          mode === 'register' && 'text-primary',
        )}
      >
        Criar conta
      </Link>
    </div>
  );
}

function AuthDialog({ mode, redirectTo }: { mode: AuthMode; redirectTo?: string }) {
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) void navigate({ to: '/' });
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
        <DialogPrimitive.Content
          aria-describedby="auth-description"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document
              .getElementById(isLogin ? 'login-email' : 'register-name')
              ?.focus({ preventScroll: true });
          }}
          className="bg-card border-b-primary fixed top-[160px] left-1/2 z-50 w-[500px] -translate-x-1/2 border-b-[10px] px-[80px] pt-[42px] pb-[83px] shadow-[0_0_20px_#0a060473] focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="text-primary focus-visible:ring-ring absolute top-[17px] right-[17px] grid size-6 place-items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </DialogPrimitive.Close>

          <ModeTabs mode={mode} redirectTo={redirectTo} />
          <p
            id="auth-description"
            className="mx-auto mt-[31px] mb-[28px] max-w-[406px] text-center text-[13px] leading-4"
          >
            {isLogin
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </p>

          <AuthForm mode={mode} redirectTo={redirectTo} />
          <div className="-mx-[80px]">
            <Divider />
          </div>
          <SocialButtons className="mt-5" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function AuthMobile({ mode, redirectTo }: { mode: AuthMode; redirectTo?: string }) {
  const isLogin = mode === 'login';

  return (
    <main className="flex-1 px-7 pt-[128px] pb-10 sm:hidden">
      <p className="text-center text-[32px] leading-10 font-bold tracking-[0.15em]">KURIO</p>
      <h1 className="mt-[84px] mb-[34px] text-center text-xl leading-7 font-bold">
        {isLogin ? 'Entrar' : 'Criar perfil de colecionador'}
      </h1>
      <AuthForm mode={mode} redirectTo={redirectTo} />
      <Divider />
      <SocialButtons className="mt-5 [&>button]:gap-3" />
      <p className="text-muted-foreground mt-10 text-center text-base">
        {isLogin ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
        <Link
          to={isLogin ? '/cadastro' : '/login'}
          search={redirectTo ? { redirect: redirectTo } : {}}
          className="hover:text-primary"
        >
          {isLogin ? 'Crie uma conta' : 'Entre'}
        </Link>
      </p>
    </main>
  );
}

export function AuthScreen({ mode, redirectTo }: { mode: AuthMode; redirectTo?: string }) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  return (
    <>
      <div className="flex-1 max-sm:hidden" inert aria-hidden="true">
        <HomePage />
      </div>
      {isDesktop ? <AuthDialog mode={mode} redirectTo={redirectTo} /> : null}
      <AuthMobile mode={mode} redirectTo={redirectTo} />
    </>
  );
}

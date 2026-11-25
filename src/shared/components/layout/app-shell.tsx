import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Facebook,
  Heart,
  House,
  Instagram,
  Linkedin,
  ScanLine,
  Twitter,
  UserRound,
  Youtube,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
  FigmaCartIcon,
  FigmaLogoutIcon,
  FigmaSearchIcon,
} from '@/shared/components/icons/figma-icons';
import { cn } from '@/shared/lib/cn';
import { useRealtime } from '@/shared/realtime';
import { Container } from './container';

const navItems = [
  { label: 'Início', hash: undefined },
  { label: 'Mercado', hash: 'catalogo' },
  { label: 'Criadores', hash: 'criadores' },
  { label: 'Aprenda', hash: 'diario' },
] as const;

export function SearchDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();

    setOpen(false);
    setTerm('');
    void navigate({ to: '/', search: { q: query || undefined } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            aria-label="Explorar coleções"
            className="mt-1.5 h-[22px] w-[22px] rounded-sm p-0 hover:bg-transparent"
          >
            <FigmaSearchIcon className="-m-[3px] size-[28px]" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Encontre obras por nome ou coleção.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="nft-search" className="sr-only">
            Nome ou coleção
          </label>
          <Input
            id="nft-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Emerald Ape"
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppHeader({
  cartCount = 0,
  sessionName,
}: {
  cartCount?: number;
  sessionName?: string | null;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const showLine = ['/', '/login', '/cadastro', '/perfil', '/carteiras'].includes(pathname);

  return (
    <header className="bg-background sticky top-0 z-40 hidden sm:block">
      <Container>
        <div
          className={cn(
            'relative flex h-[68px] items-start border-b border-transparent pt-6',
            showLine && 'border-line',
          )}
        >
          <Link
            to="/"
            className="focus-visible:ring-ring mt-2 rounded-sm text-sm leading-[18.5px] font-bold tracking-[1.4px] focus-visible:ring-2 focus-visible:outline-none"
          >
            KURIO
          </Link>

          <nav
            aria-label="Navegação principal"
            className="ml-8 hidden h-11 items-start gap-10 md:flex lg:ml-[327px]"
          >
            {navItems.map((item) => {
              const active =
                item.label === 'Início'
                  ? pathname === '/'
                  : item.label === 'Mercado'
                    ? pathname !== '/'
                    : false;

              return (
                <Link
                  key={item.label}
                  to="/"
                  hash={item.hash}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'hover:text-primary flex h-11 items-start border-b-2 border-transparent pt-0.5 text-base leading-[21px] transition-colors',
                    active && 'border-primary text-primary font-bold',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-start gap-[25px]">
            <SearchDialog />
            <Link
              to="/carrinho"
              aria-label={`Abrir carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
              className="focus-visible:ring-ring relative mt-0.5 block h-[30px] w-[30px] rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <FigmaCartIcon className="size-[30px]" />
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground absolute top-[3px] left-4 grid size-4 place-items-center rounded-full text-[10px] leading-none font-medium"
              >
                {cartCount}
              </span>
            </Link>
            <Link
              to={sessionName ? '/perfil' : '/login'}
              className="bg-primary text-primary-foreground focus-visible:ring-ring ml-[5px] inline-flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md text-base leading-[21px] font-medium focus-visible:ring-2 focus-visible:outline-none"
            >
              {sessionName ? (
                <span className="truncate px-2">{sessionName}</span>
              ) : (
                <>
                  <FigmaLogoutIcon className="size-5" />
                  Entrar
                </>
              )}
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== '/') return null;

  const itemClass =
    'text-muted-foreground hover:text-primary focus-visible:ring-ring flex size-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none';

  return (
    <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
      <div className="relative mx-auto h-24 max-w-[414px]">
        <div
          aria-hidden="true"
          className="bg-card absolute inset-0 rounded-t-[40px] [mask-image:radial-gradient(circle_46px_at_50%_0,transparent_97%,#000_100%)] shadow-[0_-10px_30px_#0a060473]"
        />
        <div className="relative h-full">
          <Link
            to="/"
            aria-label="Início"
            aria-current="page"
            className={cn(itemClass, 'text-primary absolute top-[27px] left-[24px]')}
          >
            <House aria-hidden="true" className="size-6 fill-current" />
          </Link>
          <button
            type="button"
            aria-label="Favoritos"
            className={cn(itemClass, 'absolute top-[27px] left-[96px]')}
            onClick={() => toast.info('Seus favoritos serão implementados na próxima etapa.')}
          >
            <Heart aria-hidden="true" className="size-6 fill-current" />
          </button>
          <button
            type="button"
            aria-label="Ler QR Code"
            className="text-foreground focus-visible:ring-ring absolute top-[-30px] left-1/2 grid size-[65px] -translate-x-1/2 place-items-center rounded-full bg-[linear-gradient(135deg,#8d5e35,#d28a4c)] focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => toast.info('A leitura de QR Code será implementada na próxima etapa.')}
          >
            <ScanLine aria-hidden="true" className="size-8" />
          </button>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className={cn(itemClass, 'absolute top-[27px] right-[62px]')}
          >
            <FigmaCartIcon className="size-6" />
          </Link>
          <button
            type="button"
            aria-label="Perfil"
            className={cn(itemClass, 'absolute top-[27px] right-[20px]')}
            onClick={() => toast.info('O perfil será implementado na próxima etapa.')}
          >
            <UserRound aria-hidden="true" className="size-6 fill-current" />
          </button>
        </div>
      </div>
    </nav>
  );
}

const footerFeatures = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const;

const profileLinks = [
  'Meu perfil',
  'Minha coleção',
  'Atividade',
  'Estúdio do criador',
  'Lista de interesse',
];
const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
];
const collectionLinks = [
  { label: 'Arte digital', category: 'art' },
  { label: 'Fotografia', category: 'photography' },
  { label: 'Música', category: 'music' },
  { label: 'Arte 3D', category: 'art-3d' },
  { label: 'Utilidade', category: 'utility' },
] as const;

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'Twitter', href: 'https://twitter.com', Icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com', Icon: Youtube },
] as const;

export function AppFooter({ className }: { className?: string }) {
  const [email, setEmail] = useState('');
  const realtime = useRealtime();
  const connected = realtime.status === 'connected';

  function handleNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmail('');
    toast.success('Inscrição registrada na simulação.');
  }

  const columnTitle = 'text-[18px] leading-[18px] font-bold';
  const linkClass = 'text-[14px] leading-[30px] text-foreground';

  return (
    <footer className={cn('mt-24 pb-24 sm:pb-0', className)}>
      <Container>
        <div className="bg-card">
          <div className="grid gap-y-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-[297px_266px_266px_1fr] lg:gap-0 lg:p-0 lg:pt-8 lg:pb-4">
            {footerFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'lg:h-[202px]',
                  index === 0 ? 'lg:pl-12' : 'border-primary lg:border-l lg:pl-[17px]',
                )}
              >
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-foreground grid size-[74px] place-items-center rounded-full text-2xl font-bold"
                >
                  {feature.letter}
                </span>
                <h2 className="mt-[13px] text-[17px] leading-4 font-bold">{feature.title}</h2>
                <p className="text-muted-foreground mt-[11px] max-w-[200px] text-sm leading-[22px]">
                  {feature.description}
                </p>
              </div>
            ))}

            <div className="border-primary lg:h-[202px] lg:border-l lg:pl-4">
              <h2 className="text-[18px] leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
              <form onSubmit={handleNewsletter} className="mt-[15px] flex w-fit max-w-full">
                <label htmlFor="newsletter-email" className="sr-only">
                  Seu e-mail
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="digite seu e-mail..."
                  className="focus-visible:ring-ring h-10 w-[240px] min-w-0 rounded-l bg-[#3f2319] px-3 text-sm placeholder:text-[#b39463] focus-visible:ring-2 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground focus-visible:ring-ring h-10 w-[85px] shrink-0 rounded-r text-[18px] font-bold focus-visible:ring-2 focus-visible:outline-none"
                >
                  Enviar
                </button>
              </form>
              <p className="text-muted-foreground mt-3 max-w-[325px] text-[13px] leading-[22px]">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </div>
          </div>

          <div className="grid h-auto gap-4 bg-[#38220f] px-8 py-6 sm:grid-cols-2 lg:h-[88px] lg:grid-cols-[repeat(4,227px)] lg:gap-x-[76px] lg:py-0">
            <span className="self-center text-sm leading-[18.5px] font-bold tracking-[1.4px]">
              KURIO
            </span>
            <span className="max-w-[230px] self-center text-sm leading-[22px]">
              Feito para colecionadores, criadores e cultura
            </span>
            <span className="self-center text-sm leading-[22px]">contato@email.com</span>
            <span className="self-center text-sm leading-[22px]">+55 11 4002 8922</span>
          </div>

          <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-[repeat(4,227px)] lg:gap-x-[76px] lg:pt-[31px] lg:pb-[30px]">
            <nav aria-labelledby="footer-profile-title">
              <h2 id="footer-profile-title" className={columnTitle}>
                Meu perfil
              </h2>
              <ul className="mt-[7px]">
                {profileLinks.map((label) => (
                  <li key={label}>
                    <span className={linkClass}>{label}</span>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-help-title">
              <h2 id="footer-help-title" className={columnTitle}>
                Central de ajuda
              </h2>
              <ul className="mt-[7px]">
                {helpLinks.map((label) => (
                  <li key={label}>
                    <span className={linkClass}>{label}</span>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-collections-title">
              <h2 id="footer-collections-title" className={columnTitle}>
                Coleções
              </h2>
              <ul className="mt-[7px]">
                {collectionLinks.map((item) => (
                  <li key={item.category}>
                    <Link
                      to="/"
                      search={{ categories: [item.category] }}
                      className={cn(linkClass, 'hover:text-primary transition-colors')}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className={columnTitle}>Redes sociais</h2>
              <ul className="mt-[18px] flex gap-2">
                {socialLinks.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="border-primary text-primary hover:bg-secondary focus-visible:ring-ring grid size-8 place-items-center rounded-[3px] border transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Icon aria-hidden="true" className="size-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>

              <h2 className={cn(columnTitle, 'mt-[30px]')}>Carteiras compatíveis</h2>
              <div className="border-primary/40 text-primary mt-[19px] flex h-[26px] w-[228px] items-center justify-center gap-2 rounded border bg-[#3f2319] text-[9px] leading-[11.9px] font-bold tracking-[0.1px] whitespace-nowrap">
                {['METAMASK', 'WALLETCONNECT', 'COINBASE'].map((wallet, index) => (
                  <span key={wallet} className="flex items-center gap-2">
                    {index > 0 ? <span aria-hidden="true">•</span> : null}
                    {wallet}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="pt-3 pb-9 text-center text-sm leading-5">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
        <p className="sr-only" aria-live="polite">
          <span data-testid="socket-status">
            {connected ? 'Tempo real conectado' : `Tempo real ${realtime.status}`}
          </span>
        </p>
      </Container>
    </footer>
  );
}

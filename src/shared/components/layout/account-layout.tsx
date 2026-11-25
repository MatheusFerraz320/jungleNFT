import { Link, useNavigate } from '@tanstack/react-router';
import {
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import { Container } from './container';
import { MobileTopBar } from './mobile-top-bar';

type AccountSection = 'profile' | 'wallets';

const items: {
  label: string;
  Icon: LucideIcon;
  to?: '/perfil' | '/carteiras';
  section?: AccountSection;
}[] = [
  { label: 'Dados do perfil', Icon: User, to: '/perfil', section: 'profile' },
  { label: 'Carteiras', Icon: MapPin, to: '/carteiras', section: 'wallets' },
  { label: 'Atividade', Icon: ShoppingCart },
  { label: 'Lista de interesse', Icon: Heart },
  { label: 'Ofertas', Icon: TrendingUp },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: TriangleAlert },
];

interface AccountLayoutProps {
  active: AccountSection;
  title: string;
  onSignOut: () => void;
  children: ReactNode;
}

export function AccountLayout({ active, title, onSignOut, children }: AccountLayoutProps) {
  const navigate = useNavigate();
  const rowClass =
    'text-primary focus-visible:ring-ring flex h-[45px] w-full items-center gap-3 px-4 text-left text-[15px] focus-visible:ring-2 focus-visible:outline-none';

  function signOut() {
    onSignOut();
    void navigate({ to: '/' });
  }

  return (
    <main className="flex-1 pb-10">
      <Container className="pt-8 max-sm:px-0 max-sm:pt-0">
        <MobileTopBar title={title} />
        <div className="grid gap-8 max-sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-[28px]">
          <aside aria-label="Menu da conta" className="bg-card self-start">
            <p className="px-[10px] pt-[17px] pb-[2px] text-lg leading-[22px] font-bold max-sm:hidden">
              Meu perfil
            </p>
            <nav>
              <ul>
                {items.map(({ label, Icon, to, section }) => (
                  <li key={label}>
                    {to ? (
                      <Link
                        to={to}
                        aria-current={section === active ? 'page' : undefined}
                        className={cn(
                          rowClass,
                          'border-l-[6px] border-transparent',
                          section === active && 'border-primary',
                        )}
                      >
                        <Icon aria-hidden="true" className="size-[18px]" />
                        {label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toast.info(`${label} não faz parte desta entrega.`)}
                        className={cn(rowClass, 'border-l-[6px] border-transparent')}
                      >
                        <Icon aria-hidden="true" className="size-[18px]" />
                        {label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-line border-t">
                <button type="button" onClick={signOut} className={cn(rowClass, 'font-bold')}>
                  <LogOut aria-hidden="true" className="size-[18px]" />
                  Sair
                </button>
              </div>
            </nav>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </main>
  );
}

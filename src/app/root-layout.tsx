import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useSession } from '@/features/auth';
import { useCart } from '@/features/cart';
import { AppFooter, AppHeader, MobileBottomNav } from '@/shared/components/layout/app-shell';
import { AppProviders } from './providers';

export function RootLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cartCount = useCart().count;
  const session = useSession();
  const isReceipt = pathname.startsWith('/pedido');
  const mobileFooter = pathname === '/' || pathname.startsWith('/nft');

  return (
    <AppProviders>
      <div className="flex min-h-screen flex-col">
        {isReceipt ? null : <AppHeader cartCount={cartCount} sessionName={session?.name} />}
        {children}
        {isReceipt ? null : <AppFooter className={mobileFooter ? undefined : 'max-sm:hidden'} />}
        <MobileBottomNav />
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </div>
    </AppProviders>
  );
}

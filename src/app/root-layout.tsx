import type { ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SessionWatcher, useCurrentUser } from '@/features/auth';
import { useCartCount } from '@/features/cart';
import { FavoritesProvider } from '@/features/favorites';
import { AppFooter, AppHeader, MobileBottomNav } from '@/shared/components/layout/app-shell';
import { AppProviders } from './providers';

function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cartCount = useCartCount();
  const user = useCurrentUser();
  const isReceipt = pathname.startsWith('/pedido');
  const mobileFooter = pathname === '/' || pathname.startsWith('/nft');

  return (
    <div className="flex min-h-screen flex-col">
      <SessionWatcher />
      {isReceipt ? null : <AppHeader cartCount={cartCount} sessionName={user?.name} />}
      {children}
      {isReceipt ? null : <AppFooter className={mobileFooter ? undefined : 'max-sm:hidden'} />}
      <MobileBottomNav />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <FavoritesProvider>
        <Shell>{children}</Shell>
      </FavoritesProvider>
    </AppProviders>
  );
}

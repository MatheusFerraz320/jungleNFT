import type { ReactNode } from 'react';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppFooter, AppHeader, MobileBottomNav } from '@/shared/components/layout/app-shell';
import { AppProviders } from './providers';

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        {children}
        <AppFooter />
        <MobileBottomNav />
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </div>
    </AppProviders>
  );
}

import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { RootLayout } from '@/app/root-layout';
import { NotFoundPage } from '@/shared/components/layout/not-found-page';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'JungleNFT — Marketplace de NFTs' },
      { name: 'description', content: 'Marketplace de NFTs com dados e pagamentos simulados.' },
    ],
  }),
  component: () => (
    <RootLayout>
      <Outlet />
      <HeadContent />
      <Scripts />
    </RootLayout>
  ),
  notFoundComponent: NotFoundPage,
});

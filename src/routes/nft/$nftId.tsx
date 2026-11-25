import { createFileRoute } from '@tanstack/react-router';
import { NftDetailPage } from '@/features/nft';

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailRoute,
});

function NftDetailRoute() {
  const { nftId } = Route.useParams();

  return <NftDetailPage nftId={nftId} />;
}

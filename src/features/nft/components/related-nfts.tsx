import { useNftList } from '@/features/catalog';
import type { NftDetail } from '@/shared/contracts';
import { NftRail } from '@/shared/components/nft/nft-rail';

export function RelatedNfts({ nft }: { nft: NftDetail }) {
  const related = useNftList({
    collectionId: nft.collectionId,
    excludeId: nft.id,
    pageSize: 5,
  });

  const items = related.data?.items ?? [];

  if (related.isSuccess && items.length === 0) return null;
  if (related.isError) return null;

  return (
    <NftRail
      id="related-title"
      title="Mais desta coleção"
      items={items}
      isPending={related.isPending}
    />
  );
}

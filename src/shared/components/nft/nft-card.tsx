import { Link } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import type { NftSummary } from '@/shared/contracts';
import { useFavoriteControls } from '@/shared/hooks/favorites-context';
import { cn } from '@/shared/lib/cn';
import { ethLabel } from '@/shared/lib/eth-label';
import { rarityBadgeLabel } from '@/shared/lib/nft-labels';

interface NftCardProps {
  nft: NftSummary;
  className?: string;
  /** Posição visual usada no grid escalonado do mobile. */
  stagger?: boolean;
  /** Variante das faixas ("Mais desta coleção"): nome e preço mais próximos, como no Figma. */
  compact?: boolean;
}

export function NftCard({ nft, className, stagger, compact }: NftCardProps) {
  const { isFavorite, toggle } = useFavoriteControls();
  const favorite = isFavorite(nft.id);
  const soldOut = nft.availableEditions === 0;
  const rarityLabel = rarityBadgeLabel[nft.rarity];

  return (
    <article className={cn('group relative', stagger && 'max-sm:even:translate-y-8', className)}>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="focus-visible:ring-ring block rounded-[24px] focus-visible:ring-2 focus-visible:outline-none sm:rounded-none"
      >
        <div className="bg-card relative flex aspect-[175/200] w-full items-center justify-center rounded-[24px] sm:aspect-[258/300] sm:rounded-none">
          <img
            src={nft.imageUrl}
            alt={`${nft.name}, da coleção ${nft.collectionName}`}
            width={500}
            height={500}
            loading="lazy"
            decoding="async"
            className={cn(
              'aspect-square w-[calc(100%-8px)] rounded-[16px] object-cover sm:rounded-[20px]',
              soldOut && 'opacity-60',
            )}
          />
          {soldOut ? (
            <span className="bg-background/90 text-foreground absolute top-4 left-0 flex h-8 min-w-[68px] items-center px-2 text-sm font-medium uppercase sm:hidden">
              Esgotado
            </span>
          ) : rarityLabel ? (
            <span className="bg-primary text-primary-foreground absolute top-4 left-0 flex h-8 min-w-[68px] items-center px-2 text-sm font-medium sm:hidden">
              {rarityLabel}
            </span>
          ) : null}
        </div>
        <h3
          className={cn(
            'mt-3 truncate text-base leading-4 max-sm:mt-4 max-sm:px-2',
            compact && 'sm:mt-4',
          )}
        >
          {nft.name}
        </h3>
        <p
          className={cn(
            'text-primary mt-3 text-base leading-[18px] font-bold max-sm:px-2 sm:text-[18px]',
            compact && 'sm:mt-0.5 sm:text-base',
          )}
        >
          {ethLabel(nft.priceEth)}
          {nft.originalPriceEth ? (
            <span className="text-muted-foreground ml-3 font-normal max-sm:hidden">
              <span className="sr-only">Preço anterior: </span>
              {ethLabel(nft.originalPriceEth)}
            </span>
          ) : null}
        </p>
      </Link>

      <button
        type="button"
        aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        aria-pressed={favorite}
        onClick={() => toggle(nft.id)}
        className={cn(
          'border-border bg-background/80 hover:bg-secondary focus-visible:ring-ring absolute top-4 right-3 grid size-7 place-items-center rounded-full border backdrop-blur transition focus-visible:ring-2 focus-visible:outline-none max-sm:opacity-100 sm:top-3 sm:size-9 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
          favorite ? 'text-primary opacity-100' : 'text-foreground',
        )}
      >
        <Heart aria-hidden="true" className={cn('size-4', favorite && 'fill-current')} />
      </button>
    </article>
  );
}

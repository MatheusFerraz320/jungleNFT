import type { NftSummary } from '@/shared/contracts';
import { NftCard } from '@/shared/components/nft/nft-card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/cn';

interface NftRailProps {
  id: string;
  title: string;
  items: NftSummary[];
  isPending?: boolean;
  className?: string;
}

const gridClass =
  'mt-[30px] grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-[26px]';

/** Faixa "Mais desta coleção" / "Colecionadores também viram" (5 cards + indicador). */
export function NftRail({ id, title, items, isPending, className }: NftRailProps) {
  return (
    <section aria-labelledby={id} className={cn('mt-[95px]', className)}>
      <h2
        id={id}
        className="text-primary border-line border-b pb-1.5 text-[17px] leading-[22px] font-bold"
      >
        {title}
      </h2>

      {isPending ? (
        <div className={gridClass}>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <Skeleton className="skeleton-shimmer aspect-[258/300] w-full rounded-none" />
              <Skeleton className="skeleton-shimmer mt-3 h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={gridClass}>
            {items.map((item) => (
              <NftCard key={item.id} nft={item} compact />
            ))}
          </div>
          <div aria-hidden="true" className="mt-8 flex justify-center gap-2">
            <span className="border-primary size-3 rounded-full border" />
            <span className="border-primary bg-primary size-3 rounded-full border" />
            <span className="border-primary size-3 rounded-full border" />
          </div>
        </>
      )}
    </section>
  );
}

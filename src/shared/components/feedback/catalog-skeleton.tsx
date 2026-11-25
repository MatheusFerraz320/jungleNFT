import { Skeleton } from '@/shared/components/ui/skeleton';

export function CatalogSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando catálogo"
      aria-busy="true"
      className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
    >
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index} className="bg-card rounded-xl p-2">
          <Skeleton className="skeleton-shimmer aspect-square w-full rounded-lg" />
          <Skeleton className="skeleton-shimmer mt-3 h-4 w-2/3" />
          <Skeleton className="skeleton-shimmer mt-2 h-4 w-1/3" />
        </div>
      ))}
      <span className="sr-only" role="status">
        Carregando dados do catálogo…
      </span>
    </div>
  );
}

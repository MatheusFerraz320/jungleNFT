import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function CatalogSkeleton() {
  return (
    <div
      aria-label="Carregando catálogo"
      aria-busy="true"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="skeleton-shimmer aspect-square w-full rounded-none" />
          <CardHeader className="gap-3">
            <Skeleton className="skeleton-shimmer h-5 w-2/3" />
            <Skeleton className="skeleton-shimmer h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="skeleton-shimmer h-6 w-24" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only" role="status">
        Carregando dados do catálogo…
      </span>
    </div>
  );
}

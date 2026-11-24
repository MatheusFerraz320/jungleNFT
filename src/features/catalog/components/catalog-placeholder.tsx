import { useQuery } from '@tanstack/react-query';
import { Wifi, WifiOff } from 'lucide-react';
import { getErrorMessage } from '@/shared/api/errors';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { CatalogSkeleton } from '@/shared/components/feedback/catalog-skeleton';
import { ErrorState } from '@/shared/components/feedback/empty-error-states';
import { useRealtime } from '@/shared/realtime';
import { healthQueryOptions } from '../hooks/use-health';

export function CatalogPlaceholder() {
  const health = useQuery(healthQueryOptions);
  const realtime = useRealtime();
  const connected = realtime.status === 'connected';

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section aria-labelledby="scaffold-title" className="max-w-3xl">
        <Badge variant="secondary">Estrutura inicial</Badge>
        <h1 id="scaffold-title" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Marketplace de NFTs
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7 sm:text-lg">
          A base do projeto está pronta: React, TypeScript, TanStack Router, TanStack Query, Axios,
          Tailwind, shadcn/ui, MSW e Socket.IO já estão conectados.
        </p>
      </section>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connected ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
              Tempo real
            </CardTitle>
            <CardDescription>Canal Socket.IO interceptado pelo MSW.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={connected ? 'default' : 'outline'} data-testid="socket-status">
              {realtime.status}
            </Badge>
            <p className="text-muted-foreground mt-3 text-sm">Cenário: {realtime.scenario}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API simulada</CardTitle>
            <CardDescription>REST via Axios e handlers MSW.</CardDescription>
          </CardHeader>
          <CardContent>
            {health.isPending ? (
              <div className="space-y-2" aria-busy="true" aria-label="Carregando status da API">
                <div className="skeleton-shimmer h-5 w-28 rounded" />
                <div className="skeleton-shimmer h-4 w-40 rounded" />
              </div>
            ) : health.isError ? (
              <ErrorState
                title="API indisponível"
                description={getErrorMessage(health.error)}
                onRetry={() => void health.refetch()}
                className="min-h-0 py-5"
              />
            ) : (
              <div data-testid="health-status" aria-live="polite">
                <Badge>{health.data.status}</Badge>
                <p className="text-muted-foreground mt-3 text-sm break-all">
                  Cenário: {health.data.scenario}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="next-steps-title" className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="next-steps-title" className="text-2xl font-bold tracking-tight">
              Catálogo
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              O conteúdo será implementado na próxima etapa.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <CatalogSkeleton />
        </div>
      </section>
    </main>
  );
}

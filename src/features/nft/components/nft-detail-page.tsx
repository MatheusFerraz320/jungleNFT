import { Link } from '@tanstack/react-router';
import { ChevronLeft, Heart, Linkedin, Mail, Star, Twitter } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { normalizeApiError } from '@/shared/api/errors';
import { ErrorState } from '@/shared/components/feedback/empty-error-states';
import { Container } from '@/shared/components/layout/container';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { NftDetail } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import { ethLabel } from '@/shared/lib/decimal';
import { networkLabels } from '@/shared/lib/nft-labels';
import { useNftDetail } from '../hooks/use-nft-detail';
import { NftGallery } from './nft-gallery';
import { NftMobilePurchaseBar } from './nft-mobile-purchase-bar';
import { NftPurchasePanel } from './nft-purchase-panel';
import { RelatedNfts } from './related-nfts';

function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`Avaliação ${rating.toFixed(1)} de 5`}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            'size-3.5',
            index < Math.round(rating) ? 'fill-primary text-primary' : 'text-border',
            className,
          )}
        />
      ))}
    </span>
  );
}

function EditionChip({ active, children }: { active?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'border-border inline-flex h-[26px] items-center rounded-full border px-2 text-sm leading-5 max-sm:h-6 max-sm:px-1.5 max-sm:text-[13px]',
        active && 'border-primary text-primary',
      )}
    >
      {children}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-muted-foreground flex gap-2 text-sm leading-5">
      <dt>{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ShareRow({ nft }: { nft: NftDetail }) {
  const pageUrl = typeof window === 'undefined' ? '' : window.location.href;
  const iconLink =
    'text-foreground hover:text-primary transition-colors focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none';

  return (
    <div className="mt-[11px] flex items-center gap-2 text-sm leading-5">
      <span className="font-bold">Compartilhar este NFT:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no LinkedIn"
        className={iconLink}
      >
        <Linkedin aria-hidden="true" className="size-4 fill-current" />
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(pageUrl)}`}
        aria-label="Compartilhar por e-mail"
        className={iconLink}
      >
        <Mail aria-hidden="true" className="size-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(pageUrl)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no Twitter"
        className={iconLink}
      >
        <Twitter aria-hidden="true" className="size-4 fill-current" />
      </a>
    </div>
  );
}

function NftInfo({ nft }: { nft: NftDetail }) {
  return (
    <div>
      <h1 className="text-[28px] leading-[34px] font-bold">{nft.name}</h1>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-primary text-[22px] leading-7 font-bold">{ethLabel(nft.priceEth)}</p>
        <div className="flex items-center gap-1 text-sm">
          <StarRating rating={nft.rating} className="size-[15px]" />
          <span>{nft.reviewCount} avaliações de colecionadores</span>
        </div>
      </div>

      <div className="border-line mt-[3px] border-t pt-[15px]">
        <h2 className="text-[15px] leading-5 font-bold">Sobre este NFT:</h2>
        <p className="text-muted-foreground mt-[9px] text-sm leading-6">{nft.summary}</p>

        <h2 className="mt-1.5 text-[15px] leading-5 font-bold">Edição:</h2>
        <div className="mt-[11px] flex flex-wrap gap-2">
          <EditionChip>1/1</EditionChip>
          <EditionChip>1/10</EditionChip>
          <EditionChip active>1/{nft.totalEditions}</EditionChip>
          <EditionChip>{nft.availableEditions > 0 ? 'ABERTA' : 'ESGOTADA'}</EditionChip>
        </div>
      </div>

      <div className="hidden sm:block">
        <NftPurchasePanel nft={nft} />
      </div>

      <dl className="mt-[15px] flex flex-col gap-3">
        <MetaRow label="ID do token" value={`#${nft.tokenId.padStart(4, '0')}`} />
        <MetaRow label="Coleção" value={nft.collectionName} />
        <MetaRow label="Atributos" value={nft.attributes.join(', ')} />
      </dl>

      <ShareRow nft={nft} />
    </div>
  );
}

type DetailTab = 'details' | 'reviews';

function DetailsPanel({ nft }: { nft: NftDetail }) {
  const heading = 'mt-[14px] text-sm leading-5 font-bold';
  const body = 'text-muted-foreground mt-0.5 text-sm leading-6';

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-6 whitespace-pre-line">
        {nft.description}
      </p>

      <h3 className={heading}>Rede:</h3>
      <p className={body}>
        Cunhado na {networkLabels[nft.network]} com procedência imutável e metadados armazenados no
        IPFS.
      </p>

      <h3 className={heading}>Contrato:</h3>
      <p className={body}>
        Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos
        mercados compatíveis.
      </p>

      <h3 className={heading}>Direitos autorais:</h3>
      <p className={body}>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</p>
    </div>
  );
}

function ReviewsPanel({ nft }: { nft: NftDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StarRating rating={nft.rating} />
        <p className="text-sm">
          <span className="font-semibold">{nft.rating.toFixed(1)}</span>
          <span className="text-muted-foreground"> · {nft.reviewCount} avaliações</span>
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {nft.reviews.map((review) => (
          <li key={review.id} className="bg-card rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{review.author}</p>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{review.comment}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                new Date(review.createdAt),
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NftDetailTabs({ nft }: { nft: NftDetail }) {
  const [tab, setTab] = useState<DetailTab>('details');
  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'details', label: 'Detalhes do NFT' },
    { id: 'reviews', label: `Avaliações de colecionadores (${nft.reviewCount})` },
  ];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next: DetailTab = tab === 'details' ? 'reviews' : 'details';
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <section className="mt-[94px]">
      <div
        role="tablist"
        aria-label="Informações do NFT"
        className="border-line flex flex-wrap gap-x-10 gap-y-2 border-b"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={handleKeyDown}
            className={cn(
              'focus-visible:ring-ring -mb-px border-b-2 pb-[5px] text-base leading-[22px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
              tab === item.id
                ? 'border-primary text-primary font-bold'
                : 'hover:text-primary border-transparent',
            )}
          >
            {item.id === 'reviews' ? (
              <>
                <span className="sm:hidden">Avaliações ({nft.reviewCount})</span>
                <span className="hidden sm:inline">
                  Avaliações de colecionadores ({nft.reviewCount})
                </span>
              </>
            ) : (
              item.label
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="pt-3 focus-visible:outline-none"
      >
        {tab === 'details' ? <DetailsPanel nft={nft} /> : <ReviewsPanel nft={nft} />}
      </div>
    </section>
  );
}

function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando NFT"
      aria-busy="true"
      className="mt-6 grid gap-10 lg:grid-cols-2"
    >
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        <div className="hidden gap-3 sm:flex sm:flex-col">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="skeleton-shimmer size-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="skeleton-shimmer aspect-square flex-1 rounded-[12px]" />
      </div>

      <div className="space-y-4">
        <Skeleton className="skeleton-shimmer h-9 w-2/3" />
        <Skeleton className="skeleton-shimmer h-6 w-1/3" />
        <Skeleton className="skeleton-shimmer h-28 w-full" />
        <Skeleton className="skeleton-shimmer h-10 w-full" />
        <Skeleton className="skeleton-shimmer h-10 w-2/3" />
      </div>
    </div>
  );
}

function NftDetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const apiError = normalizeApiError(error);

  if (apiError.status === 404) {
    return (
      <div className="mt-10">
        <ErrorState
          title="NFT não encontrado"
          description="Este NFT pode ter sido removido ou o link está incorreto."
        />
        <div className="mt-6 text-center">
          <Button asChild>
            <Link to="/">Voltar ao mercado</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ErrorState description={apiError.message} onRetry={onRetry} />
    </div>
  );
}

function NftMobileHero({ nft }: { nft: NftDetail }) {
  const [favorite, setFavorite] = useState(false);
  const circle =
    'border-line bg-card focus-visible:ring-ring absolute top-6 grid size-[34px] place-items-center rounded-full border focus-visible:ring-2 focus-visible:outline-none';

  return (
    <div className="sm:hidden">
      <div className="relative h-[66px]">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => window.history.back()}
          className={cn(circle, 'left-7')}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar NFT'}
          aria-pressed={favorite}
          onClick={() => setFavorite((value) => !value)}
          className={cn(circle, 'right-7')}
        >
          <Heart aria-hidden="true" className={cn('size-4', favorite && 'fill-current')} />
        </button>
      </div>
      <div className="mx-7 h-[326px] overflow-hidden rounded-t-3xl">
        <img
          src={nft.gallery[0] ?? nft.imageUrl}
          alt={`${nft.name} em alta resolução`}
          width={722}
          height={722}
          fetchPriority="high"
          className="aspect-square w-full object-cover object-top"
        />
      </div>
    </div>
  );
}

function NftMobileInfo({ nft }: { nft: NftDetail }) {
  const intro = `${
    nft.summary
      .replace('Um colecionável digital', `Um colecionável digital 1/${nft.totalEditions}`)
      .split(', com arte')[0]
  }.`;

  return (
    <div className="sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl leading-7 font-bold">{nft.name}</h1>
        <span className="border-line inline-flex h-[26px] shrink-0 items-center gap-1 rounded-full border px-3 text-[13px]">
          <Star aria-hidden="true" className="fill-primary text-primary size-3.5" />
          <span className="sr-only">Avaliação</span>
          {nft.rating.toFixed(1)}({nft.reviewCount})
        </span>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-[25px]">{intro}</p>

      <h2 className="mt-3 text-[15px] leading-5 font-bold">Edição:</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <EditionChip>1/10</EditionChip>
        <EditionChip>1/10</EditionChip>
        <EditionChip active>1/{nft.totalEditions}</EditionChip>
        <EditionChip>{nft.availableEditions > 0 ? 'ABERTA' : 'ESGOTADA'}</EditionChip>
      </div>

      <dl className="mt-4 flex flex-col gap-3">
        <MetaRow label="ID do token" value={`#${nft.tokenId.padStart(4, '0')}`} />
        <MetaRow label="Coleção" value={nft.collectionName} />
        <MetaRow label="Atributos" value={nft.attributes.join(', ')} />
      </dl>
    </div>
  );
}

function NftDetailContent({ nft }: { nft: NftDetail }) {
  return (
    <>
      <NftMobileHero nft={nft} />

      <div className="max-sm:bg-card max-sm:rounded-t-[32px] max-sm:px-6 max-sm:pt-8 max-sm:pb-[200px]">
        <NftMobileInfo nft={nft} />

        <div className="mt-[11px] grid items-start gap-8 max-sm:hidden lg:grid-cols-[572px_minmax(0,1fr)] lg:gap-[33px]">
          <NftGallery nft={nft} />
          <NftInfo nft={nft} />
        </div>

        <NftDetailTabs nft={nft} />
        <RelatedNfts nft={nft} />
      </div>
      <NftMobilePurchaseBar nft={nft} />
    </>
  );
}

export function NftDetailPage({ nftId }: { nftId: string }) {
  const detail = useNftDetail(nftId);

  useEffect(() => {
    if (!detail.data) return;

    const previousTitle = document.title;
    document.title = `${detail.data.name} — Kurio`;

    return () => {
      document.title = previousTitle;
    };
  }, [detail.data]);

  return (
    <main className="flex-1 pb-10 max-sm:bg-[#271813] max-sm:pb-0">
      <Container className="pt-8 max-sm:px-0 max-sm:pt-0">
        <nav
          aria-label="Trilha de navegação"
          className="hidden text-[15px] leading-[18px] font-bold sm:block"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <Link to="/" hash="catalogo" className="hover:text-primary transition-colors">
            Mercado
          </Link>
        </nav>

        {detail.isPending ? (
          <NftDetailSkeleton />
        ) : detail.isError ? (
          <NftDetailError error={detail.error} onRetry={() => void detail.refetch()} />
        ) : (
          <NftDetailContent nft={detail.data} />
        )}
      </Container>
    </main>
  );
}

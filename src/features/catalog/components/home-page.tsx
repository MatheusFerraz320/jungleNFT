import { useNavigate, useSearch } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { getErrorMessage } from '@/shared/api/errors';
import { CatalogSkeleton } from '@/shared/components/feedback/catalog-skeleton';
import { EmptyState, ErrorState } from '@/shared/components/feedback/empty-error-states';
import { SearchDialog } from '@/shared/components/layout/app-shell';
import { Container } from '@/shared/components/layout/container';
import { FigmaSearchIcon } from '@/shared/components/icons/figma-icons';
import { NftCard } from '@/shared/components/nft/nft-card';
import { Button } from '@/shared/components/ui/button';
import type { NftFacets, NftListQuery, NftSort } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import { useNftList } from '../hooks/use-nft-list';
import type { CatalogSearch, CatalogTab } from '../schemas/search';
import { BlogSection } from './blog-section';
import { CatalogToolbar, SortSelect } from './catalog-toolbar';
import { FilterSidebar } from './filter-sidebar';
import { Hero } from './hero';
import { Pagination } from './pagination';
import { PromoSection } from './promo-section';

const PAGE_SIZE = 9;

const emptyFacets: NftFacets = { categories: {}, rarities: {}, networks: {} };

export function HomePage() {
  const search = useSearch({ strict: false }) as CatalogSearch;
  const navigate = useNavigate();
  const filtersOpen = search.filters ?? false;

  const tab = search.tab ?? 'all';
  const sort: NftSort =
    tab === 'new' ? 'newest' : tab === 'trending' ? 'price-desc' : (search.sort ?? 'relevance');
  const page = search.page ?? 1;

  const listQuery: Partial<NftListQuery> = {
    q: search.q,
    categories: search.categories,
    rarities: search.rarities,
    minPriceEth: search.minPriceEth,
    maxPriceEth: search.maxPriceEth,
    network: search.network,
    availableOnly: search.availableOnly,
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const nfts = useNftList(listQuery);
  const featured = useNftList({ sort: 'price-desc', pageSize: 1 });

  function updateSearch(patch: Partial<CatalogSearch>) {
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, ...patch }),
      resetScroll: false,
    });
  }

  function clearFilters() {
    void navigate({
      to: '/',
      search: { tab: tab === 'all' ? undefined : tab, filters: search.filters },
      resetScroll: false,
    });
  }

  function handleTabChange(nextTab: CatalogTab) {
    updateSearch({ tab: nextTab === 'all' ? undefined : nextTab, page: undefined });
  }

  function handleSortChange(nextSort: NftSort) {
    updateSearch({ sort: nextSort, tab: undefined, page: undefined });
  }

  function handlePageChange(nextPage: number) {
    updateSearch({ page: nextPage === 1 ? undefined : nextPage });
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const items = nfts.data?.items ?? [];

  return (
    <main className="flex-1 pb-10">
      <Container className="pt-10 sm:hidden">
        <div className="flex gap-[9px]">
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Explorar coleções"
                className="bg-card focus-visible:ring-ring flex h-[45px] min-w-0 flex-1 items-center gap-3 rounded-lg px-3.5 text-left text-sm font-medium text-[#b39463] focus-visible:ring-2 focus-visible:outline-none"
              >
                <FigmaSearchIcon className="size-5 shrink-0" />
                Explorar coleções
              </button>
            }
          />
          <button
            type="button"
            aria-label="Abrir filtros"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => updateSearch({ filters: filtersOpen ? undefined : true })}
            className="text-primary-foreground focus-visible:ring-ring grid size-[45px] shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#8d5e35,#d28a4c)] focus-visible:ring-2 focus-visible:outline-none"
          >
            <SlidersHorizontal aria-hidden="true" className="size-5" />
          </button>
        </div>
      </Container>
      <Hero />

      <section
        id="catalogo"
        aria-labelledby="catalogo-title"
        className="mt-3.5 scroll-mt-24 lg:mt-24"
      >
        <Container>
          <h2 id="catalogo-title" className="sr-only">
            Catálogo de NFTs
          </h2>

          <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
            <div id="catalog-filters" className={cn(filtersOpen ? 'block' : 'hidden', 'lg:block')}>
              <SortSelect
                sort={sort}
                onSortChange={handleSortChange}
                className="bg-card mb-4 justify-between px-5 py-3 sm:hidden"
              />
              <FilterSidebar
                search={search}
                facets={nfts.data?.facets ?? emptyFacets}
                featured={featured.data?.items[0]}
                onChange={updateSearch}
                onClear={clearFilters}
              />
            </div>

            <div>
              <CatalogToolbar
                tab={tab}
                sort={sort}
                total={nfts.data?.pagination.total ?? 0}
                onTabChange={handleTabChange}
                onSortChange={handleSortChange}
              />

              <div className="mt-4 lg:mt-0">
                {nfts.isPending ? (
                  <CatalogSkeleton />
                ) : nfts.isError ? (
                  <ErrorState
                    title="Não foi possível carregar o catálogo"
                    description={getErrorMessage(nfts.error)}
                    onRetry={() => void nfts.refetch()}
                  />
                ) : items.length === 0 ? (
                  <EmptyState
                    title="Nenhum NFT encontrado"
                    description="Ajuste os filtros ou limpe a busca para ver outras obras."
                    action={<Button onClick={clearFilters}>Limpar filtros</Button>}
                  />
                ) : (
                  <>
                    <div
                      aria-busy={nfts.isFetching}
                      className={cn(
                        'grid grid-cols-2 gap-x-4 gap-y-[22px] max-sm:pb-8 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[70px]',
                        nfts.isFetching && 'opacity-60 transition-opacity',
                      )}
                    >
                      {items.map((nft) => (
                        <NftCard key={nft.id} nft={nft} stagger />
                      ))}
                    </div>

                    <Pagination
                      page={nfts.data?.pagination.page ?? 1}
                      totalPages={nfts.data?.pagination.totalPages ?? 1}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <PromoSection />
        <BlogSection />
      </Container>
    </main>
  );
}

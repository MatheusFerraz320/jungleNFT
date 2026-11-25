import { Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { NetworkSchema, NftCategorySchema, NftRaritySchema } from '@/shared/contracts';
import type { NftCategory, NftFacets, NftRarity, NftSummary } from '@/shared/contracts';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Slider } from '@/shared/components/ui/slider';
import { cn } from '@/shared/lib/cn';
import { categoryLabels, networkLabels, rarityLabels } from '@/shared/lib/nft-labels';
import type { CatalogSearch } from '../schemas/search';

const MAX_PRICE_ETH = 3;

interface FilterSidebarProps {
  search: CatalogSearch;
  facets: NftFacets;
  featured?: NftSummary;
  onChange: (patch: Partial<CatalogSearch>) => void;
  onClear: () => void;
}

const sectionTitle = 'text-[18px] leading-4 font-bold';

function OptionRow({
  label,
  count,
  active,
  boldCount,
  onClick,
  className,
}: {
  label: string;
  count: number;
  active: boolean;
  boldCount?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          'text-muted-foreground hover:text-primary focus-visible:ring-ring flex h-10 w-full items-center justify-between rounded-sm pl-3 text-[15px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
          active && 'text-primary',
          className,
        )}
      >
        <span>{label}</span>
        <span className={cn(boldCount && 'font-bold', boldCount && !active && 'text-foreground')}>
          <span className="sr-only">, </span>({count})
        </span>
      </button>
    </li>
  );
}

export function FilterSidebar({ search, facets, featured, onChange, onClear }: FilterSidebarProps) {
  const [priceDraft, setPriceDraft] = useState<[number, number] | null>(null);
  const priceRange: [number, number] = priceDraft ?? [
    Number(search.minPriceEth ?? 0),
    Number(search.maxPriceEth ?? MAX_PRICE_ETH),
  ];
  const format = (value: number) => value.toFixed(2).replace('.', ',');

  const hasFilters = Boolean(
    search.q ||
    search.categories?.length ||
    search.rarities?.length ||
    search.minPriceEth ||
    search.maxPriceEth ||
    search.network ||
    search.availableOnly,
  );

  function toggleCategory(category: NftCategory) {
    const current = search.categories ?? [];
    const next = current.includes(category)
      ? current.filter((value) => value !== category)
      : [...current, category];

    onChange({ categories: next.length ? next : undefined, page: undefined });
  }

  function toggleRarity(rarity: NftRarity) {
    const current = search.rarities ?? [];
    const next = current.includes(rarity)
      ? current.filter((value) => value !== rarity)
      : [...current, rarity];

    onChange({ rarities: next.length ? next : undefined, page: undefined });
  }

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [min, max] = priceRange;

    setPriceDraft(null);
    onChange({
      minPriceEth: min <= 0 ? undefined : min.toFixed(2),
      maxPriceEth: max >= MAX_PRICE_ETH ? undefined : max.toFixed(2),
      page: undefined,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <aside aria-label="Filtros do catálogo" className="bg-card px-5 pt-[21px] pb-5">
        <section aria-labelledby="filter-collections">
          <h2 id="filter-collections" className={sectionTitle}>
            Coleções
          </h2>
          <ul className="mt-3 pr-[13px]">
            {NftCategorySchema.options.map((category) => (
              <OptionRow
                key={category}
                label={categoryLabels[category]}
                count={facets.categories[category] ?? 0}
                active={search.categories?.includes(category) ?? false}
                boldCount
                onClick={() => toggleCategory(category)}
              />
            ))}
          </ul>
        </section>

        <form onSubmit={applyPrice} className="mt-10" aria-labelledby="filter-price">
          <h2 id="filter-price" className={sectionTitle}>
            Faixa de preço
          </h2>
          <Slider
            className="mt-3 pl-3"
            min={0}
            max={MAX_PRICE_ETH}
            step={0.05}
            value={priceRange}
            thumbLabels={['Preço mínimo', 'Preço máximo']}
            onValueChange={(next) => {
              const [min, max] = next;
              if (min === undefined || max === undefined) return;
              setPriceDraft([min, max]);
            }}
          />
          <p className="mt-4 pl-3 text-[15px] leading-5" aria-live="polite">
            Preço: {format(priceRange[0])} - {format(priceRange[1])} ETH
          </p>
          <button
            type="submit"
            className="bg-primary text-primary-foreground focus-visible:ring-ring mt-3 ml-3 h-9 w-[92px] rounded text-[15px] font-bold focus-visible:ring-2 focus-visible:outline-none"
          >
            Aplicar
          </button>
        </form>

        <section aria-labelledby="filter-network" className="mt-10">
          <h2 id="filter-network" className={sectionTitle}>
            Rede
          </h2>
          <ul className="mt-3">
            {NetworkSchema.options.map((network) => (
              <OptionRow
                key={network}
                label={networkLabels[network]}
                count={facets.networks[network] ?? 0}
                active={search.network === network}
                onClick={() =>
                  onChange({
                    network: search.network === network ? undefined : network,
                    page: undefined,
                  })
                }
              />
            ))}
          </ul>
        </section>

        <section aria-labelledby="filter-rarity" className="mt-10">
          <h2 id="filter-rarity" className={sectionTitle}>
            Raridade
          </h2>
          <ul className="mt-3">
            {NftRaritySchema.options.map((rarity) => (
              <OptionRow
                key={rarity}
                label={rarityLabels[rarity]}
                count={facets.rarities[rarity] ?? 0}
                active={search.rarities?.includes(rarity) ?? false}
                onClick={() => toggleRarity(rarity)}
              />
            ))}
          </ul>
        </section>

        <div className="mt-6 flex flex-col items-start gap-1 pl-3">
          <label className="flex cursor-pointer items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={search.availableOnly ?? false}
              onChange={(event) =>
                onChange({ availableOnly: event.target.checked || undefined, page: undefined })
              }
              className="accent-primary size-4 rounded-sm"
            />
            Somente disponíveis
          </label>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setPriceDraft(null);
                onClear();
              }}
              className="text-primary mt-3 text-[15px] font-medium hover:underline"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </aside>

      <section aria-labelledby="featured-title" className="hidden bg-[#271a11] lg:block">
        <div className="px-5 pt-[26px] pb-[17px]">
          <h2 id="featured-title" className="text-primary text-[22px] leading-[29px] font-bold">
            NFT EM DESTAQUE
          </h2>
          <p className="text-center text-[22px] leading-[29px] font-bold">OFERTA LIMITADA</p>
        </div>
        {featured ? (
          <Link
            to="/nft/$nftId"
            params={{ nftId: featured.id }}
            className="focus-visible:ring-ring block overflow-hidden rounded-[24px] focus-visible:ring-2 focus-visible:outline-none"
          >
            <img
              src={featured.imageUrl}
              alt={`${featured.name}, NFT em destaque`}
              width={620}
              height={716}
              loading="lazy"
              decoding="async"
              className="h-[358px] w-full object-cover object-top"
            />
          </Link>
        ) : (
          <Skeleton className="skeleton-shimmer h-[358px] w-full rounded-[24px]" />
        )}
      </section>
    </div>
  );
}

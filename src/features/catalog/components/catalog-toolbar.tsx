import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import type { NftSort } from '@/shared/contracts';
import { cn } from '@/shared/lib/cn';
import type { CatalogTab } from '../schemas/search';

const tabs: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
];

const sortOptions: { value: NftSort; label: string }[] = [
  { value: 'relevance', label: 'Listados recentemente' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name-asc', label: 'Nome (A–Z)' },
];

interface CatalogToolbarProps {
  tab: CatalogTab;
  sort: NftSort;
  total: number;
  onTabChange: (tab: CatalogTab) => void;
  onSortChange: (sort: NftSort) => void;
}

export function SortSelect({
  sort,
  onSortChange,
  className,
}: {
  sort: NftSort;
  onSortChange: (sort: NftSort) => void;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn('relative flex items-center gap-1 text-[15px] leading-5', className)}>
      <label htmlFor={id}>Ordenar por:</label>
      <select
        id={id}
        value={sort}
        onChange={(event) => onSortChange(event.target.value as NftSort)}
        className="focus-visible:ring-ring cursor-pointer appearance-none rounded-sm bg-transparent pr-6 focus-visible:ring-2 focus-visible:outline-none [&>option]:bg-[#241612]"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-0 size-4" />
    </div>
  );
}

export function CatalogToolbar({
  tab,
  sort,
  total,
  onTabChange,
  onSortChange,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:h-[50px]">
      <div
        aria-label="Modos de descoberta"
        className="flex flex-wrap gap-x-[21px] gap-y-2 max-sm:gap-x-1 max-sm:[&>*:last-child]:ml-3"
        role="group"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'hover:text-primary focus-visible:ring-ring border-b-2 pb-0.5 text-sm leading-5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-[15px]',
              tab === item.id ? 'border-primary text-primary' : 'border-transparent',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SortSelect sort={sort} onSortChange={onSortChange} className="max-sm:hidden" />

      <p className="sr-only" aria-live="polite">
        {total} NFTs encontrados
      </p>
    </div>
  );
}

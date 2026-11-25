import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const boxClass =
  'focus-visible:ring-ring grid size-[35px] place-items-center rounded text-[15px] transition-colors focus-visible:ring-2 focus-visible:outline-none';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-12 flex items-center justify-end gap-2 sm:mt-20"
    >
      {page > 1 ? (
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
          className={cn(boxClass, 'border-secondary hover:bg-secondary border')}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
      ) : null}

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`Página ${value}`}
          aria-current={page === value ? 'page' : undefined}
          onClick={() => onPageChange(value)}
          className={cn(
            boxClass,
            page === value
              ? 'bg-primary text-primary-foreground font-bold'
              : 'border-secondary hover:bg-secondary border',
          )}
        >
          {value}
        </button>
      ))}

      {page < totalPages ? (
        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => onPageChange(page + 1)}
          className={cn(boxClass, 'border-secondary hover:bg-secondary border')}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </nav>
  );
}

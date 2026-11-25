import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/shared/lib/cn';

interface MobileTopBarProps {
  title: string;
  /** Rota de fallback quando não há histórico para voltar. */
  fallbackTo?: '/' | '/carrinho';
  className?: string;
  trailing?: ReactNode;
}

/** Barra superior das telas mobile: botão voltar circular + título centralizado (Figma 414). */
export function MobileTopBar({ title, fallbackTo = '/', className, trailing }: MobileTopBarProps) {
  const navigate = useNavigate();

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else void navigate({ to: fallbackTo });
  }

  return (
    <div
      className={cn('relative flex h-[88px] items-start justify-center pt-9 sm:hidden', className)}
    >
      <button
        type="button"
        aria-label="Voltar"
        onClick={goBack}
        className="border-line focus-visible:ring-ring absolute top-[33px] left-7 grid size-[34px] place-items-center rounded-full border bg-[#2a1a14] focus-visible:ring-2 focus-visible:outline-none"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>
      <h1 className="text-xl leading-7 font-bold">{title}</h1>
      {trailing}
    </div>
  );
}

import { Link } from '@tanstack/react-router';

export function AppHeader() {
  return (
    <header className="border-border bg-background/95 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-black"
          >
            J
          </span>
          <span className="text-lg font-bold tracking-tight">JungleNFT</span>
        </Link>
        <span className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Scaffold
        </span>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-border text-muted-foreground border-t py-6 text-center text-sm">
      Ambiente simulado · Nenhuma transação blockchain real
    </footer>
  );
}

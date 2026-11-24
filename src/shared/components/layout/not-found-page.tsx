import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Erro 404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Página não encontrada</h1>
      <p className="text-muted-foreground mt-4 max-w-lg">
        O endereço acessado não existe ou foi movido. Volte ao início para continuar explorando.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}

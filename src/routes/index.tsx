import { createFileRoute } from '@tanstack/react-router';
import { CatalogPlaceholder } from '@/features/catalog';

export const Route = createFileRoute('/')({
  component: CatalogPlaceholder,
});

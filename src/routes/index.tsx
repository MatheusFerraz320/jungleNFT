import { createFileRoute } from '@tanstack/react-router';
import { HomePage, catalogSearchSchema } from '@/features/catalog';

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  head: () => ({
    meta: [
      { title: 'Kurio — Marketplace de NFTs' },
      {
        name: 'description',
        content:
          'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara na Kurio.',
      },
    ],
  }),
  component: HomePage,
});

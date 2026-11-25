import { http, HttpResponse } from 'msw';
import { queryNfts } from '@/mocks/db/nft-queries';
import { mockDatabase } from '@/mocks/db/store';
import { buildNftDetail } from '@/mocks/fixtures/nfts';
import { NftListQuerySchema } from '@/shared/contracts';
import { isOfflineScenario, waitForScenario } from '../lib/scenario';

function readListQuery(url: URL) {
  const availableOnly = url.searchParams.get('availableOnly');
  const page = url.searchParams.get('page');
  const pageSize = url.searchParams.get('pageSize');

  return {
    q: url.searchParams.get('q') ?? undefined,
    categories: url.searchParams.getAll('categories'),
    rarities: url.searchParams.getAll('rarities'),
    minPriceEth: url.searchParams.get('minPriceEth') ?? undefined,
    maxPriceEth: url.searchParams.get('maxPriceEth') ?? undefined,
    network: url.searchParams.get('network') ?? undefined,
    availableOnly: availableOnly === null ? undefined : availableOnly === 'true',
    collectionId: url.searchParams.get('collectionId') ?? undefined,
    excludeId: url.searchParams.get('excludeId') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    page: page === null ? undefined : Number(page),
    pageSize: pageSize === null ? undefined : Number(pageSize),
  };
}

export const nftHandlers = [
  http.get('*/api/nfts', async ({ request }) => {
    if (isOfflineScenario()) return HttpResponse.error();
    await waitForScenario();

    const parsed = NftListQuerySchema.safeParse(readListQuery(new URL(request.url)));

    if (!parsed.success) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Filtros de catálogo inválidos.',
          fieldErrors: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'query',
            message: issue.message,
          })),
        },
        { status: 422 },
      );
    }

    const nfts = mockDatabase.scenario === 'empty' ? [] : mockDatabase.listNfts();

    return HttpResponse.json(queryNfts(nfts, parsed.data));
  }),

  http.get('*/api/nfts/:id', async ({ params }) => {
    if (isOfflineScenario()) return HttpResponse.error();
    await waitForScenario();

    const nft = mockDatabase.getNft(String(params.id));

    if (!nft) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'NFT não encontrado.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(buildNftDetail(nft));
  }),
];

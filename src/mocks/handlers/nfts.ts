import { http } from 'msw';
import { queryNfts } from '@/mocks/db/nft-queries';
import { mockDatabase } from '@/mocks/db/store';
import { buildNftDetail } from '@/mocks/fixtures/nfts';
import { NftListQuerySchema } from '@/shared/contracts';
import { DomainError } from '@/mocks/db/domain-error';
import { param, respond } from '../lib/respond';

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
  http.get('*/api/nfts', (info) =>
    respond(info, ({ request }) => {
      const parsed = NftListQuerySchema.safeParse(readListQuery(new URL(request.url)));

      if (!parsed.success) {
        throw new DomainError(
          422,
          'VALIDATION_ERROR',
          'Filtros de catálogo inválidos.',
          parsed.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'query',
            message: issue.message,
          })),
        );
      }

      const nfts = mockDatabase.scenario === 'empty' ? [] : mockDatabase.listNfts();
      return { body: queryNfts(nfts, parsed.data) };
    }),
  ),

  http.get('*/api/nfts/:id', (info) =>
    respond(info, ({ params }) => {
      const nft = mockDatabase.getNft(param(params.id));
      if (!nft) throw new DomainError(404, 'NOT_FOUND', 'NFT não encontrado.');

      return { body: buildNftDetail(nft) };
    }),
  ),
];

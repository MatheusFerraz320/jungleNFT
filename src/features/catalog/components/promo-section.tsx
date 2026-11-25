import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const promos = [
  {
    image: '/assets/nfts/artwork-03.webp',
    alt: 'Emerald Ape #042',
    title: 'Lançamentos gênesis\nde edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' as const },
  },
  {
    image: '/assets/nfts/artwork-05.webp',
    alt: 'Neon Vessel #552',
    title: 'Arte digital selecionada\ne muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura da internet.',
    search: { sort: 'price-desc' as const },
  },
];

export function PromoSection() {
  return (
    <section
      id="criadores"
      aria-label="Destaques da Kurio"
      className="mt-16 scroll-mt-24 lg:mt-[97px]"
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-[30px]">
        {promos.map((promo) => (
          <article
            key={promo.title}
            className="bg-card grid overflow-hidden rounded-lg max-sm:grid-rows-[auto_1fr] sm:h-[250px] sm:grid-cols-[287px_1fr] sm:grid-rows-[250px]"
          >
            <img
              src={promo.image}
              alt={promo.alt}
              width={574}
              height={500}
              loading="lazy"
              decoding="async"
              className="h-full w-full rounded-r-[24px] object-cover max-sm:aspect-square"
            />
            <div className="relative px-[30px] pt-[37px] text-right max-sm:py-6">
              <div className="ml-auto sm:absolute sm:top-[37px] sm:right-[30px] sm:ml-0 sm:w-[262px]">
                <h2 className="text-[18px] leading-[25px] font-bold whitespace-pre-line">
                  {promo.title}
                </h2>
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-[23px]">
                  {promo.description}
                </p>
              </div>
              <Link
                to="/"
                search={promo.search}
                hash="catalogo"
                className="bg-primary text-primary-foreground focus-visible:ring-ring absolute right-[30px] bottom-[46px] inline-flex h-10 w-[140px] items-center justify-center gap-1 rounded text-sm font-bold focus-visible:ring-2 focus-visible:outline-none max-sm:static max-sm:mt-5"
              >
                Explorar
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

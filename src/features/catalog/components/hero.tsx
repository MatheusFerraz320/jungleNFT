import { ArrowRight } from 'lucide-react';
import { Container } from '@/shared/components/layout/container';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="relative pt-4 lg:pt-[33px] lg:pb-0">
        <div className="relative h-[190px] overflow-hidden rounded-[26px] bg-[linear-gradient(150deg,#805837_0%,#5a3b24_50%,#2b1d13_100%)] lg:hidden">
          <div
            aria-hidden="true"
            className="absolute top-0 left-[73px] size-[190px] rounded-full bg-[#d28a4c]/10"
          />
          <div className="absolute top-1.5 left-4 w-[190px]">
            <p className="text-sm leading-4 font-medium">Bem-vindo à Kurio</p>
            <h1 className="mt-1.5 text-xl leading-[29px] font-bold uppercase">
              Seja dono da cultura digital
            </h1>
            <p className="text-muted-foreground mt-1.5 text-xs leading-[18px]">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
          </div>
          <a
            href="#catalogo"
            className="text-primary focus-visible:ring-ring absolute top-[145px] left-4 inline-flex items-center gap-3 rounded-sm text-xs leading-4 font-bold uppercase focus-visible:ring-2 focus-visible:outline-none"
          >
            Explorar <ArrowRight aria-hidden="true" className="size-4" />
          </a>

          <img
            src="/assets/nfts/artwork-03.webp"
            alt="Emerald Ape #042, obra em destaque na Kurio"
            width={276}
            height={276}
            fetchPriority="high"
            decoding="async"
            className="absolute top-2.5 right-4 size-[138px] rounded-[16px] object-cover"
          />
          <img
            src="/assets/nfts/artwork-04.webp"
            alt=""
            width={116}
            height={116}
            decoding="async"
            className="absolute top-[98px] right-[100px] size-[58px] rounded-[12px] object-cover"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
          >
            <span className="bg-primary size-[7px] rounded-full" />
            <span className="bg-primary size-[7px] rounded-full" />
            <span className="bg-primary size-[7px] rounded-full" />
          </div>
        </div>

        <div className="relative hidden h-[450px] lg:block">
          <div className="absolute top-[43px] left-10 w-[560px]">
            <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
            <h1 className="mt-2.5 text-[43px] leading-[70px] font-bold uppercase">
              <span className="block">Seja dono do futuro</span>
              <span className="block">da arte digital</span>
            </h1>
            <p className="text-muted-foreground mt-px max-w-[560px] text-sm leading-6">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <a
              href="#catalogo"
              className="bg-primary text-primary-foreground focus-visible:ring-ring mt-[33px] inline-flex h-10 w-[140px] items-center justify-center rounded text-base font-bold uppercase focus-visible:ring-2 focus-visible:outline-none"
            >
              Explorar
            </a>
          </div>

          <div aria-hidden="true" className="absolute top-[401px] left-[601px] flex gap-2.5">
            <span className="bg-primary size-1.5 rounded-full" />
            <span className="bg-primary size-1.5 rounded-full" />
            <span className="bg-primary size-1.5 rounded-full" />
          </div>

          <img
            src="/assets/nfts/artwork-03.webp"
            alt="Emerald Ape #042, obra em destaque na Kurio"
            width={900}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="absolute top-0 right-0 size-[450px] rounded-[24px] object-cover"
          />
        </div>
      </Container>
    </section>
  );
}

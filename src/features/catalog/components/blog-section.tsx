import { toast } from 'sonner';
import { blogPosts } from '../data/blog-posts';

export function BlogSection() {
  return (
    <section
      id="diario"
      aria-labelledby="diario-title"
      className="mt-16 scroll-mt-24 lg:mt-[100px]"
    >
      <div className="text-center">
        <h2 id="diario-title" className="text-[28px] leading-9 font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-muted-foreground mt-[7px] text-sm leading-5">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-[repeat(4,267px)] xl:gap-x-[25px]">
        {blogPosts.map((post) => (
          <article key={post.id} className="bg-card flex flex-col overflow-hidden rounded-lg">
            <img
              src={post.imageUrl}
              alt=""
              width={534}
              height={390}
              loading="lazy"
              decoding="async"
              className="aspect-[267/195] w-full object-cover"
            />
            <div className="flex flex-1 flex-col px-[14px] pt-[14px] pb-4">
              <p className="text-muted-foreground text-xs leading-4 font-medium">
                {post.date}{' '}
                <span aria-hidden="true" className="px-2">
                  |
                </span>{' '}
                Leitura de {post.readingTime}
              </p>
              <h3 className="mt-3 text-base leading-5 font-bold">{post.title}</h3>
              <p className="text-muted-foreground mt-2 text-xs leading-4">{post.excerpt}</p>
              <button
                type="button"
                aria-label={`Ler mais: ${post.title}`}
                onClick={() => toast.info('O artigo completo será publicado em breve.')}
                className="text-primary focus-visible:ring-ring mt-3 inline-flex w-fit items-center gap-1 rounded-sm text-xs font-bold hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Ler mais <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

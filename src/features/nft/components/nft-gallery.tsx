import { ZoomIn } from 'lucide-react';
import { useState } from 'react';
import type { NftDetail } from '@/shared/contracts';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';

export function NftGallery({ nft }: { nft: NftDetail }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = nft.gallery[activeIndex] ?? nft.imageUrl;

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
      <div className="flex gap-4 max-sm:justify-center sm:flex-col">
        {nft.gallery.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            aria-label={`Ver imagem ${index + 1} de ${nft.gallery.length}`}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'focus-visible:ring-ring size-[100px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:ring-2 focus-visible:outline-none max-sm:size-16',
              activeIndex === index ? 'border-primary' : 'border-transparent',
            )}
          >
            <img
              src={image}
              alt=""
              width={200}
              height={200}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="bg-card relative aspect-square w-full p-5 max-sm:p-0 sm:size-[444px] sm:shrink-0">
        <img
          src={activeImage}
          alt={`${nft.name} em alta resolução`}
          width={900}
          height={900}
          fetchPriority="high"
          className="size-full rounded-[24px] object-cover"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="bg-card/80 text-foreground hover:bg-secondary focus-visible:ring-ring absolute top-[27px] right-[27px] grid size-7 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none max-sm:hidden"
            >
              <ZoomIn aria-hidden="true" className="size-[18px]" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <img
              src={activeImage}
              alt={`${nft.name} ampliado`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

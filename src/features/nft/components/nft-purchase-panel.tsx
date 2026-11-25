import { Heart, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { NftDetail } from '@/shared/contracts';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';

const pillClass =
  'bg-primary text-primary-foreground focus-visible:ring-ring grid h-[46px] w-8 place-items-center rounded-[16px] transition-opacity focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40';

export function NftPurchasePanel({ nft }: { nft: NftDetail }) {
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);

  const soldOut = nft.availableEditions === 0;
  const maxQuantity = Math.max(1, nft.availableEditions);
  const total = ethLabel(multiplyEth(nft.priceEth, quantity));

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    if (next) toast.success('Adicionado aos favoritos (simulação).');
  }

  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-2" role="group" aria-label="Quantidade">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={quantity <= 1}
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          className={pillClass}
        >
          <Minus aria-hidden="true" className="size-6" strokeWidth={2.5} />
        </button>
        <span aria-live="polite" className="w-5 text-center text-base">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={quantity >= maxQuantity}
          onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
          className={pillClass}
        >
          <Plus aria-hidden="true" className="size-6" strokeWidth={2.5} />
        </button>
        {quantity > 1 ? (
          <p className="text-muted-foreground ml-3 text-sm" aria-live="polite">
            Total: {total}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => toast.info('O checkout será implementado na próxima etapa.')}
          className="bg-primary text-primary-foreground focus-visible:ring-ring -mt-0.5 h-10 w-[130px] rounded text-sm font-bold uppercase focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          {soldOut ? 'Esgotado' : 'Comprar'}
        </button>
        <button
          type="button"
          aria-pressed={favorite}
          onClick={toggleFavorite}
          className="border-primary focus-visible:ring-ring -mt-0.5 inline-flex h-10 w-[130px] items-center justify-center gap-2 rounded border text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          <Heart
            aria-hidden="true"
            className={favorite ? 'text-primary size-5 fill-current' : 'text-primary size-5'}
          />
          {favorite ? 'Favoritado' : 'Favoritar'}
        </button>
      </div>
    </div>
  );
}

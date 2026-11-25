import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { NftDetail } from '@/shared/contracts';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';

const pillClass =
  'bg-primary text-primary-foreground focus-visible:ring-ring grid h-[30px] w-5 place-items-center rounded-full border border-[#3a2218] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60';

export function NftMobilePurchaseBar({ nft }: { nft: NftDetail }) {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.max(1, nft.availableEditions);
  const soldOut = nft.availableEditions === 0;
  const total = ethLabel(multiplyEth(nft.priceEth, quantity));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[165px] max-w-[414px] rounded-t-[32px] bg-[#231511] px-6 pt-[18px] shadow-[0_-10px_30px_#0a060473] sm:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" role="group" aria-label="Quantidade">
          <span className="text-muted-foreground mr-1 text-sm font-medium">Qtd.</span>
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className={pillClass}
          >
            <Minus aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
          </button>
          <span aria-live="polite" className="w-5 text-center text-xl leading-none">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            className={pillClass}
          >
            <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-primary text-[22px] leading-7 font-bold" aria-live="polite">
          {total}
        </p>
      </div>

      <div className="mt-[22px] flex items-center gap-3">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => toast.info('O checkout será implementado na próxima etapa.')}
          className="text-primary-foreground focus-visible:ring-ring h-[60px] w-[196px] rounded-full bg-[linear-gradient(135deg,#d28a4c,#b87a44)] text-base font-bold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          {soldOut ? 'Esgotado' : 'Comprar NFT'}
        </button>
        <button
          type="button"
          aria-label="Adicionar ao carrinho"
          onClick={() => toast.info('O carrinho será implementado na próxima etapa.')}
          className="text-muted-foreground focus-visible:ring-ring grid size-[60px] place-items-center rounded-full border border-[#3a2218] bg-[#2a1a14] focus-visible:ring-2 focus-visible:outline-none"
        >
          <ShoppingCart aria-hidden="true" className="size-6 fill-current" />
        </button>
      </div>
    </div>
  );
}

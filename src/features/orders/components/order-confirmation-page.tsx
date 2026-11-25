import { Link, useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import { ethLabel, multiplyEth } from '@/shared/lib/decimal';
import { getOrder } from '../store/local-orders';

function ThankYouIcon() {
  return (
    <svg
      viewBox="0 0 66 82"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className="text-primary h-[82px] w-[66px]"
    >
      <rect x="11" y="3" width="44" height="40" rx="3" />
      <text
        x="33"
        y="19"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="700"
      >
        THANK
      </text>
      <text
        x="33"
        y="31"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="700"
      >
        YOU
      </text>
      <path d="M3 40 L33 58 L63 40 V77 H3 Z" />
      <path d="M3 77 L26 58 M63 77 L40 58" />
    </svg>
  );
}

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const navigate = useNavigate();
  const order = useMemo(() => getOrder(orderId), [orderId]);

  if (!order) {
    return (
      <main className="flex-1 px-6 pt-24 text-center">
        <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Não localizamos este pedido neste dispositivo.
        </p>
        <Link
          to="/"
          className="bg-primary text-primary-foreground mt-6 inline-flex h-10 items-center rounded px-6 text-[15px] font-bold"
        >
          Voltar ao mercado
        </Link>
      </main>
    );
  }

  const createdAt = new Date(order.createdAt);
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(createdAt)
    .replace('.', '');
  const date = `${createdAt.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${createdAt.getFullYear()}`;
  const shortHash = `${order.transactionHash.slice(0, 6)}…${order.transactionHash.slice(-4)}`;

  const summary = [
    { label: 'ID da transação', value: shortHash, bold: true },
    { label: 'Data', value: date },
    { label: 'Total', value: ethLabel(order.totalEth) },
    { label: 'Carteira', value: order.walletLabel, bold: true },
  ];

  return (
    <main className="flex flex-1 items-start justify-center px-4 pt-[98px] pb-16 max-sm:pt-6 max-sm:pb-6 sm:px-0">
      <section
        aria-labelledby="order-title"
        className="bg-card border-b-primary relative w-full max-w-[578px] border-b-[10px]"
      >
        <button
          type="button"
          aria-label="Fechar recibo"
          onClick={() => void navigate({ to: '/' })}
          className="text-primary focus-visible:ring-ring absolute top-[17px] right-[17px] grid size-6 place-items-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>

        <div className="flex flex-col items-center pt-[22px]">
          <ThankYouIcon />
          <h1
            id="order-title"
            className="text-muted-foreground mt-[19px] mb-[19px] text-[15px] leading-5 font-bold"
          >
            Seus NFTs agora estão na sua carteira
          </h1>
        </div>

        <dl className="border-primary grid grid-cols-2 border-y sm:grid-cols-[181px_145px_125px_minmax(0,1fr)]">
          {summary.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'my-[14px] min-w-0 pl-4 text-[13px] leading-5 whitespace-nowrap',
                index > 0 && 'sm:border-primary sm:border-l',
                index === 0 && 'sm:pl-9',
              )}
            >
              <dt
                className={cn(
                  item.bold ? 'text-muted-foreground font-bold' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </dt>
              <dd
                className={cn('truncate', item.bold ? 'text-muted-foreground' : 'text-foreground')}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="px-[44px] pt-[17px] max-sm:px-6">
          <h2 className="text-[15px] leading-5 font-bold">Detalhes da transação</h2>
          <table className="mt-2 w-full border-separate [border-spacing:0] text-left">
            <caption className="sr-only">Itens do pedido</caption>
            <thead>
              <tr className="text-[15px] leading-[18px] font-bold">
                <th scope="col" className="border-line border-b pb-2 text-left">
                  NFTs
                </th>
                <th scope="col" className="border-line border-b pb-2 text-center">
                  Edições
                </th>
                <th scope="col" className="border-line border-b pb-2 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.nftId} className="h-[82px]">
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={line.imageUrl}
                        alt=""
                        width={140}
                        height={132}
                        className="h-[66px] w-[70px] shrink-0 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-base leading-[22px] font-bold">{line.name}</p>
                        <p className="text-sm leading-[18px] text-[#b39463]">
                          ID do token: #{line.tokenId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground text-center text-[15px]">
                    (x {line.quantity})
                  </td>
                  <td className="text-primary text-right text-lg font-bold">
                    {ethLabel(multiplyEth(line.priceEth, line.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="border-line mt-0 ml-auto w-full max-w-[322px] border-b pb-3 text-[15px] leading-5">
            <div className="flex items-baseline justify-between">
              <dt>Taxa de rede</dt>
              <dd className="text-lg">{ethLabel(order.feeEth)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <dt className="font-bold">Total</dt>
              <dd className="text-primary text-lg font-bold">{ethLabel(order.totalEth)}</dd>
            </div>
          </dl>

          <p className="text-muted-foreground mx-auto mt-[17px] max-w-[420px] text-center text-sm leading-[22px]">
            Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
            conectada e registrada na rede.
          </p>

          <div className="pt-[28px] pb-[54px] text-center">
            <button
              type="button"
              onClick={() =>
                toast.info('Link de exploração simulado: nenhuma rede real é consultada.')
              }
              className="bg-primary text-primary-foreground focus-visible:ring-ring h-12 w-[186px] rounded text-base font-bold focus-visible:ring-2 focus-visible:outline-none"
            >
              Ver no Etherscan
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

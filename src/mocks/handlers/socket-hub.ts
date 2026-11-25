import { mockDomain, ORDER_SETTLE_MS, type DomainEvent } from '@/mocks/db/domain';
import { mockDatabase } from '@/mocks/db/store';
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/shared/contracts';

/**
 * Hub de conexões Socket.IO simuladas. Traduz eventos de domínio (as mesmas mudanças que a API
 * REST enxerga) em eventos de tempo real, garantindo consistência REST ↔ socket:
 *  - `nft.updated` vai a todos os clientes;
 *  - `order.updated` vai somente às conexões do dono, marcado com o `sessionId` dele.
 */
interface HubConnection {
  id: string;
  userId: string | null;
  sessionId: string | null;
  emit: (event: string, payload: unknown) => void;
  close: () => void;
}

const connections = new Map<string, HubConnection>();
const scheduled = new Set<string>();

function meta<T extends 'nft' | 'order'>(
  type: T,
  resourceId: string,
  version: number,
  sessionId: string | null,
) {
  return {
    eventId: crypto.randomUUID(),
    resourceType: type,
    resourceId,
    version,
    sessionId,
    occurredAt: new Date().toISOString(),
  };
}

function dispatch(event: DomainEvent) {
  if (event.type === 'nft.updated') {
    const payload: NftUpdatedEvent = {
      type: 'nft.updated',
      meta: meta('nft', event.nft.id, event.nft.version, null),
      payload: { nft: event.nft },
    };
    for (const connection of connections.values()) connection.emit('nft.updated', payload);
    return;
  }

  for (const connection of connections.values()) {
    if (connection.userId !== event.userId) continue;
    const payload: OrderUpdatedEvent = {
      type: 'order.updated',
      meta: meta('order', event.order.id, event.order.version, connection.sessionId),
      payload: { orderId: event.order.id, order: event.order },
    };
    connection.emit('order.updated', payload);
  }

  // Liquidação do pedido pendente: o pagamento é confirmado/recusado após o tempo simulado.
  if (event.order.status === 'pending' && !scheduled.has(event.order.id)) {
    scheduled.add(event.order.id);
    setTimeout(() => {
      try {
        mockDomain.finalizeOrder(event.order.id);
      } finally {
        scheduled.delete(event.order.id);
      }
    }, ORDER_SETTLE_MS);
  }
}

mockDomain.subscribe(dispatch);

export const socketHub = {
  register(connection: HubConnection) {
    connections.set(connection.id, connection);
  },
  authenticate(id: string, token: string | null | undefined) {
    const connection = connections.get(id);
    if (!connection) return;
    connection.userId = mockDomain.sessionUserId(token);
    connection.sessionId = connection.userId ? (token ?? null) : null;
  },
  unregister(id: string) {
    connections.delete(id);
  },
  get size() {
    return connections.size;
  },
  /** Derruba todas as conexões (o cliente reconecta sozinho): simula queda de rede. */
  disconnectAll() {
    for (const connection of connections.values()) connection.close();
  },
  /** Envia um evento arbitrário a todos (duplicado, antigo, de outra sessão) para os testes. */
  broadcast(event: RealtimeEvent) {
    for (const connection of connections.values()) connection.emit(event.type, event);
  },
  /** Evento `nft.updated` com versão antiga (já superada) para testar descarte de eventos velhos. */
  staleNft(nftId: string) {
    const nft = mockDatabase.getNft(nftId);
    if (!nft) return false;
    const event: NftUpdatedEvent = {
      type: 'nft.updated',
      meta: meta('nft', nft.id, Math.max(1, nft.version - 1), null),
      payload: { nft: { ...nft, priceEth: '99.99', version: Math.max(1, nft.version - 1) } },
    };
    this.broadcast(event);
    return true;
  },
};

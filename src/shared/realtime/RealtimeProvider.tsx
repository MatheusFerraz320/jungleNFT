import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { getToken, subscribeToken } from '@/shared/api/client-identity';
import { env } from '@/shared/config/env';
import { RealtimeEventSchema, type RealtimeEvent } from '@/shared/contracts';
import { createAppSocket } from './socket';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type EventListener = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  status: RealtimeStatus;
  scenario: string;
  subscribe: (listener: EventListener) => () => void;
  onReconnect: (listener: () => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const DOMAIN_EVENTS = ['nft.updated', 'order.updated'] as const;

/**
 * Conexão Socket.IO da aplicação. A conexão é recriada a cada troca de sessão (login, logout,
 * expiração): os listeners da sessão anterior são removidos e o socket antigo é encerrado, e
 * eventos marcados com outra sessão são descartados — nunca atualizam dados de outro usuário.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeToken, getToken, () => null);
  const [status, setStatus] = useState<RealtimeStatus>(() =>
    env.mocksEnabled ? 'connecting' : 'idle',
  );
  const [scenario, setScenario] = useState(env.defaultScenario);
  const eventListeners = useRef(new Set<EventListener>());
  const reconnectListeners = useRef(new Set<() => void>());

  useEffect(() => {
    if (!env.mocksEnabled) return;

    let cancelled = false;
    let socket: Socket | null = null;
    let connectedBefore = false;

    const handleConnect = () => {
      setStatus('connected');
      socket?.emit('scene:subscribe', { sessionId: token, token });

      // Após uma reconexão, a UI reconcilia os recursos ativos com a API REST.
      if (connectedBefore) reconnectListeners.current.forEach((listener) => listener());
      connectedBefore = true;
    };
    const handleDisconnect = () => setStatus('disconnected');
    const handleConnectError = () => setStatus('error');
    const handleReady = (event: unknown) => {
      if (
        typeof event === 'object' &&
        event !== null &&
        'payload' in event &&
        typeof event.payload === 'object' &&
        event.payload !== null &&
        'scenario' in event.payload &&
        typeof event.payload.scenario === 'string'
      ) {
        setScenario(event.payload.scenario);
      }
    };
    const handleDomainEvent = (raw: unknown) => {
      const parsed = RealtimeEventSchema.safeParse(raw);
      if (!parsed.success) return;

      const { sessionId } = parsed.data.meta;
      if (sessionId !== null && sessionId !== token) return; // sessão anterior/outro usuário

      eventListeners.current.forEach((listener) => listener(parsed.data));
    };

    void createAppSocket().then((created) => {
      if (cancelled) {
        created.disconnect();
        return;
      }

      socket = created;
      setStatus('connecting');
      created.on('connect', handleConnect);
      created.on('disconnect', handleDisconnect);
      created.on('connect_error', handleConnectError);
      created.on('scene:ready', handleReady);
      for (const name of DOMAIN_EVENTS) created.on(name, handleDomainEvent);
      created.connect();
    });

    return () => {
      cancelled = true;
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('scene:ready', handleReady);
        for (const name of DOMAIN_EVENTS) socket.off(name, handleDomainEvent);
        socket.disconnect();
      }
    };
  }, [token]);

  // Funções estáveis: quem assina não precisa reassinar a cada mudança de status.
  const api = useMemo(
    () => ({
      subscribe: (listener: EventListener) => {
        eventListeners.current.add(listener);
        return () => {
          eventListeners.current.delete(listener);
        };
      },
      onReconnect: (listener: () => void) => {
        reconnectListeners.current.add(listener);
        return () => {
          reconnectListeners.current.delete(listener);
        };
      },
    }),
    [],
  );
  const value = useMemo<RealtimeContextValue>(
    () => ({ status, scenario, ...api }),
    [status, scenario, api],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime deve ser usado dentro de RealtimeProvider.');
  }

  return context;
}

/** Recebe eventos de domínio (já validados e filtrados por sessão) enquanto montado. */
export function useRealtimeEvents(handler: EventListener) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => subscribe((event) => handlerRef.current(event)), [subscribe]);
}

/** Executa `callback` sempre que o socket reconecta (reconciliação com a API REST). */
export function useRealtimeReconnect(callback: () => void) {
  const { onReconnect } = useRealtime();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => onReconnect(() => callbackRef.current()), [onReconnect]);
}

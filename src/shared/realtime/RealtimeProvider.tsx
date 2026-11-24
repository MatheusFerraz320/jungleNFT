import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { env } from '@/shared/config/env';
import { createAppSocket } from './socket';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface RealtimeContextValue {
  status: RealtimeStatus;
  scenario: string;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>(() =>
    env.mocksEnabled ? 'connecting' : 'idle',
  );
  const [scenario, setScenario] = useState(env.defaultScenario);

  useEffect(() => {
    if (!env.mocksEnabled) return;

    let cancelled = false;

    const connect = async () => {
      const socket = await createAppSocket();
      if (cancelled) {
        socket.disconnect();
        return;
      }

      socketRef.current = socket;

      const handleConnect = () => {
        setStatus('connected');
        socket.emit('scene:subscribe', { sessionId: null });
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

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('scene:ready', handleReady);
      socket.connect();
    };

    void connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo(() => ({ status, scenario }), [status, scenario]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime deve ser usado dentro de RealtimeProvider.');
  }

  return context;
}

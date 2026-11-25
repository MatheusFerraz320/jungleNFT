import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/features/auth';
import { type RealtimeEvent } from '@/shared/contracts';
import { createEventGuard } from '@/shared/lib/event-version';
import { applyNftUpdate, applyOrderUpdate } from './realtime-cache';
import { useRealtimeEvents, useRealtimeReconnect } from '@/shared/realtime';

/**
 * Ponte Socket.IO → TanStack Query. Eventos duplicados ou antigos são descartados antes de
 * qualquer efeito; após reconexão os recursos ativos são reconciliados com a API REST.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient();
  const userId = useCurrentUser()?.id ?? null;
  const guard = useRef(createEventGuard());

  // Nova sessão: nenhum estado de versão da sessão anterior pode influenciar a atual.
  useEffect(() => {
    guard.current.reset();
  }, [userId]);

  useRealtimeEvents((event: RealtimeEvent) => {
    if (event.type === 'scene.ready' || !guard.current.accept(event.meta)) return;

    if (event.type === 'nft.updated') applyNftUpdate(queryClient, event.payload.nft);
    else applyOrderUpdate(queryClient, event.payload.order);
  });

  useRealtimeReconnect(() => {
    void queryClient.invalidateQueries({ refetchType: 'active' });
  });

  return null;
}

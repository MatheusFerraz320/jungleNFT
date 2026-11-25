import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { setToken } from '@/shared/api/client-identity';
import { replaceSession } from '../session-cache';

/**
 * Trata a expiração de sessão (401) em qualquer ponto — navegação ou checkout: descarta o cache
 * privado e leva ao login com `redirect`, para que o fluxo seja retomado de onde parou.
 */
export function SessionWatcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    function handleExpired() {
      setToken(null);
      replaceSession(queryClient, null);
      toast.error('Sua sessão expirou. Entre novamente para continuar.');

      if (!href.startsWith('/login') && !href.startsWith('/cadastro')) {
        void navigate({ to: '/login', search: { redirect: href } });
      }
    }

    window.addEventListener('junglenft:unauthorized', handleExpired);
    return () => window.removeEventListener('junglenft:unauthorized', handleExpired);
  }, [href, navigate, queryClient]);

  return null;
}

import { useState } from 'react';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'rejected';

const CONNECT_MS = 700;

/**
 * Simulação de conexão de carteira (sem extensão real): conecta após um curto intervalo; o
 * provedor WalletConnect simula a recusa do usuário (determinístico, para testes).
 */
export function useWalletConnection() {
  const [state, setState] = useState<ConnectionState>('disconnected');

  async function connect(provider: string): Promise<boolean> {
    setState('connecting');
    await new Promise((resolve) => setTimeout(resolve, CONNECT_MS));

    if (provider === 'walletconnect') {
      setState('rejected');
      return false;
    }
    setState('connected');
    return true;
  }

  return { state, connect, disconnect: () => setState('disconnected') };
}

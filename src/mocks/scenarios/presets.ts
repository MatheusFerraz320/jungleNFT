export const scenarioIds = [
  'default',
  'empty',
  'slow',
  'out-of-order',
  'offline',
  'unauthorized',
  'session-expired',
  'registration-conflict',
  'invalid-coupon',
  'expired-coupon',
  'price-changed',
  'sold-out',
  'order-timeout',
  'payment-confirmed',
  'payment-rejected',
] as const;

export type ScenarioId = (typeof scenarioIds)[number];

export interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly label: string;
  readonly description: string;
  readonly latencyMs: number;
  readonly latencyVarianceMs: number;
}

export const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  default: {
    id: 'default',
    label: 'Padrão',
    description: 'Dados consistentes, sem falhas e com latência baixa.',
    latencyMs: 0,
    latencyVarianceMs: 0,
  },
  empty: {
    id: 'empty',
    label: 'Resultado vazio',
    description: 'O catálogo não encontra itens para os filtros selecionados.',
    latencyMs: 120,
    latencyVarianceMs: 40,
  },
  slow: {
    id: 'slow',
    label: 'Rede lenta',
    description: 'Latência fixa para validar skeletons e estados de carregamento.',
    latencyMs: 1_800,
    latencyVarianceMs: 250,
  },
  'out-of-order': {
    id: 'out-of-order',
    label: 'Respostas fora de ordem',
    description: 'Latência variável para testar descarte de respostas obsoletas.',
    latencyMs: 250,
    latencyVarianceMs: 1_200,
  },
  offline: {
    id: 'offline',
    label: 'Sem conexão',
    description: 'As chamadas REST falham como erro de rede.',
    latencyMs: 0,
    latencyVarianceMs: 0,
  },
  unauthorized: {
    id: 'unauthorized',
    label: 'Acesso não autorizado',
    description: 'Recursos privados retornam 403.',
    latencyMs: 80,
    latencyVarianceMs: 20,
  },
  'session-expired': {
    id: 'session-expired',
    label: 'Sessão expirada',
    description: 'Recursos privados retornam 401 e exigem novo login.',
    latencyMs: 80,
    latencyVarianceMs: 20,
  },
  'registration-conflict': {
    id: 'registration-conflict',
    label: 'Conflito de cadastro',
    description: 'O e-mail informado já pertence a outro colecionador.',
    latencyMs: 100,
    latencyVarianceMs: 20,
  },
  'invalid-coupon': {
    id: 'invalid-coupon',
    label: 'Cupom inválido',
    description: 'A validação do cupom retorna 422.',
    latencyMs: 100,
    latencyVarianceMs: 20,
  },
  'expired-coupon': {
    id: 'expired-coupon',
    label: 'Cupom expirado',
    description: 'O cupom existe, mas não está mais válido.',
    latencyMs: 100,
    latencyVarianceMs: 20,
  },
  'price-changed': {
    id: 'price-changed',
    label: 'Preço alterado',
    description: 'O preço do NFT muda durante o checkout e invalida a cotação.',
    latencyMs: 100,
    latencyVarianceMs: 20,
  },
  'sold-out': {
    id: 'sold-out',
    label: 'Edição esgotada',
    description: 'A edição selecionada fica indisponível durante a compra.',
    latencyMs: 100,
    latencyVarianceMs: 20,
  },
  'order-timeout': {
    id: 'order-timeout',
    label: 'Timeout após criar pedido',
    description:
      'O pedido é criado, mas a resposta é perdida (504); repetir com a mesma Idempotency-Key o recupera.',
    latencyMs: 0,
    latencyVarianceMs: 0,
  },
  'payment-confirmed': {
    id: 'payment-confirmed',
    label: 'Pagamento confirmado',
    description: 'O pedido avança de pendente para confirmado.',
    latencyMs: 600,
    latencyVarianceMs: 100,
  },
  'payment-rejected': {
    id: 'payment-rejected',
    label: 'Pagamento recusado',
    description: 'A simulação recusa o pagamento e preserva o carrinho.',
    latencyMs: 600,
    latencyVarianceMs: 100,
  },
};

export function isScenarioId(value: string): value is ScenarioId {
  return scenarioIds.includes(value as ScenarioId);
}

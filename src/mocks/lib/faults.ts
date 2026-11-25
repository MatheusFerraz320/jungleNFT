/**
 * Falhas injetáveis e determinísticas: `POST /api/mocks/faults` registra que as próximas `times`
 * chamadas a `METHOD /caminho` respondem com `status`. Usadas por testes (ex.: falha de favorito).
 */
export interface FaultRule {
  method: string;
  path: string;
  status: number;
  remaining: number;
}

let rules: FaultRule[] = [];

export function addFault(rule: FaultRule) {
  rules = [...rules, rule];
}

export function clearFaults() {
  rules = [];
}

export function consumeFault(method: string, pathname: string) {
  const rule = rules.find(
    (item) =>
      item.remaining > 0 &&
      item.method.toUpperCase() === method.toUpperCase() &&
      pathname.replace(/^.*\/api/, '').startsWith(item.path),
  );
  if (!rule) return null;

  rule.remaining -= 1;
  return rule;
}

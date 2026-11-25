/**
 * Realtime payloads carry a monotonic version. Equal versions are duplicates;
 * lower versions are stale and must never roll the cache back.
 */
export function shouldAcceptIncomingVersion(
  currentVersion: number | undefined,
  incomingVersion: number,
) {
  return currentVersion === undefined || incomingVersion > currentVersion;
}

export interface GuardedEventMeta {
  eventId: string;
  resourceType: string;
  resourceId: string;
  version: number;
}

/**
 * Filtro de eventos de tempo real: descarta duplicatas (mesmo `eventId`) e eventos antigos
 * (versão não superior à já aplicada para o recurso), sem nunca regredir um estado mais recente
 * nem reaplicar efeitos.
 */
export function createEventGuard(maxRemembered = 500) {
  const seen = new Set<string>();
  const versions = new Map<string, number>();

  return {
    accept(meta: GuardedEventMeta) {
      if (seen.has(meta.eventId)) return false;

      seen.add(meta.eventId);
      if (seen.size > maxRemembered) {
        const oldest = seen.values().next().value;
        if (oldest !== undefined) seen.delete(oldest);
      }

      const key = `${meta.resourceType}:${meta.resourceId}`;
      if (!shouldAcceptIncomingVersion(versions.get(key), meta.version)) return false;

      versions.set(key, meta.version);
      return true;
    },
    reset() {
      seen.clear();
      versions.clear();
    },
  };
}

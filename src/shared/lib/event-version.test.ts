import { describe, expect, it } from 'vitest';
import { createEventGuard, shouldAcceptIncomingVersion } from './event-version';

describe('shouldAcceptIncomingVersion', () => {
  it('accepts the first event', () => {
    expect(shouldAcceptIncomingVersion(undefined, 1)).toBe(true);
  });

  it('accepts only strictly newer versions', () => {
    expect(shouldAcceptIncomingVersion(2, 3)).toBe(true);
    expect(shouldAcceptIncomingVersion(3, 3)).toBe(false);
    expect(shouldAcceptIncomingVersion(4, 3)).toBe(false);
  });
});

describe('createEventGuard', () => {
  const meta = (eventId: string, version: number, resourceId = 'nft-1') => ({
    eventId,
    resourceType: 'nft',
    resourceId,
    version,
  });

  it('descarta duplicatas pelo eventId', () => {
    const guard = createEventGuard();
    expect(guard.accept(meta('a', 2))).toBe(true);
    expect(guard.accept(meta('a', 2))).toBe(false);
  });

  it('descarta eventos antigos sem regredir o estado mais recente', () => {
    const guard = createEventGuard();
    expect(guard.accept(meta('a', 5))).toBe(true);
    expect(guard.accept(meta('b', 3))).toBe(false);
    expect(guard.accept(meta('c', 5))).toBe(false);
    expect(guard.accept(meta('d', 6))).toBe(true);
  });

  it('controla versões por recurso e pode ser reiniciado', () => {
    const guard = createEventGuard();
    expect(guard.accept(meta('a', 5, 'nft-1'))).toBe(true);
    expect(guard.accept(meta('b', 1, 'nft-2'))).toBe(true);
    guard.reset();
    expect(guard.accept(meta('a', 1, 'nft-1'))).toBe(true);
  });

  it('limita a memória de eventos vistos', () => {
    const guard = createEventGuard(2);
    guard.accept(meta('a', 1, 'r1'));
    guard.accept(meta('b', 1, 'r2'));
    guard.accept(meta('c', 1, 'r3'));
    expect(guard.accept(meta('a', 1, 'r4'))).toBe(true);
  });
});

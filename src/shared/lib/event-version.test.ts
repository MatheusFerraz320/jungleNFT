import { describe, expect, it } from 'vitest';
import { shouldAcceptIncomingVersion } from './event-version';

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

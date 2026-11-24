import { describe, expect, it } from 'vitest';
import { formatEth, multiplyEth, parseEth, sumEth } from './decimal';

describe('ETH decimal helpers', () => {
  it('keeps decimal precision as strings', () => {
    expect(multiplyEth('0.100000000000000001', 3).toFixed(18)).toBe('0.300000000000000003');
  });

  it('sums values without floating-point drift', () => {
    expect(sumEth(['0.1', '0.2']).toFixed()).toBe('0.3');
  });

  it('rejects negative or malformed amounts', () => {
    expect(() => parseEth('-1')).toThrow();
    expect(() => parseEth('01.2')).toThrow();
  });

  it('formats values for pt-BR display', () => {
    expect(formatEth('1.23456')).toBe('1,2346');
  });
});

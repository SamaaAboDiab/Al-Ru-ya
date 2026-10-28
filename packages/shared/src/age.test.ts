import { describe, expect, it } from 'vitest';
import { ageInYears } from './age';

describe('ageInYears', () => {
  const now = new Date('2026-10-28T12:00:00Z');

  it('counts the birthday itself as a full year', () => {
    expect(ageInYears('2016-10-28', now)).toBe(10);
  });

  it('does not count a year before the birthday', () => {
    expect(ageInYears('2016-10-29', now)).toBe(9);
  });

  it('handles earlier months', () => {
    expect(ageInYears('2016-01-01', now)).toBe(10);
  });
});

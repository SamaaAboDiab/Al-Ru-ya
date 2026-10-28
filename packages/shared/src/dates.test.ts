import { describe, expect, it } from 'vitest';
import { addDays, isIsoDate, nowIn, todayIn } from './dates';

describe('todayIn', () => {
  it('uses the family time zone, not UTC', () => {
    // 23:30 UTC on Oct 28 is already Oct 29 in Cairo (UTC+2 or +3).
    expect(todayIn('Africa/Cairo', new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-29');
    expect(todayIn('UTC', new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-28');
  });
});

describe('nowIn', () => {
  it('gives the local date and 24-hour time', () => {
    expect(nowIn('Africa/Cairo', new Date('2026-07-01T21:05:00Z'))).toEqual({ date: '2026-07-02', time: '00:05' });
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
});

describe('isIsoDate', () => {
  it('accepts only YYYY-MM-DD', () => {
    expect(isIsoDate('2026-10-28')).toBe(true);
    expect(isIsoDate('28-10-2026')).toBe(false);
    expect(isIsoDate('2026-13-40')).toBe(false);
  });
});

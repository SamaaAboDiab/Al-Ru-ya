import { describe, expect, it } from 'vitest';
import { formatEgyptMobile, normalizeEgyptMobile } from './phone';
import { phoneVerifySchema } from './schemas';

describe('Egyptian mobile numbers', () => {
  it('accepts the usual ways of writing one', () => {
    for (const input of ['01001234567', '+201001234567', '00201001234567', '201001234567', '0100 123 4567', '0100-123-4567', '٠١٠٠١٢٣٤٥٦٧']) {
      expect(normalizeEgyptMobile(input)).toBe('+201001234567');
    }
    for (const prefix of ['010', '011', '012', '015']) {
      expect(normalizeEgyptMobile(`${prefix}12345678`)).toBe(`+2${prefix}12345678`);
    }
  });

  it('rejects landlines, other countries and junk', () => {
    for (const input of ['0223456789', '01312345678', '0100123456', '010012345678', '+447700900123', '+12025550123', 'abc', '']) {
      expect(normalizeEgyptMobile(input)).toBeNull();
    }
  });

  it('formats for display', () => {
    expect(formatEgyptMobile('+201001234567')).toBe('0100 123 4567');
  });

  it('reads codes typed with Arabic digits or spaces', () => {
    expect(phoneVerifySchema.parse({ phone: '01001234567', code: '١٢٣ ٤٥٦' }).code).toBe('123456');
    expect(phoneVerifySchema.safeParse({ phone: '01001234567', code: '12345' }).success).toBe(false);
  });
});

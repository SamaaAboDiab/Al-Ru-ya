/** Arabic-Indic and Eastern Arabic-Indic digits, as typed on Arabic keyboards, become 0-9. */
export function toLatinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/**
 * An Egyptian mobile number in any common form (01x..., +201x..., 00201x..., with spaces,
 * dashes or Arabic digits) as E.164 (+201xxxxxxxxx), or null. Only Egyptian mobiles are
 * accepted: codes go out by SMS, and limiting where they can go blocks SMS-pumping fraud.
 */
export function normalizeEgyptMobile(value: string): string | null {
  const digits = toLatinDigits(value).replace(/[\s\-()]/g, '');
  const local = digits.replace(/^(?:\+20|0020|20)(?=1)/, '0');
  return /^01[0125]\d{8}$/.test(local) ? `+2${local}` : null;
}

/** +201001234567 → 0100 123 4567, the way people write it in Egypt. */
export function formatEgyptMobile(e164: string) {
  const local = e164.replace(/^\+20/, '0');
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

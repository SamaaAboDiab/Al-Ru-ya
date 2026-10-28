/** Whole years between a YYYY-MM-DD birth date and `now`, compared in UTC. */
export function ageInYears(birthDate: string, now: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = now.getUTCFullYear() - y;
  const beforeBirthday =
    now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

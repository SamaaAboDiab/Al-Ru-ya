/** Initial-letter avatar. The tone is derived from the id so each person keeps their color. */
export function Avatar({ name, id, size }: { name: string; id: string; size?: 'sm' | 'lg' }) {
  const tone = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
  return (
    <span className={size ? `avatar avatar-${size}` : 'avatar'} data-tone={tone} aria-hidden>
      {name.trim().charAt(0)}
    </span>
  );
}

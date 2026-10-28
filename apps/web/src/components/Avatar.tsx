/** Each person keeps one color, derived from their id. Used by avatars and the child's page band. */
export function toneOf(id: string) {
  return [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
}

/** Initial-letter avatar. */
export function Avatar({ name, id, size }: { name: string; id: string; size?: 'sm' | 'lg' | 'xl' }) {
  return (
    <span className={size ? `avatar avatar-${size}` : 'avatar'} data-tone={toneOf(id)} aria-hidden>
      {name.trim().charAt(0)}
    </span>
  );
}

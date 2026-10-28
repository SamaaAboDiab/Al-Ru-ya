/** Each person keeps one color, derived from their id. Used by avatars and the child's page band. */
export function toneOf(id: string) {
  return [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
}

/** The person's photo when they set one, otherwise their initial on their own color. */
export function Avatar({
  name,
  id,
  photo,
  size,
}: {
  name: string;
  id: string;
  photo?: string;
  size?: 'sm' | 'lg' | 'xl';
}) {
  return (
    <span className={size ? `avatar avatar-${size}` : 'avatar'} data-tone={toneOf(id)} aria-hidden>
      {photo ? (
        // A small, already-resized photo behind an auth check: next/image's optimizer would add nothing.
        <img className="avatar-img" src={photo} alt="" loading="lazy" decoding="async" />
      ) : (
        name.trim().charAt(0)
      )}
    </span>
  );
}

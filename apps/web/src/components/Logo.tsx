import { useId } from 'react';

/** Eye-shaped mark with a parent and child inside the iris. Colors come from CSS tokens. */
export function LogoMark({ size = 48, className }: { size?: number; className?: string }) {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 120 72"
      width={size}
      height={(size * 72) / 120}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M4 36C28 3 92 3 116 36C92 69 28 69 4 36Z" fill="var(--logo-eye)" />
      <circle cx="60" cy="36" r="26" fill="var(--logo-iris)" />
      <clipPath id={clipId}>
        <circle cx="60" cy="36" r="26" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="53" cy="24" r="7" fill="var(--logo-figure)" />
        <path d="M40 60q0-24 13-24q13 0 13 24z" fill="var(--logo-figure)" />
        <circle cx="70" cy="34" r="5.5" fill="var(--logo-accent)" />
        <path d="M60 62q0-19 10-19q10 0 10 19z" fill="var(--logo-accent)" />
      </g>
    </svg>
  );
}

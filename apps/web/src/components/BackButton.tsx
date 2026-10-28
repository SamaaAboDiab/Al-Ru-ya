import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/** Round back button that sits beside the page title. Points right in Arabic, left in English. */
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="icon-btn back-btn" aria-label={label} title={label}>
      <ArrowLeft size={20} aria-hidden className="rtl-flip" />
    </Link>
  );
}

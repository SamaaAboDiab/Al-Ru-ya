import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-link">
      <ArrowLeft size={18} aria-hidden className="rtl-flip" />
      {label}
    </Link>
  );
}

import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Readex_Pro } from 'next/font/google';
import { dir } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/server';
import './globals.css';

/** Body text: a humanist Arabic/Latin pair that stays readable at small sizes. */
const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

/** Headings, names and numbers: a wide geometric face that gives the brand its voice. */
const readex = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.appName, description: t.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)} className={`${plex.variable} ${readex.variable}`}>
      <body>{children}</body>
    </html>
  );
}

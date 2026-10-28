import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { dir } from '@/lib/i18n';
import { getDictionary, getLocale } from '@/lib/server';
import './globals.css';

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.appName, description: t.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)} className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}

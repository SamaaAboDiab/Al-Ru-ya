import { ChevronDown } from 'lucide-react';
import { redirect } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { dictionaries } from '@/lib/i18n';
import { getCurrentUser, getLocale } from '@/lib/server';

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const locale = await getLocale();
  const a = dictionaries[locale].account;

  return (
    <>
      <main className="page page-narrow">
        <div className="page-head">
          <BackButton href="/account" label={a.title} />
          <div>
            <h1 className="page-title">{a.help}</h1>
            <p className="page-subtitle">{a.helpSubtitle}</p>
          </div>
        </div>

        <div className="faq">
          {a.faq.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden className="faq-chevron" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}

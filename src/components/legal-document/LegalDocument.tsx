import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { CONTACT_EMAIL, DATA_CONTROLLER } from '@/lib/siteUrl'

export type LegalText = {
  title: string
  updated: string
  intro: string
  back: string
  sections: { heading: string; body: string[] }[]
}

/** A legal page — the privacy policy or the terms — with who answers for it and how to reach them. */
export default function LegalDocument({ doc }: { doc: LegalText }) {
  const { T } = useLanguage()

  return (
    <main className="min-h-screen bg-bg-main text-text-main px-4 sm:px-6 py-12 sm:py-16">
      <article className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">{doc.title}</h1>
          <p className="text-xs text-text-secondary">{doc.updated}</p>
          <p className="text-sm text-text-secondary">{doc.intro}</p>
        </header>

        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm text-text-secondary leading-relaxed">{paragraph}</p>
            ))}
          </section>
        ))}

        <dl className="text-sm flex flex-col gap-1">
          <div>
            <dt className="inline font-semibold">{T.privacy.controller}:</dt> <dd className="inline">{DATA_CONTROLLER}</dd>
          </div>
          {CONTACT_EMAIL && (
            <div>
              <dt className="inline font-semibold">{T.privacy.contact}:</dt>{' '}
              <dd className="inline">
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>
              </dd>
            </div>
          )}
        </dl>

        <Link
          href="/"
          className="self-start px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {doc.back}
        </Link>
      </article>
    </main>
  )
}

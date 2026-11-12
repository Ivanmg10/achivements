import { useLanguage } from '@/context/LanguageContext'
import { CONTACT_EMAIL, DATA_CONTROLLER } from '@/lib/siteUrl'
import Button from '@/components/ui/Button'
import PublicShell from '@/components/public-shell/PublicShell'

export type LegalText = {
  title: string
  updated: string
  intro: string
  back: string
  /** A section is paragraphs, or `parts` with a subheading each (a long one, like what the site keeps). */
  sections: { heading: string; body?: string[]; parts?: { heading: string; body: string[] }[] }[]
}

const PARAGRAPH = 'text-sm text-text-secondary leading-relaxed'

/**
 * A legal page (the privacy policy or the terms) with who answers for it and how to reach them,
 * inside the visitors' bar and footer like every public page. `path` is where it lives.
 */
export default function LegalDocument({ doc, path }: { doc: LegalText; path: string }) {
  const { T } = useLanguage()

  return (
    <PublicShell current={path}>
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-8 enter-rows">
        <header className="flex flex-col gap-2">
          <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1">{doc.title}</h1>
          <p className="text-xs text-text-secondary">{doc.updated}</p>
          <p className="text-sm text-text-secondary">{doc.intro}</p>
        </header>

        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body?.map((paragraph) => (
              <p key={paragraph} className={PARAGRAPH}>{paragraph}</p>
            ))}
            {section.parts?.map((part) => (
              <div key={part.heading} className="flex flex-col gap-2 mt-2">
                <h3 className="text-sm font-semibold text-text-main">{part.heading}</h3>
                {part.body.map((paragraph) => (
                  <p key={paragraph} className={PARAGRAPH}>{paragraph}</p>
                ))}
              </div>
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

        <Button
          href="/"
          className="self-start"
        >
          {doc.back}
        </Button>
      </article>
    </PublicShell>
  )
}

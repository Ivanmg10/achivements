import type { ComponentProps, ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import MainPageProfileActions from '../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileCard from '../main-page-profile-card/MainPageProfileCard'
import MainPageProfileError from '../main-page-profile-error/MainPageProfileError'
import MainPageProfileSkeleton from '../main-page-profile-skeleton/MainPageProfileSkeleton'

type Shown = Omit<ComponentProps<typeof MainPageProfileCard>, 'actions'> & {
  /** The link out to the account on the platform; none leaves the corner without it. */
  link: { href: string; label: string; ringClass: string } | null
}

/**
 * A linked platform's profile column, the same for Steam, PlayStation and Xbox: a skeleton while the
 * account loads, the error card when it cannot be read (`failure`), else the card, the game played
 * last and the latest unlocks. What each platform tells is its adapter's; this keeps the order and the
 * room, so switching tabs does not resize the column.
 */
export default function MainPageProfileLinked(
  props: { isLoading: boolean } & (
    | { failure: ComponentProps<typeof MainPageProfileError>; card?: undefined }
    | {
        failure?: null
        card: Shown
        /** Asks everything the profile shows again; only on the viewer's own page. */
        onRefresh: () => void
        /** The game played last, or the skeleton that holds its place while the library loads. */
        game: ReactNode
        recent: ReactNode
      }
  ),
) {
  const { T } = useLanguage()
  const subject = useSubject()
  if (props.isLoading) return <MainPageProfileSkeleton label={T.cards.loading} />
  if (!props.card) return <MainPageProfileError {...props.failure} />

  const { card, onRefresh, game, recent } = props
  const { link, ...rest } = card
  return (
    // Fills the column like the RA card, so switching tabs does not resize it.
    <div className="flex flex-col gap-3.5 w-full h-full">
      <MainPageProfileCard
        {...rest}
        actions={link && <MainPageProfileActions href={link.href} linkLabel={link.label} ringClass={link.ringClass} onRefresh={subject ? undefined : onRefresh} />}
      />
      {game}
      {/* Someone's page lists their latest unlocks itself (#130): the column does not say them a second time. */}
      {subject ? null : recent}
    </div>
  )
}

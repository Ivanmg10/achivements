import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { IconArrowRight, IconGenderBigender, IconMapPin, IconPhoto, IconUserShare } from '@tabler/icons-react'
import type { WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import { findCountry } from '@/utils/countries'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import UserProfileSwitch from '@/components/user-page/user-profile-switch/UserProfileSwitch'
import UserDescriptionField from '@/components/user-page/user-description-field/UserDescriptionField'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import WelcomePageProfilePreview from '@/components/welcome-page/welcome-page-profile-preview/WelcomePageProfilePreview'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/welcome-page/welcomeArt'

// The account page's own pickers, downloaded the first time they are opened.
const EditProfileModal = dynamic(() => import('@/components/edit-profile-modal/EditProfileModal'), { loading: () => null })
const LocationModal = dynamic(() => import('@/components/location-modal/LocationModal'), { loading: () => null })
const GenderModal = dynamic(() => import('@/components/gender-modal/GenderModal'), { loading: () => null })

const GENDER_KEYS = { male: 'genderMale', female: 'genderFemale', neutral: 'genderNeutral' } as const

type Picker = 'avatar' | 'location' | 'gender' | null

/**
 * What others see of the person: picture, country, gender (and whether it
 * shows) and a description, with the account page's own fields and pickers,
 * each saved as it changes. The card on the right follows along.
 */
export default function WelcomePageProfile({
  onNext,
  onSkip,
  onBack,
  direction,
  focusTitle,
}: {
  onNext: () => void
  onSkip: () => void
  onBack: () => void
  direction: WelcomeDirection
  focusTitle: boolean
}) {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const [open, setOpen] = useState<Picker>(null)
  const user = session?.user
  const country = user?.location ? findCountry(user.location) : undefined
  const close = () => setOpen(null)

  return (
    <WelcomePageStep
      kicker={T.welcome.profile.kicker}
      title={T.welcome.profile.title}
      body={T.welcome.profile.body}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={T.welcome.profile.preview}
      aside={<WelcomePageProfilePreview />}
      actions={
        <>
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {T.welcome.next}
            <IconArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={onSkip} className={SECONDARY_BUTTON}>
            {T.welcome.skipStep}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
          <ProfileField
            label={T.welcome.profile.photo}
            icon={<IconPhoto size={18} />}
            value={user?.avatar ? T.welcome.done.profileDone : null}
            empty={T.userData.notSet}
            onEdit={() => setOpen('avatar')}
          />
          <ProfileField
            label={T.userData.location}
            icon={<IconMapPin size={18} />}
            value={country?.name ?? null}
            empty={T.userData.notSet}
            onEdit={() => setOpen('location')}
          />
          <ProfileField
            label={T.userData.gender}
            icon={<IconGenderBigender size={18} />}
            value={user?.gender ? T.userData[GENDER_KEYS[user.gender]] : null}
            empty={T.userData.notSet}
            onEdit={() => setOpen('gender')}
          />
        </div>
        {user?.gender && (
          <UserProfileSwitch
            field="genderPublic"
            checked={user.genderPublic === true}
            label={T.userData.genderPublic}
            onText={T.userData.genderPublicOn}
            offText={T.userData.genderPublicOff}
            icon={<IconUserShare size={18} />}
          />
        )}
        <UserDescriptionField />
      </div>

      <LazyWhenOpened open={open === 'avatar'}>
        <EditProfileModal isOpen={open === 'avatar'} onClose={close} field="avatar" currentValue={user?.avatar ?? ''} />
      </LazyWhenOpened>
      <LazyWhenOpened open={open === 'location'}>
        <LocationModal isOpen={open === 'location'} onClose={close} currentCode={user?.location} />
      </LazyWhenOpened>
      <LazyWhenOpened open={open === 'gender'}>
        <GenderModal isOpen={open === 'gender'} onClose={close} current={user?.gender} />
      </LazyWhenOpened>
    </WelcomePageStep>
  )
}

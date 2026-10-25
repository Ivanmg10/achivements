import { IconLock, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import ChoiceCards from '@/components/ui/ChoiceCards'

/** Private or public, as two options that say who will see the group. */
export default function GroupModalVisibility({ isPublic, onChange }: { isPublic: boolean; onChange: (isPublic: boolean) => void }) {
  const { T } = useLanguage()
  const options = [
    { value: false, label: T.groups.private, hint: T.groups.privateHint, Icon: IconLock },
    { value: true, label: T.groups.public, hint: T.groups.publicHint, Icon: IconWorld },
  ]

  return <ChoiceCards legend={T.groups.visibilityLabel} value={isPublic} onChange={onChange} options={options.map(({ Icon, ...o }) => ({ ...o, icon: Icon }))} />
}

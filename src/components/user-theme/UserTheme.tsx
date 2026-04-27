import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Theme } from '@/types/types'
import { useSession } from 'next-auth/react'

const THEMES: { id: Theme; label: string; cls: string }[] = [
  { id: 'dark',   label: 'Dark',   cls: 'button-dark'   },
  { id: 'light',  label: 'Light',  cls: 'button-light'  },
  { id: 'blue',   label: 'Blue',   cls: 'button-blue'   },
  { id: 'purple', label: 'Purple', cls: 'button-purple' },
  { id: 'red',    label: 'Red',    cls: 'button-red'    },
  { id: 'green',  label: 'Green',  cls: 'button-green'  },
  { id: 'yellow', label: 'Yellow', cls: 'button-yellow' },
  { id: 'teal',   label: 'Teal',   cls: 'button-teal'   },
]

export default function UserTheme() {
  const { theme, setTheme } = useTheme()
  const { update } = useSession()
  const { T } = useLanguage()

  async function handleSelect(id: Theme) {
    setTheme(id)
    await fetch('/api/updateTheme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: id }),
    })
    await update({ theme: id })
  }

  return (
    <article className="p-5 flex flex-col gap-5 items-center justify-center bg-bg-card rounded-3xl">
      <h1 className="text-2xl w-full">{T.userTheme.theme}</h1>
      <div className="grid grid-cols-2 gap-3 w-full">
        {THEMES.map(({ id, label, cls }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`${cls} py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between gap-2`}
          >
            {label}
            {theme === id && <span className="w-2 h-2 rounded-full bg-current opacity-80" />}
          </button>
        ))}
      </div>
    </article>
  )
}

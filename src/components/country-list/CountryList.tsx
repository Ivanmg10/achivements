import { codeToFlag, type Country } from '@/utils/countries'

/**
 * The countries to pick from, with their flag: one list for the profile's location dialog and the admin's
 * editor. `countries` is already searched and named (`searchCountries`); the one chosen is pressed.
 */
export default function CountryList({
  countries,
  value,
  onPick,
  empty,
  disabled = false,
}: {
  countries: Country[]
  value?: string | null
  onPick: (code: string) => void
  empty: string
  disabled?: boolean
}) {
  if (countries.length === 0) return <p className="text-sm text-text-secondary text-center py-4">{empty}</p>
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {countries.map((country) => {
        const chosen = value === country.code
        return (
          <button
            key={country.code}
            type="button"
            onClick={() => onPick(country.code)}
            disabled={disabled}
            aria-pressed={chosen}
            className={`flex items-center gap-2 px-3 py-3 rounded-tile transition-colors disabled:opacity-50 focus-ring ${
              chosen ? 'bg-accent text-bg-main' : 'bg-bg-main hover:bg-bg-card text-text-main'
            }`}
          >
            <span className="text-xl shrink-0" aria-hidden="true">{codeToFlag(country.code)}</span>
            <span className="text-sm font-medium text-left min-w-0 line-clamp-2">{country.name}</span>
          </button>
        )
      })}
    </div>
  )
}

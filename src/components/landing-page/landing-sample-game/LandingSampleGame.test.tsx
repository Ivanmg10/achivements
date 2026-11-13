import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingSampleGame from './LandingSampleGame'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

jest.mock('@/components/landing-page/landing-sample-expanded/LandingSampleExpanded', () => ({
  __esModule: true,
  default: ({ appId }: { appId: number }) => <p>opened {appId}</p>,
}))

const psn = SAMPLE_GAMES.find((g) => g.source === 'psn')!
const steam = SAMPLE_GAMES.find((g) => g.appId !== undefined)!
const row = (game = psn, open = false, onToggle = () => {}) => render(<ul><LandingSampleGame game={game} open={open} onToggle={onToggle} /></ul>)

test('a home feed row: the name, the platform, the bar and what it counts, in trophies on PlayStation', () => {
  row()
  expect(screen.getByText(psn.title)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: psn.title })).toBeInTheDocument()
  expect(screen.getByRole('listitem')).toHaveTextContent(`${psn.earned} of ${psn.total} trophies`)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('an example with no achievements in the sample stays closed: no button', () => {
  row()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('a Steam example opens on its achievements, and asks the library to', async () => {
  const onToggle = jest.fn()
  const { rerender } = row(steam, false, onToggle)
  await userEvent.click(screen.getByRole('button', { name: `${en.cards.showAchievements}: ${steam.title}` }))
  expect(onToggle).toHaveBeenCalledTimes(1)
  expect(screen.queryByText(`opened ${steam.appId}`)).not.toBeInTheDocument()
  rerender(<ul><LandingSampleGame game={steam} open onToggle={onToggle} /></ul>)
  expect(screen.getByText(`opened ${steam.appId}`)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.cards.hideAchievements}: ${steam.title}` })).toHaveAttribute('aria-expanded', 'true')
})

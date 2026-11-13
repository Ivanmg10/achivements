import { render, screen } from '@testing-library/react'
import LandingSampleAchievement from './LandingSampleAchievement'
import { en } from '@/translations/en'

const row = (earnedAt: string | null) =>
  render(
    <ul>
      <LandingSampleAchievement icon="https://example.test/a.jpg" name="Futurist" text="Complete every future level on Veteran." rarity={3.4} earnedAt={earnedAt} />
    </ul>,
  )

test('an earned one: ringed icon, its rarity and the day, as a machine-readable date', () => {
  const { container } = row('2026-09-10 18:00:00')
  expect(container.querySelector('img')).toHaveClass('ring-2')
  expect(screen.getByText('3.4 %')).toBeInTheDocument()
  expect(container.querySelector('time')).toHaveAttribute('dateTime', '2026-09-10T18:00:00.000Z')
})

test('one to get: grey icon and "not earned", no date; not a button', () => {
  const { container } = row(null)
  expect(container.querySelector('img')).toHaveClass('grayscale')
  expect(screen.getByText(en.userGame.notEarned)).toBeInTheDocument()
  expect(container.querySelector('time')).toBeNull()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

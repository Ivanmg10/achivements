import { render, screen } from '@testing-library/react'
import LandingSampleExpanded from './LandingSampleExpanded'
import { en } from '@/translations/en'

test('opened as the home opens a Steam game: the ring, the rarest earned and every achievement, none of it a link', async () => {
  render(<LandingSampleExpanded appId={202970} total={35} minutes={1800} />)
  expect(await screen.findByText(en.steam.rarestUnlocked)).toBeInTheDocument()
  expect(await screen.findByLabelText(`Futurist, ${en.steam.locked}`)).toBeInTheDocument()
  expect(screen.getAllByText(en.gameExpanded.allAchievements).length).toBeGreaterThan(0)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import LandingSampleRaExpanded from './LandingSampleRaExpanded'
import { en } from '@/translations/en'

test('opened as the home opens an RA game: the ring with the points, the rarest earned and every achievement, none of it a link', async () => {
  render(<LandingSampleRaExpanded gameId={576} total={72} />)
  expect(await screen.findByText(en.steam.rarestUnlocked)).toBeInTheDocument()
  expect(await screen.findByLabelText(`Be Nice, ${en.steam.earned}`)).toBeInTheDocument()
  expect(screen.getAllByText(en.gameExpanded.allAchievements).length).toBeGreaterThan(0)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import LandingSamplePsnExpanded from './LandingSamplePsnExpanded'
import { en } from '@/translations/en'

test('opened as the home opens a PSN game: the trophies by grade, the rarest earned and every trophy, none of it a link', async () => {
  render(<LandingSamplePsnExpanded set="NPWR11436_00" total={51} />)
  expect(await screen.findByText(en.psn.rarestEarned)).toBeInTheDocument()
  expect(await screen.findByLabelText(`Julius Caesar, ${en.psn.platinum}, ${en.psn.earned}`)).toBeInTheDocument()
  expect(screen.getAllByText(en.psn.trophies).length).toBeGreaterThan(0)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

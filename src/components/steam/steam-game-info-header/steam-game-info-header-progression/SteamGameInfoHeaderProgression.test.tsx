import { render, screen } from '@testing-library/react'
import SteamGameInfoHeaderProgression from './SteamGameInfoHeaderProgression'

describe('SteamGameInfoHeaderProgression', () => {
  test('shows percentage and count with a labelled bar', () => {
    render(<SteamGameInfoHeaderProgression earned={21} total={84} label="Fallout 4" />)
    expect(screen.getByText('25.0%')).toBeInTheDocument()
    expect(screen.getByText('21 / 84')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Fallout 4' }).getAttribute('aria-valuenow')).toBe('25')
  })

  test('rounds the ends and copes with no achievements', () => {
    const { rerender } = render(<SteamGameInfoHeaderProgression earned={84} total={84} label="x" />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    rerender(<SteamGameInfoHeaderProgression earned={0} total={0} label="x" />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})

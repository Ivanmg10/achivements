import { render, screen } from '@testing-library/react'
import VaultPlatformSplit from './VaultPlatformSplit'

test('one bar whose name says each share, so it never rests on the colours', () => {
  const { container } = render(<VaultPlatformSplit split={{ ra: 750, psn: 250 }} />)
  expect(screen.getByRole('img', { name: 'RA 75 %, PSN 25 %' })).toBeInTheDocument()
  expect(container).not.toHaveTextContent('RA')
})

test('with a legend, each platform\'s name under the bar, in its order, and nothing for a platform without points', () => {
  const { container } = render(<VaultPlatformSplit split={{ ra: 750, steam: 0, psn: 250 }} legend />)
  expect(screen.getByRole('img', { name: 'RA 75 %, PSN 25 %' })).toBeInTheDocument()
  expect(container).toHaveTextContent(/^RAPSN$/)
})

test('no points: an empty bar and no legend', () => {
  const { container } = render(<VaultPlatformSplit split={{}} legend />)
  expect(screen.getByRole('img', { name: '0' })).toBeInTheDocument()
  expect(container.textContent).toBe('')
})

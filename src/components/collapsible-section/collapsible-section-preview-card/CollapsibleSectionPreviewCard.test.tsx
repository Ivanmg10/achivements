import { render, screen } from '@testing-library/react'
import CollapsibleSectionPreviewCard from './CollapsibleSectionPreviewCard'

test('a PSN game previews with its icon, its page and its progress', () => {
  const { container } = render(
    <CollapsibleSectionPreviewCard
      game={{ key: 'psn:2018800', source: 'psn', id: 2018800, title: 'Astro Bot', subtitle: 'PlayStation', imageRef: 'https://p.png', pct: 100 }}
    />,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/psnGame/NPWR20188_00')
  expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '100')
  expect(container.querySelector('img[src="https://p.png"]')).toBeInTheDocument()
})

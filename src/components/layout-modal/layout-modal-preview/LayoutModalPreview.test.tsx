import { render, screen } from '@testing-library/react'
import LayoutModalPreview from './LayoutModalPreview'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('the sample home carries the chosen design and font', () => {
  localStorage.setItem('shape-style', 'round')
  localStorage.setItem('font-style', 'fira')
  localStorage.setItem('home-layout', 'cover')
  localStorage.setItem('game-card-style', 'flat')

  const { container } = render(<LayoutModalPreview />)
  const preview = screen.getByRole('region', { name: en.homeLayout.previewLabel })

  expect(preview).toHaveAttribute('data-shape', 'round')
  expect(preview).toHaveAttribute('data-font', 'fira')
  expect(container.querySelector('[data-layout="cover"]')).toBeInTheDocument()
  expect(container.querySelector('[data-cards="flat"]')).toBeInTheDocument()
})

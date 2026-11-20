import { fireEvent, render, screen } from '@testing-library/react'
import RankingsPageToolbar from './RankingsPageToolbar'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

const view = { scope: 'global', period: 'all', source: 'all', sort: 'points' } as const

test('the platforms are one row that scrolls on a phone, the rule before Period only where they sit beside it', () => {
  render(<RankingsPageToolbar view={view} onChange={jest.fn()} signedIn xbox />)
  const platforms = screen.getByRole('group', { name: 'Platform' })
  expect(platforms).toHaveClass('overflow-x-auto', 'max-lg:basis-full')
  expect(platforms).not.toHaveClass('flex-wrap')
  expect(platforms.className).not.toMatch(/(^|\s)shadow-\[/)
  expect(platforms.className).toMatch(/lg:shadow-\[/)
})

test('Xbox only for whoever may see it; a chip picks its platform', () => {
  const onChange = jest.fn()
  const { rerender } = render(<RankingsPageToolbar view={view} onChange={onChange} signedIn xbox={false} />)
  expect(screen.queryByRole('button', { name: 'Xbox' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Steam' }))
  expect(onChange).toHaveBeenCalledWith({ ...view, source: 'steam' })
  rerender(<RankingsPageToolbar view={view} onChange={onChange} signedIn xbox />)
  expect(screen.getByRole('button', { name: 'Xbox' })).toBeInTheDocument()
})

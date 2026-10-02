import { render, screen } from '@testing-library/react'
import GroupIconDisplay from './GroupIconDisplay'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => (
  <img src={src} alt={alt} {...props} />
))

describe('GroupIconDisplay', () => {
  it('renders folder emoji when no icon', () => {
    render(<GroupIconDisplay icon={null} />)
    expect(screen.getByText('📁')).toBeInTheDocument()
  })

  it('renders folder emoji when icon is undefined', () => {
    render(<GroupIconDisplay icon={undefined} />)
    expect(screen.getByText('📁')).toBeInTheDocument()
  })

  it('renders an img when icon is a URL', () => {
    render(<GroupIconDisplay icon="https://example.com/icon.png" />)
    // Decorative: the group's name sits right beside it.
    const img = screen.getByRole('presentation')
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png')
  })

  it('renders emoji text when icon is an emoji', () => {
    render(<GroupIconDisplay icon="🎮" />)
    expect(screen.getByText('🎮')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import GroupIconDisplay from './GroupIconDisplay'

jest.mock('next/image', () => ({ src, alt, ...props }: any) => (
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
    const img = screen.getByAltText('icon')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png')
  })

  it('renders emoji text when icon is an emoji', () => {
    render(<GroupIconDisplay icon="🎮" />)
    expect(screen.getByText('🎮')).toBeInTheDocument()
  })
})

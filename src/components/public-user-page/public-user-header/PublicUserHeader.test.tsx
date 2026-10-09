import { render, screen } from '@testing-library/react'
import PublicUserHeader from './PublicUserHeader'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: null, steam: false, psn: false }

test('shows the name, and nothing else when nothing else is set', () => {
  render(<PublicUserHeader user={USER} />)
  expect(screen.getByRole('heading', { name: 'ivan' })).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

test('shows the country and the description when set', () => {
  render(<PublicUserHeader user={{ ...USER, location: 'ES', description: 'Hola' }} />)
  expect(screen.getByText('Hola')).toBeInTheDocument()
  expect(screen.getByText(/Spain|España/)).toBeInTheDocument()
})

test('shows the avatar when there is one', () => {
  const { container } = render(<PublicUserHeader user={{ ...USER, avatar: 'https://x/a.png' }} />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://x/a.png')
})

import { render, screen } from '@testing-library/react'
import GroupModalPreview from './GroupModalPreview'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

test('the name as typed (or the placeholder), the games and who sees it', () => {
  const games = [{ source: 'steam', imageRef: 'https://cdn/a.jpg' }] as GameCandidate[]
  const { container, rerender } = render(<GroupModalPreview title="" icon="" isPublic={false} games={[]} />)
  expect(screen.getByText(en.groups.groupTitlePlaceholder)).toBeInTheDocument()
  rerender(<GroupModalPreview title="Backlog" icon="🎮" isPublic games={games} />)
  expect(screen.getByText('Backlog')).toBeInTheDocument()
  expect(screen.getByText('🎮')).toBeInTheDocument()
  expect(screen.getByText(new RegExp(en.groups.public))).toBeInTheDocument()
  expect(container.querySelector('img[src="https://cdn/a.jpg"]')).toBeInTheDocument()
})

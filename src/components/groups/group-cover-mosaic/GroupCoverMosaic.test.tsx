import { render } from '@testing-library/react'
import GroupCoverMosaic from './GroupCoverMosaic'
import type { GameGroup } from '@/types/types'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => <img src={src as string} alt={alt} {...props} />)

const group = (over: Partial<GameGroup>) => ({ id: 1, title: 'G', icon: null, covers: [], ...over }) as GameGroup

test('the first games’ covers, RA art from RA and Steam art as stored, at most four', () => {
  const { container } = render(
    <GroupCoverMosaic
      group={group({
        covers: [
          { source: 'ra', game_id: 1, image_icon: '/Images/1.png' },
          { source: 'steam', game_id: 2, image_icon: '/api/steam/icon?appid=2' },
          { source: 'ra', game_id: 3, image_icon: '/Images/3.png' },
          { source: 'ra', game_id: 4, image_icon: '/Images/4.png' },
          { source: 'ra', game_id: 5, image_icon: '/Images/5.png' },
        ],
      })}
    />,
  )
  const srcs = [...container.querySelectorAll('img')].map((i) => i.getAttribute('src'))
  expect(srcs).toEqual(['https://retroachievements.org/Images/1.png', '/api/steam/icon?appid=2', 'https://retroachievements.org/Images/3.png', 'https://retroachievements.org/Images/4.png'])
})

test('the owner’s icon sits on a corner of the covers, or alone when there are none', () => {
  const { container, rerender, getByText } = render(<GroupCoverMosaic group={group({ icon: '🎮', covers: [{ source: 'ra', game_id: 1, image_icon: '/Images/1.png' }] })} />)
  expect(getByText('🎮')).toBeInTheDocument()
  rerender(<GroupCoverMosaic group={group({ icon: '🎮' })} />)
  expect(container.querySelectorAll('img')).toHaveLength(0)
  expect(getByText('🎮')).toBeInTheDocument()
})

test('decorative: hidden from screen readers', () => {
  const { container } = render(<GroupCoverMosaic group={group({})} />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
})

import { render, screen } from '@testing-library/react'
import GameHero from './GameHero'
import GameHeroChip from './game-hero-chip/GameHeroChip'
import GameHeroProgress from './game-hero-progress/GameHeroProgress'
import GameHeroMedia from './game-hero-media/GameHeroMedia'

const base = {
  cover: <span>cover</span>,
  title: 'Ultimate Spider-Man',
  facts: [
    { label: 'Released', value: '22 Sep 2005' },
    { label: 'Developer', value: null },
  ],
  tiles: [{ label: 'Achievements', value: 5, of: 39 }],
}

test('the title is the page heading, in the display face', () => {
  render(<GameHero {...base} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Ultimate Spider-Man' })).toHaveClass('font-display')
})

test('facts: a missing value says so instead of a dash', () => {
  const { container } = render(<GameHero {...base} />)
  const dds = container.querySelectorAll('dl')[0].querySelectorAll('dd')
  expect(dds[0]).toHaveTextContent('22 Sep 2005')
  expect(dds[1]).toHaveTextContent('No data')
  expect(dds[1]).toHaveClass('text-text-secondary')
})

test('a tile shows the part and the whole; reached, it turns to success', () => {
  const { rerender } = render(<GameHero {...base} />)
  expect(screen.getByText('Achievements').nextElementSibling).toHaveTextContent('5 / 39')
  rerender(<GameHero {...base} tiles={[{ label: 'Achievements', value: 39, of: 39, done: true }]} />)
  expect(screen.getByText('Achievements').nextElementSibling).toHaveClass('text-success')
})

test('the toggles sit after a rule, beside the actions', () => {
  render(<GameHero {...base} actions={<button>Ask an AI</button>} toggles={<button aria-label="Pin" />} />)
  expect(screen.getByRole('button', { name: 'Ask an AI' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pin' }).previousElementSibling).toHaveAttribute('aria-hidden', 'true')
})

test('no tiles and no media: no right column', () => {
  const { container } = render(<GameHero {...base} tiles={[]} />)
  expect(container.querySelector('section')!.children).toHaveLength(2)
})

test('a chip takes its tone', () => {
  render(<GameHeroChip tone="danger">2 missable</GameHeroChip>)
  const chip = screen.getByText('2 missable').parentElement!
  expect(chip).toHaveClass('text-danger')
  expect(chip).toHaveClass('skew-x-(--slant-pill)')
  expect(chip.firstElementChild).toHaveClass('-skew-x-(--slant-pill)')
})

test('the progress: the bar, the share and the count', () => {
  render(<GameHeroProgress pct={12.8} softPct={20} label="Game" left="12.8 % in hardcore" right="5 of 39" />)
  expect(screen.getByRole('progressbar', { name: 'Game' })).toHaveAttribute('aria-valuenow', '20')
  expect(screen.getByText('12.8 % in hardcore')).toBeInTheDocument()
  expect(screen.getByText('5 of 39')).toBeInTheDocument()
})

test('media: two pictures at most, with captions; one with a full version links to it', () => {
  render(
    <GameHeroMedia
      shots={[
        { src: 'a.png', caption: 'Title screen' },
        null,
        { src: 'b.png', caption: 'In game', full: 'b-full.png' },
        { src: 'c.png', caption: 'Third' },
      ]}
    />,
  )
  expect(screen.getByText('Title screen')).toBeInTheDocument()
  expect(screen.getByText('In game').closest('figure')!.querySelector('a')).toHaveAttribute('href', 'b-full.png')
  expect(screen.queryByText('Third')).not.toBeInTheDocument()
})

test('media: nothing to show draws nothing', () => {
  const { container } = render(<GameHeroMedia shots={[null]} />)
  expect(container).toBeEmptyDOMElement()
})

import { render, screen } from '@testing-library/react'
import { IconStar } from '@tabler/icons-react'
import Button from './Button'
import IconButton from './IconButton'
import SegmentedControl from './SegmentedControl'
import Tabs from './Tabs'
import ToggleButton from './ToggleButton'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const css: string = require('fs').readFileSync(require('path').join(__dirname, '../../app/globals.css'), 'utf8').replace(/\r\n/g, '\n')

/**
 * #115: on a touch screen (the Steam Deck, the AYN Thor) every small control is tapped through 44 × 44 px.
 * `tap-target` draws nothing; its ::after reaches out around the control, and only where a finger can touch.
 */
describe('tap-target', () => {
  test('reaches out to 44 px, and only on a touch screen', () => {
    const rule = css.slice(css.indexOf('@utility tap-target'), css.indexOf('@custom-variant short'))
    expect(rule).toContain('@media (any-pointer: coarse)')
    expect(rule).toContain('inset: min(0px, calc((100% - 2.75rem) / 2))')
  })

  test('the library controls carry it, positioned so the area is around them', () => {
    render(
      <>
        <Button>Save</Button>
        <IconButton aria-label="Close">x</IconButton>
        <ToggleButton pressed={false} onToggle={() => {}} label="Pin" icon={IconStar} />
        <Tabs id="t" aria-label="Views" value="a" onChange={() => {}} panels={false} tabs={[{ value: 'a', label: 'One' }]} />
        <SegmentedControl aria-label="Look" value="a" onChange={() => {}} options={[{ value: 'a', label: 'List' }]} />
      </>,
    )
    for (const name of ['Save', 'Close', 'Pin', 'List']) expect(screen.getByRole('button', { name })).toHaveClass('relative', 'tap-target')
    expect(screen.getByRole('tab', { name: 'One' })).toHaveClass('relative', 'tap-target')
  })
})

test('a screen held sideways is one named variant: 500 px tall or less (#115)', () => {
  expect(css).toContain('@custom-variant short (@media (max-height: 31.25rem));')
})

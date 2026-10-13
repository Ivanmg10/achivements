import { fireEvent, render } from '@testing-library/react'
import NavigationProgress from './NavigationProgress'

function bar(container: HTMLElement) {
  return container.querySelector('[aria-hidden="true"] > div') as HTMLElement
}

test('is invisible until a link to another page is clicked, and hidden from assistive tech', () => {
  const { container } = render(<NavigationProgress />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(bar(container)).toHaveClass('opacity-0')

  const a = document.createElement('a')
  a.href = '/groups'
  a.addEventListener('click', (e) => e.preventDefault())
  document.body.appendChild(a)
  fireEvent.click(a)

  expect(bar(container)).toHaveClass('opacity-100')
  a.remove()
})

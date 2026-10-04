import { render, screen } from '@testing-library/react'
import GroupProgressBar from './GroupProgressBar'

test('says the share in text and to screen readers', () => {
  render(<GroupProgressBar earned={86} total={182} label="Octubre" />)
  expect(screen.getByRole('progressbar', { name: 'Octubre' })).toHaveAttribute('aria-valuenow', '47')
  expect(screen.getByText('47%')).toBeInTheDocument()
})

test('nothing to show without any achievements', () => {
  const { container } = render(<GroupProgressBar earned={0} total={0} label="Empty" />)
  expect(container).toBeEmptyDOMElement()
})

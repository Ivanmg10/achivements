import { fireEvent, render, screen } from '@testing-library/react'
import { SectionFallback } from './SectionFallback'

test('renders children unaltered when there is no error', () => {
  render(
    <SectionFallback error={false} onRefresh={jest.fn()}>
      <p>Chart content</p>
    </SectionFallback>
  )
  expect(screen.getByText('Chart content')).toBeInTheDocument()
  expect(screen.queryByText('Failed to load')).not.toBeInTheDocument()
})

test('shows a translated error message and retry button on error', () => {
  const onRefresh = jest.fn()
  render(
    <SectionFallback error onRefresh={onRefresh}>
      <p>Chart content</p>
    </SectionFallback>
  )
  expect(screen.getByText('Failed to load')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRefresh).toHaveBeenCalledTimes(1)
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingLanguage from './LandingLanguage'
import { en } from '@/translations/en'

test('names the language shown and opens the language dialog, where another can be picked', async () => {
  render(<LandingLanguage />)
  const button = screen.getByRole('button', { name: `${en.userConfig.language}: English` })
  expect(button).toHaveTextContent('English')
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  await userEvent.click(button)
  expect(await screen.findByRole('radio', { name: 'Español' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'English' })).toBeChecked()
})

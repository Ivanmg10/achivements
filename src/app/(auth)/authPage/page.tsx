import AuthPage from '@/components/auth-page/AuthPage'

type Props = { searchParams: Promise<{ mode?: string | string[]; steam?: string | string[] }> }

/**
 * Read on the server, not with useSearchParams: that hook would send an empty
 * page and leave all of it to the browser's JavaScript.
 */
export default async function AuthRoute({ searchParams }: Props) {
  const { mode, steam } = await searchParams
  return <AuthPage wantsRegister={mode === 'register'} steam={typeof steam === 'string' ? steam : null} />
}

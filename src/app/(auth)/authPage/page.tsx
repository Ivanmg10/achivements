import AuthPage from '@/components/auth-page/AuthPage'
import { safeNext } from '@/utils/safeNext'

type Props = { searchParams: Promise<{ mode?: string | string[]; steam?: string | string[]; next?: string | string[] }> }

/**
 * Read on the server, not with useSearchParams: that hook would send an empty
 * page and leave all of it to the browser's JavaScript. `next` is where the proxy
 * found the visitor going; only a path of this site gets through (`safeNext`).
 */
export default async function AuthRoute({ searchParams }: Props) {
  const { mode, steam, next } = await searchParams
  const back = safeNext(typeof next === 'string' ? next : undefined)
  return <AuthPage wantsRegister={mode === 'register'} steam={typeof steam === 'string' ? steam : null} next={back === '/' ? null : back} />
}

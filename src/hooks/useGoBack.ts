import { useRouter } from 'next/navigation'

/** Back in the history, or home when there is none (a tab opened on this URL). */
export function useGoBack() {
  const router = useRouter()
  return () => (window.history.length > 1 ? router.back() : router.push('/'))
}

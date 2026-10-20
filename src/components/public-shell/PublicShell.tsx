import LandingNav from '@/components/landing-page/landing-nav/LandingNav'
import PublicFooter from '@/components/public-footer/PublicFooter'

/**
 * A page a visitor without an account can open inside the app's routes (the
 * main layout gives a signed-out page nothing around it): the visitors' bar on
 * top and the public footer below, like the landing.
 */
export default function PublicShell({ current, children }: { current: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <PublicFooter current={current} />
    </div>
  )
}

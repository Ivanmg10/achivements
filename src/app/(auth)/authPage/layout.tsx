import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to CheevoVault or create a free account to track your RetroAchievements, Steam and PlayStation progress.',
  alternates: { canonical: '/authPage' },
}

export default function AuthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

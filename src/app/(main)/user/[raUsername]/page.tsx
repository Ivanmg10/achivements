import PublicUserPage from '@/components/public-user-page/PublicUserPage'

interface Props {
  params: Promise<{ raUsername: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { raUsername } = await params
  return <PublicUserPage raUsername={decodeURIComponent(raUsername)} />
}

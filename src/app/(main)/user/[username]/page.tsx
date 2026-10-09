import PublicUserPage from '@/components/public-user-page/PublicUserPage'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  return <PublicUserPage username={decodeURIComponent(username)} />
}

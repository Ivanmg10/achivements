'use client'

import { useParams } from 'next/navigation'
import LibraryPage from '@/components/library-page/LibraryPage'

export default function CategoryPage() {
  const { category } = useParams()
  return <LibraryPage category={category as string} />
}

import type { Metadata } from 'next'
import { seoMetadata, seoStaticParams } from '@/utils/seoPages'
import SeoPageRoute from '@/components/seo-page/seo-page-route/SeoPageRoute'

type Props = { params: Promise<{ slug: string }> }

/** Public: the pages listed in src/translations/seoPages.ts, and nothing else. */
export const dynamicParams = false

export function generateStaticParams() {
  return seoStaticParams('track')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return seoMetadata('track', (await params).slug)
}

export default async function TrackPage({ params }: Props) {
  return <SeoPageRoute section="track" slug={(await params).slug} />
}

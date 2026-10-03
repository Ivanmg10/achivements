'use client'

import { useCallback, useState } from 'react'
import Image, { type ImageProps } from 'next/image'

/**
 * An image that holds its place until it has loaded: the box shows a soft
 * pulsing placeholder in the image's own shape, then the picture fades in.
 * So a page never shows half its icons missing and then popping in.
 *
 * `className` sizes and shapes the box (width, height, rounding, ring); the
 * picture fills it. `placeholderClassName` applies only while loading, for
 * images whose height comes from the picture itself (give them an aspect
 * ratio to stand in until then). An image that fails keeps the placeholder,
 * still, instead of a broken icon.
 */
export function FadeImage({
  className = '',
  imgClassName = 'w-full h-full object-cover',
  placeholderClassName = '',
  alt,
  ...props
}: Omit<ImageProps, 'className'> & {
  className?: string
  /** Classes for the picture itself; it fills the box by default. */
  imgClassName?: string
  placeholderClassName?: string
}) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading')

  // A cached image can finish before React attaches onLoad: check on mount.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setState('loaded')
  }, [])

  return (
    <span
      className={`relative block overflow-hidden ${state === 'loaded' ? '' : `bg-white/[0.06] ${placeholderClassName}`} ${state === 'loading' ? 'animate-pulse motion-reduce:animate-none' : ''} ${className}`}
    >
      {state !== 'failed' && (
        <Image
          {...props}
          ref={ref}
          alt={alt}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={`${imgClassName} transition-opacity duration-300 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  )
}

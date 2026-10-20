import { notFound } from 'next/navigation'

/**
 * Any URL of three or more segments that no route takes (/a/b/c, /playing/3/x):
 * without it they fall to the root 404, outside the layout and with no header.
 * Here [category]'s layout (or this page) calls notFound(), and
 * (main)/not-found.tsx shows it under the header.
 */
export default function Missing(): never {
  notFound()
}

/** The title of a sign-in screen: the display italic, centred over its form, no rule under it. */
export default function AuthTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display italic font-extrabold text-3xl sm:text-4xl leading-[1.05] pr-1 text-center text-text-main mb-6">
      {children}
    </h1>
  )
}

import CoverBand from '@/components/cover-band/CoverBand'
import AuthBrand from '@/components/auth-brand/AuthBrand'

/**
 * The sign-in screens on a phone (the desktop has its own two halves): a band
 * of the sliding covers on top, then the logo and the name, then what the
 * caller puts under them, the form's card.
 */
export default function AuthPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:hidden flex-1 flex flex-col">
      <div className="px-4 pt-4">
        <CoverBand className="h-32 rounded-card" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pt-6 pb-4">
        <AuthBrand />
        {children}
      </div>
    </div>
  )
}

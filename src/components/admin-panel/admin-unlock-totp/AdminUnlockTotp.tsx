import Input, { Field } from '@/components/ui/Input'

export type TotpSetup = { key: string; uri: string }

/**
 * The code field of the unlock form. Enrolling, it first shows the key to add to
 * an authenticator app; `uri` opens that app directly on a phone.
 */
export default function AdminUnlockTotp({ setup, code, onChange, disabled }: {
  setup: TotpSetup | null
  code: string
  onChange: (code: string) => void
  disabled: boolean
}) {
  return (
    <div className="w-full text-left flex flex-col gap-3">
      {setup && (
        <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
          <p>Add this key to an authenticator app (Google Authenticator, Authy, 1Password…), then type the code it shows.</p>
          <code className="break-all rounded-tile bg-bg-secondary px-3 py-2 font-mono text-text-main">{setup.key}</code>
          <a href={setup.uri} className="underline hover:text-text-main">Open in the app on this device</a>
        </div>
      )}
      <Field label="Code from your authenticator" hint={setup ? undefined : 'Or one of your recovery codes.'}>
        {(control) => (
          <Input
            {...control}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            autoComplete="one-time-code"
          />
        )}
      </Field>
    </div>
  )
}

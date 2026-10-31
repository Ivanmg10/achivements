import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

/** The recovery codes, shown once: they are stored hashed and cannot be seen again. */
export default function AdminUnlockRecovery({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 py-4">
      <h3 className="text-lg font-semibold">Save your recovery codes</h3>
      <Notice tone="warning">Each one opens the panel once if you lose your phone. They will not be shown again.</Notice>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => <li key={code} className="rounded-tile bg-bg-secondary px-3 py-2 text-center">{code}</li>)}
      </ul>
      <Button size="lg" className="w-full" onClick={onDone}>I have saved them</Button>
    </div>
  )
}

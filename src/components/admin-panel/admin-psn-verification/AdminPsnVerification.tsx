import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

/** A user's PSN account is verified (a code in its About Me, #176): the admin can clear it for a dispute. The panel is in English. */
export default function AdminPsnVerification({ busy, onClear }: { busy: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <Tag tone="success">Verified</Tag>
      <Button variant="danger" size="sm" className="shrink-0" onClick={onClear} disabled={busy}>
        Clear verification
      </Button>
    </div>
  )
}

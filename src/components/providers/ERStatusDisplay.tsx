import type { ERStatus } from '../../types'
import type { Timestamp } from 'firebase/firestore'
import { StatusPill } from '../ui/StatusPill'
import { formatRelativeTime } from '../../lib/format'

type Props = {
  status: ERStatus
  updatedAt?: Timestamp
}

export function ERStatusDisplay({ status, updatedAt }: Props) {
  return (
    <div className="flex items-center gap-2">
      <StatusPill status={status} />
      {updatedAt && (
        <span className="text-xs text-slate-400">{formatRelativeTime(updatedAt)}</span>
      )}
    </div>
  )
}

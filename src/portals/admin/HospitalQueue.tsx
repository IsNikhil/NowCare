import { useState } from 'react'
import { where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ExternalLink, Building2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '../../services/firebase'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { fetchHospitalData, fetchBenchmarks } from '../../services/cms'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { SkeletonList } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/format'
import { fadeRise, stagger } from '../../lib/motion'
import type { Hospital } from '../../types'

export default function HospitalQueue({ embedded = false }: { embedded?: boolean }) {
  const [processing, setProcessing] = useState<string | null>(null)

  const { data: hospitals, loading } = useFirestoreCollection<Hospital>(
    'hospitals',
    [where('status', '==', 'pending'), orderBy('name', 'asc')]
  )

  async function handleApprove(hospital: Hospital & { id: string }) {
    setProcessing(hospital.id)
    try {
      let cmsData = null
      let cmsBenchmarks = null
      let cmsWarning = false
      try {
        cmsData = await fetchHospitalData(hospital.name)
        if (cmsData) {
          try { cmsBenchmarks = await fetchBenchmarks(hospital.name) } catch { /* ignore */ }
        }
      } catch { cmsWarning = true }

      await updateDoc(doc(db, 'hospitals', hospital.id), {
        status: 'approved',
        cms_data: cmsData ?? null,
        cms_benchmarks: cmsBenchmarks ?? null,
        approvedAt: serverTimestamp(),
      })
      toast.success(cmsWarning || !cmsData
        ? `${hospital.name} approved.`
        : `${hospital.name} approved with CMS data.`)
    } catch {
      toast.error('Could not approve hospital.')
    } finally {
      setProcessing(null)
    }
  }

  async function handleDeny(hospital: Hospital & { id: string }) {
    setProcessing(hospital.id)
    try {
      await updateDoc(doc(db, 'hospitals', hospital.id), { status: 'denied' })
      toast(`${hospital.name} denied.`)
    } catch {
      toast.error('Could not deny hospital.')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <SkeletonList count={2} />

  if (hospitals.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
          <Building2 size={22} strokeWidth={1.25} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No hospitals pending</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>New registrations will appear here for review.</p>
      </GlassCard>
    )
  }

  const content = (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
      {hospitals.map((hospital) => (
        <motion.div key={hospital.id} variants={fadeRise}>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsla(38,90%,65%,0.1)', color: 'var(--accent-amber)' }}>
                <Clock size={15} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{hospital.name}</p>
                {hospital.email && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hospital.email}</p>
                )}
                {hospital.createdAt && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Submitted {formatDate(hospital.createdAt)}
                  </p>
                )}
                {hospital.supportingDocuments ? (
                  <a
                    href={hospital.supportingDocuments}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold mt-1 hover:underline"
                    style={{ color: 'var(--accent-teal)' }}
                  >
                    <ExternalLink size={10} strokeWidth={1.75} />
                    View documents
                  </a>
                ) : (
                  <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>No documents provided</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={processing === hospital.id}
                disabled={processing !== null}
                onClick={() => handleApprove(hospital)}
              >
                <CheckCircle2 size={14} strokeWidth={1.75} />
                Approve
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={processing === hospital.id}
                disabled={processing !== null}
                onClick={() => handleDeny(hospital)}
              >
                <XCircle size={14} strokeWidth={1.75} />
                Deny
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )

  if (embedded) return content

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Hospital Queue</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} pending review.
        </p>
      </div>
      {content}
    </div>
  )
}

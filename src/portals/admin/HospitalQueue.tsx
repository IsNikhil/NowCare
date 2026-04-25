import { useState } from 'react'
import { where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { fetchHospitalData, fetchBenchmarks } from '../../services/cms'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToastContext } from '../../context/ToastContext'
import { formatDate } from '../../lib/format'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import type { Hospital } from '../../types'

export default function HospitalQueue({ embedded = false }: { embedded?: boolean }) {
  const { addToast } = useToastContext()
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
          try {
            cmsBenchmarks = await fetchBenchmarks(hospital.name)
          } catch {
            // ignore
          }
        }
      } catch {
        cmsWarning = true
      }

      await updateDoc(doc(db, 'hospitals', hospital.id), {
        status: 'approved',
        cms_data: cmsData ?? null,
        cms_benchmarks: cmsBenchmarks ?? null,
        approvedAt: serverTimestamp(),
      })

      if (cmsWarning || !cmsData) {
        addToast('success', `${hospital.name} approved. CMS data unavailable.`)
      } else {
        addToast('success', `${hospital.name} approved. CMS data fetched.`)
      }
    } catch {
      addToast('error', 'Could not approve hospital.')
    } finally {
      setProcessing(null)
    }
  }

  async function handleDeny(hospital: Hospital & { id: string }) {
    setProcessing(hospital.id)
    try {
      await updateDoc(doc(db, 'hospitals', hospital.id), { status: 'denied' })
      addToast('info', `${hospital.name} denied.`)
    } catch {
      addToast('error', 'Could not deny hospital.')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className={embedded ? '' : 'max-w-2xl mx-auto'}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const content = (
    <>
      {hospitals.length === 0 && (
        <EmptyState
          title="No hospitals pending approval"
          description="When hospitals register, they will appear here for review."
        />
      )}

      <div className="flex flex-col gap-4">
        {hospitals.map((hospital) => (
          <Card key={hospital.id} level={2} padding="md">
            <div className="mb-3">
              <h3 className="font-semibold text-ink-800">{hospital.name}</h3>
              {hospital.email && (
                <p className="text-xs text-slate-400 mt-0.5">{hospital.email}</p>
              )}
              {hospital.createdAt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted {formatDate(hospital.createdAt)}
                </p>
              )}
              <div className="mt-1.5">
                {hospital.supportingDocuments ? (
                  <a
                    href={hospital.supportingDocuments}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <ExternalLink size={11} strokeWidth={1.75} />
                    View documents
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No documents provided</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                loading={processing === hospital.id}
                disabled={processing !== null}
                onClick={() => handleApprove(hospital)}
              >
                <CheckCircle2 size={16} strokeWidth={1.75} />
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={processing === hospital.id}
                disabled={processing !== null}
                onClick={() => handleDeny(hospital)}
              >
                <XCircle size={16} strokeWidth={1.75} />
                Deny
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )

  if (embedded) return content

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Hospital queue"
        subtitle={`${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} pending review.`}
      />
      {content}
    </div>
  )
}

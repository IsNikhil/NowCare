import { where, orderBy } from 'firebase/firestore'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { MapPin, Phone } from 'lucide-react'
import type { Hospital } from '../../types'

export default function ApprovedHospitals() {
  const { data: hospitals, loading } = useFirestoreCollection<Hospital>(
    'hospitals',
    [where('status', '==', 'approved'), orderBy('name', 'asc')]
  )

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Approved hospitals"
        subtitle={`${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} on the platform.`}
      />

      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && hospitals.length === 0 && (
        <EmptyState
          title="No approved hospitals yet"
          description="Approved hospitals will appear here."
          icon={null}
        />
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {hospitals.map((h) => (
          <Card key={h.id} level={1} padding="md">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-ink-800 leading-tight">
                {h.cms_data?.facility_name ?? h.name}
              </h3>
              {h.cms_data?.emergency_services === 'Yes' && (
                <Badge variant="danger" className="shrink-0 ml-2">ER</Badge>
              )}
            </div>
            {h.cms_data?.address && (
              <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-2">
                <MapPin size={12} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                <span>{h.cms_data.address}, {h.cms_data.city}, {h.cms_data.state} {h.cms_data.zip_code}</span>
              </div>
            )}
            {h.cms_data?.phone_number && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                <Phone size={12} strokeWidth={1.75} />
                {h.cms_data.phone_number}
              </div>
            )}
            {h.cms_data?.hospital_type && (
              <Badge variant="default">{h.cms_data.hospital_type}</Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

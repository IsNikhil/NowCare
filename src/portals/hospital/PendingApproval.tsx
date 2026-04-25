import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { Card } from '../../components/ui/Card'
import { Clock, XCircle } from 'lucide-react'
import type { Hospital } from '../../types'

export default function PendingApproval() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: hospital } = useFirestoreDoc<Hospital>(
    user ? `hospitals/${user.uid}` : ''
  )

  useEffect(() => {
    if (!hospital) return
    if (hospital.status === 'approved') {
      navigate('/hospital', { replace: true })
    }
  }, [hospital, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {hospital?.status === 'denied' ? (
          <Card level={2} padding="lg" className="text-center">
            <XCircle size={48} strokeWidth={1.75} className="text-rose-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-ink-800 mb-2">Registration not approved</h1>
            <p className="text-slate-500 text-sm">
              Your hospital registration for{' '}
              <strong>{hospital.name}</strong> was not approved.
              Please contact support for assistance.
            </p>
          </Card>
        ) : (
          <Card level={2} padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock size={20} strokeWidth={1.75} className="text-amber-500" />
              </div>
              <h1 className="text-xl font-bold text-ink-800">Application under review</h1>
            </div>
            <p className="text-slate-500 text-sm">
              Your hospital has been submitted for verification. We'll notify you once an admin has reviewed your application. This usually takes within 24 hours.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { GlassCard } from '../../components/ui/GlassCard'
import type { Hospital } from '../../types'

export default function PendingApproval() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: hospital } = useFirestoreDoc<Hospital>(user ? `hospitals/${user.uid}` : '')

  useEffect(() => {
    if (hospital?.status === 'approved') navigate('/hospital', { replace: true })
  }, [hospital, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-md w-full">
        {hospital?.status === 'denied' ? (
          <GlassCard variant="elevated" className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsla(8,90%,65%,0.1)', color: 'var(--accent-coral)' }}>
              <XCircle size={28} strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Registration not approved</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your hospital registration for <strong>{hospital.name}</strong> was not approved.
              Please contact support for assistance.
            </p>
          </GlassCard>
        ) : (
          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsla(38,90%,65%,0.1)', color: 'var(--accent-amber)' }}>
                <Clock size={20} strokeWidth={1.75} />
              </div>
              <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Application under review</h1>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your hospital has been submitted for verification. An admin will review your application — typically within 24 hours.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

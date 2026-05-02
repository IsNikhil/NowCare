import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, XCircle, Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import type { Hospital } from '../../types'

export default function PendingApproval() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: hospital } = useFirestoreDoc<Hospital>(user ? `hospitals/${user.uid}` : '')

  useEffect(() => {
    if (hospital?.status === 'approved') navigate('/hospital', { replace: true })
  }, [hospital, navigate])

  const refNumber = user?.uid?.slice(-8).toUpperCase() ?? '--------'
  const email = user?.email ?? ''

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aurora-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.4 }} />
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        {hospital?.status === 'denied' ? (
          <GlassCard variant="elevated" className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'hsla(8,90%,65%,0.1)', color: 'var(--accent-coral)' }}>
              <XCircle size={28} strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              Application not approved
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
              Contact us for more information about your <strong>{hospital.name}</strong> application.
            </p>
            <a
              href="mailto:support@nowcare.app"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:underline mb-4 block text-center"
              style={{ color: 'var(--accent-teal)' }}
            >
              <Mail size={14} strokeWidth={1.75} />
              support@nowcare.app
            </a>
            <Button variant="secondary" size="sm" onClick={logout} fullWidth>
              Sign out
            </Button>
          </GlassCard>
        ) : (
          <GlassCard variant="elevated" className="p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'hsla(38,90%,65%,0.1)', color: 'var(--accent-amber)' }}>
                <Clock size={26} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                Your application is under review
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Our team reviews new hospital applications within 24 hours. We will email{' '}
                <strong>{email}</strong> as soon as you are approved.
              </p>
            </div>

            <div
              className="rounded-xl p-4 mb-6 text-center"
              style={{ background: 'var(--surface-tint)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                Reference number
              </p>
              <p className="text-lg font-mono font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                {refNumber}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={logout} fullWidth>
                Sign out
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

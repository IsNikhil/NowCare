import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function UnauthorizedPage() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
          <ShieldOff size={40} strokeWidth={1.25} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Access denied</h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>You do not have permission to view this page.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/app"><Button>Go to my portal</Button></Link>
          <Button variant="secondary" onClick={logout}>Sign out</Button>
        </div>
      </div>
    </div>
  )
}

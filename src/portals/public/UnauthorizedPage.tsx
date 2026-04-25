import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export default function UnauthorizedPage() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <ShieldOff size={64} strokeWidth={1.75} className="text-slate-200 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-ink-800 tracking-tight mb-2">Access denied</h1>
        <p className="text-slate-500 mb-8">You do not have permission to view this page.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/app">
            <Button variant="primary">Go to my portal</Button>
          </Link>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

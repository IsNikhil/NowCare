import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../ui/Badge'

const roleLabel: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  admin: 'Admin',
}

const roleBadge: Record<string, 'teal' | 'info' | 'warning' | 'success'> = {
  patient: 'teal',
  doctor: 'info',
  hospital: 'teal',
  admin: 'success',
}

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { profile, role, logout } = useAuth()

  return (
    <header className="h-16 glass-3 flex items-center justify-between px-4 md:px-6">
      <button
        className="md:hidden p-2 rounded-xl text-slate-500 hover:glass-1 transition-all"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center gap-3 ml-auto">
        {role && (
          <Badge variant={roleBadge[role] ?? 'default'}>
            {roleLabel[role] ?? role}
          </Badge>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-8 h-8 rounded-full glass-1 flex items-center justify-center">
            <User size={16} strokeWidth={1.75} className="text-slate-500" />
          </div>
          <span className="hidden sm:block font-medium text-ink-800 max-w-[140px] truncate">
            {profile?.email ?? ''}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:glass-1 transition-all"
          aria-label="Log out"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

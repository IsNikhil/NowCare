import { LogOut, User, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Badge } from '../ui/Badge'
import { NowCareLogo } from '../brand/NowCareLogo'

const roleLabel: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  admin: 'Admin',
}

const roleBadgeVariant: Record<string, 'teal' | 'info' | 'warning' | 'success'> = {
  patient: 'teal',
  doctor: 'info',
  hospital: 'warning',
  admin: 'success',
}

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { profile, role, logout } = useAuth()

  return (
    <header
      className="h-14 md:h-16 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-8 shrink-0 sticky top-0 z-20"
      style={{
        background: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      <button
        className="lg:hidden p-2 rounded-xl transition-colors hover:bg-[var(--surface-tint)]"
        style={{ color: 'var(--text-secondary)' }}
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      <div className="hidden lg:flex items-center gap-2">
        <NowCareLogo size={26} wordmarkClassName="text-sm text-[var(--text-primary)]" />
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 ml-auto">
        <ThemeToggle />

        {role && (
          <Badge variant={roleBadgeVariant[role] ?? 'default'}>
            {roleLabel[role] ?? role}
          </Badge>
        )}

        <div className="flex min-w-0 items-center gap-2 px-1.5 sm:px-2 py-1.5 rounded-xl cursor-pointer hover:bg-[var(--surface-tint)] transition-colors">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-violet))' }}
          >
            {profile?.email?.charAt(0).toUpperCase() ?? <User size={14} strokeWidth={1.75} />}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-[90px] md:max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }}>
            {profile?.email?.split('@')[0] ?? ''}
          </span>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-xl transition-colors hover:bg-[var(--surface-tint)] hover:text-rose-500"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Log out"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

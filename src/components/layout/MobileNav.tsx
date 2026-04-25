import { NavLink } from 'react-router-dom'
import { Home, Stethoscope, History, LayoutDashboard, Calendar, HardDrive, CheckSquare, FileText, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

type MobileNavItem = {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

const mobileNavByRole: Record<string, MobileNavItem[]> = {
  patient: [
    { to: '/patient', label: 'Home', icon: <Home size={22} strokeWidth={1.75} />, end: true },
    { to: '/patient/assess', label: 'Assess', icon: <Stethoscope size={22} strokeWidth={1.75} /> },
    { to: '/patient/providers', label: 'Care', icon: <Activity size={22} strokeWidth={1.75} /> },
    { to: '/patient/documents', label: 'Docs', icon: <FileText size={22} strokeWidth={1.75} /> },
    { to: '/patient/history', label: 'History', icon: <History size={22} strokeWidth={1.75} /> },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: <LayoutDashboard size={22} strokeWidth={1.75} />, end: true },
    { to: '/doctor/availability', label: 'Schedule', icon: <Calendar size={22} strokeWidth={1.75} /> },
  ],
  hospital: [
    { to: '/hospital', label: 'Dashboard', icon: <LayoutDashboard size={22} strokeWidth={1.75} />, end: true },
    { to: '/hospital/mri', label: 'Scan Slots', icon: <HardDrive size={22} strokeWidth={1.75} /> },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={22} strokeWidth={1.75} />, end: true },
    { to: '/admin/queue', label: 'Queue', icon: <CheckSquare size={22} strokeWidth={1.75} /> },
  ],
}

export default function BottomNav() {
  const { role } = useAuth()
  const items = role ? (mobileNavByRole[role] ?? []) : []

  if (items.length === 0) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden"
      style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around h-[64px] px-1 pb-safe">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-150 min-w-0',
                isActive
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-muted)]',
              ].join(' ')
            }
          >
            {item.icon}
            <span className="text-[9px] sm:text-[10px] font-semibold leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

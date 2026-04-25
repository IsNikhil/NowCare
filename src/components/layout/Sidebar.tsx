import { NavLink } from 'react-router-dom'
import {
  Home,
  Stethoscope,
  History,
  LayoutDashboard,
  Calendar,
  HardDrive,
  CheckSquare,
  FileText,
  Users,
  Settings,
  Activity,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

const patientNav: NavItem[] = [
  { to: '/patient', label: 'Home', icon: <Home size={20} strokeWidth={1.75} />, exact: true },
  { to: '/patient/assess', label: 'New Assessment', icon: <Stethoscope size={20} strokeWidth={1.75} /> },
  { to: '/patient/providers', label: 'Find Providers', icon: <Activity size={20} strokeWidth={1.75} /> },
  { to: '/patient/documents', label: 'My Documents', icon: <FileText size={20} strokeWidth={1.75} /> },
  { to: '/patient/history', label: 'My History', icon: <History size={20} strokeWidth={1.75} /> },
  { to: '/patient/profile', label: 'Profile', icon: <UserCircle size={20} strokeWidth={1.75} /> },
]

const doctorNav: NavItem[] = [
  { to: '/doctor', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
  { to: '/doctor/availability', label: 'Availability', icon: <Calendar size={20} strokeWidth={1.75} /> },
  { to: '/doctor/patients', label: 'Patients', icon: <Users size={20} strokeWidth={1.75} /> },
  { to: '/doctor/settings', label: 'Settings', icon: <Settings size={20} strokeWidth={1.75} /> },
]

const hospitalNav: NavItem[] = [
  { to: '/hospital', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
  { to: '/hospital/mri', label: 'Scan Slots', icon: <HardDrive size={20} strokeWidth={1.75} /> },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
  { to: '/admin/queue', label: 'Hospital Queue', icon: <CheckSquare size={20} strokeWidth={1.75} /> },
]

const navByRole: Record<string, NavItem[]> = {
  patient: patientNav,
  doctor: doctorNav,
  hospital: hospitalNav,
  admin: adminNav,
}

type SidebarProps = {
  onNavClick?: () => void
  iconOnly?: boolean
}

export default function Sidebar({ onNavClick, iconOnly }: SidebarProps) {
  const { role } = useAuth()
  const navItems = role ? (navByRole[role] ?? []) : []

  return (
    <div className={`flex flex-col h-full ${iconOnly ? 'px-3 py-4 items-center' : 'p-4'}`}>
      {!iconOnly && (
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}
            >
              N
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>NowCare</span>
          </div>
          <p className="text-xs pl-9" style={{ color: 'var(--text-muted)' }}>Healthcare navigation</p>
        </div>
      )}

      {iconOnly && (
        <div className="mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}
          >
            N
          </div>
        </div>
      )}

      <nav className={`flex-1 flex flex-col gap-1 ${iconOnly ? 'items-center w-full' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onNavClick}
            title={iconOnly ? item.label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                iconOnly ? 'justify-center w-10 h-10 p-0' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'text-[var(--accent-teal)] bg-[var(--surface-tint)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-tint)]',
              ].join(' ')
            }
          >
            {item.icon}
            {!iconOnly && item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

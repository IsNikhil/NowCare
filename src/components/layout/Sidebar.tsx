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
  Activity,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { NowCareLogo } from '../brand/NowCareLogo'

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
  { to: '/doctor/verify', label: 'Verification', icon: <CheckSquare size={20} strokeWidth={1.75} /> },
]

const hospitalNav: NavItem[] = [
  { to: '/hospital', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
  { to: '/hospital/scans', label: 'Scan Slots', icon: <HardDrive size={20} strokeWidth={1.75} /> },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} />, exact: true },
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
    <div className={`flex flex-col h-full ${iconOnly ? 'px-3 py-4 items-center' : 'px-4 py-5'}`}>
      {!iconOnly && (
        <div className="mb-7 px-2">
          <NowCareLogo size={30} wordmarkClassName="text-lg text-[var(--text-primary)]" className="mb-0.5" />
          <p className="text-xs pl-9" style={{ color: 'var(--text-muted)' }}>Healthcare navigation</p>
        </div>
      )}

      {iconOnly && (
        <div className="mb-6">
          <NowCareLogo size={38} showWordmark={false} />
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
                'flex items-center rounded-[10px] text-sm transition-all duration-150 border-l-2',
                iconOnly ? 'justify-center w-10 h-10 p-0' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'font-semibold text-[var(--text-primary)] bg-[var(--surface-tint)] border-l-[var(--accent-teal)]'
                  : 'font-medium text-[var(--text-primary)]/75 border-l-transparent hover:text-[var(--text-primary)] hover:bg-[var(--surface-tint)]',
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

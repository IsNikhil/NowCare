import { NavLink } from 'react-router-dom'
import {
  Home,
  Stethoscope,
  History,
  LayoutDashboard,
  Calendar,
  HardDrive,
  CheckSquare,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
}

const patientNav: NavItem[] = [
  { to: '/patient', label: 'Home', icon: <Home size={20} strokeWidth={1.75} /> },
  { to: '/patient/symptoms', label: 'New Assessment', icon: <Stethoscope size={20} strokeWidth={1.75} /> },
  { to: '/patient/history', label: 'My History', icon: <History size={20} strokeWidth={1.75} /> },
]

const doctorNav: NavItem[] = [
  { to: '/doctor', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} /> },
  { to: '/doctor/availability', label: 'Availability', icon: <Calendar size={20} strokeWidth={1.75} /> },
]

const hospitalNav: NavItem[] = [
  { to: '/hospital', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} /> },
  { to: '/hospital/mri', label: 'Scan Slots', icon: <HardDrive size={20} strokeWidth={1.75} /> },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.75} /> },
  { to: '/admin/queue', label: 'Hospital Queue', icon: <CheckSquare size={20} strokeWidth={1.75} /> },
]

const navByRole: Record<string, NavItem[]> = {
  patient: patientNav,
  doctor: doctorNav,
  hospital: hospitalNav,
  admin: adminNav,
}

export default function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const { role } = useAuth()
  const navItems = role ? (navByRole[role] ?? []) : []

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-8 px-2">
        <span className="text-lg font-bold tracking-tight text-ink-800">NowCare</span>
        <p className="text-xs text-slate-400 mt-0.5">Healthcare navigation</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/patient' || item.to === '/doctor' || item.to === '/hospital' || item.to === '/admin'}
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'glass-2 text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-ink-700 hover:glass-1',
              ].join(' ')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

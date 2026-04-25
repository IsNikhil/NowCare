import { Link } from 'react-router-dom'
import { User, Stethoscope, Building2, ChevronRight } from 'lucide-react'
import { Card } from '../ui/Card'

const roles = [
  {
    title: 'I am a patient',
    description: 'Describe your symptoms and find nearby providers.',
    icon: <User size={32} strokeWidth={1.75} className="text-teal-500" />,
    to: '/signup/patient',
  },
  {
    title: 'I am a doctor',
    description: 'Verify your NPI credentials and manage your availability.',
    icon: <Stethoscope size={32} strokeWidth={1.75} className="text-blue-500" />,
    to: '/signup/doctor',
  },
  {
    title: 'I am a hospital',
    description: 'Publish live ER status and imaging slot availability.',
    icon: <Building2 size={32} strokeWidth={1.75} className="text-amber-500" />,
    to: '/signup/hospital',
  },
]

export default function SignupRoleChooser() {
  return (
    <div className="flex flex-col gap-3">
      {roles.map((role) => (
        <Link key={role.to} to={role.to} className="block group">
          <Card level={1} className="flex items-center gap-4 hover:glass-2 transition-all duration-200 cursor-pointer">
            <div className="shrink-0">{role.icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-ink-800">{role.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>
            </div>
            <ChevronRight size={20} strokeWidth={1.75} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
          </Card>
        </Link>
      ))}
    </div>
  )
}

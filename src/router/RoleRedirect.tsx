import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from '../components/ui/LoadingSpinner'
import type { Role } from '../types'

const roleHome: Record<Role, string> = {
  patient: '/patient',
  doctor: '/doctor',
  hospital: '/hospital',
  admin: '/admin',
}

export default function RoleRedirect() {
  const { role, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!role) return <Navigate to="/login" replace />

  return <Navigate to={roleHome[role]} replace />
}

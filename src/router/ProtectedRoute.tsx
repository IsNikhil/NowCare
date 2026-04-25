import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from '../components/ui/LoadingSpinner'
import type { Role } from '../types'

type ProtectedRouteProps = {
  children: React.ReactNode
  roles: Role[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, role, hospitalStatus, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (role === 'hospital' && hospitalStatus === 'pending' && location.pathname !== '/hospital/pending') {
    return <Navigate to="/hospital/pending" replace />
  }

  return <>{children}</>
}

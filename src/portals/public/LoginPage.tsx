import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import { Card } from '../../components/ui/Card'
import { stockUrl } from '../../lib/stockPhotos'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${stockUrl('landingBackground', 1200)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-mist-100/80" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 mt-2">Sign in to your NowCare account</p>
        </div>
        <Card level={2} padding="lg">
          <LoginForm />
          <div className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="text-teal-600 font-semibold hover:text-teal-700">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../../services/firebase'
import { loginSchema, type LoginFormData } from '../../lib/validation'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToastContext } from '../../context/ToastContext'
import { Mail, Lock } from 'lucide-react'

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast } = useToastContext()

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        addToast('error', 'Invalid email or password')
      } else {
        addToast('error', 'Could not sign in. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail size={16} strokeWidth={1.75} />}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        icon={<Lock size={16} strokeWidth={1.75} />}
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting} fullWidth className="mt-2">
        Sign in
      </Button>
    </form>
  )
}

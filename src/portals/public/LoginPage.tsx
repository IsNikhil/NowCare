import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { auth } from '../../services/firebase'
import { loginSchema, type LoginFormData } from '../../lib/validation'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fadeRise } from '../../lib/motion'
import { images } from '../../lib/imageAssets'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app'

  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password')
      } else {
        toast.error('Could not sign in. Please try again.')
      }
    }
  }

  async function handleForgotPassword() {
    if (!resetEmail.trim()) { toast.error('Enter your email address first.'); return }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim())
      setResetSent(true)
      toast.success('Reset link sent. Check your inbox.')
    } catch {
      toast.error('Could not send reset email. Check the address and try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Aurora bg */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aurora-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.5 }} />
        <div className="aurora-2 absolute top-[30%] -right-[15%] w-[50vw] h-[50vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, hsla(265,70%,65%,0.15), transparent 70%)' }} />
      </div>

      {/* Left panel - branding (desktop only) */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(168,76%,10%), hsl(168,76%,18%))' }}
      >
        <img src={images.authBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">N</div>
            <span className="text-white text-xl font-bold">NowCare</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            The right care,<br />right now.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            AI-powered healthcare navigation connecting you to verified providers across Louisiana.
          </p>
        </div>
        <div className="relative z-10">
          <div className="flex gap-4">
            {['NPPES verified', 'Live ER status', 'AI triage'].map((t) => (
              <div key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/20">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center p-6 lg:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <motion.div
          variants={fadeRise}
          initial="initial"
          animate="animate"
          className="w-full max-w-sm"
        >
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-8 hover:underline"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Back to home
          </Link>

          {!forgotMode ? (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                Welcome back
              </h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Sign in to your NowCare account
              </p>

              <GlassCard variant="elevated" className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    icon={<Lock size={16} strokeWidth={1.75} />}
                    error={errors.password?.message}
                    rightElement={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded transition-colors hover:bg-[var(--surface-tint)]"
                        style={{ color: 'var(--text-muted)' }} aria-label="Toggle password visibility">
                        {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                      </button>
                    }
                    {...register('password')}
                  />

                  <div className="flex justify-end">
                    <button type="button" onClick={() => setForgotMode(true)}
                      className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-teal)' }}>
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" loading={isSubmitting} fullWidth className="mt-1">
                    Sign in
                  </Button>
                </form>
              </GlassCard>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                No account?{' '}
                <Link to="/signup" className="font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>
                  Sign up free
                </Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setForgotMode(false); setResetSent(false) }}
                className="inline-flex items-center gap-1.5 text-sm mb-8 hover:underline" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft size={14} strokeWidth={1.75} />
                Back to sign in
              </button>

              <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                Reset password
              </h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                We will send a reset link to your email address.
              </p>

              <GlassCard variant="elevated" className="p-6">
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'var(--accent-teal-glow)' }}>
                      <Mail size={24} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
                    </div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Check your inbox</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      A reset link was sent to <strong>{resetEmail}</strong>
                    </p>
                    <Button className="mt-5" fullWidth variant="secondary" onClick={() => { setForgotMode(false); setResetSent(false) }}>
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      icon={<Mail size={16} strokeWidth={1.75} />}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <Button onClick={handleForgotPassword} loading={resetLoading} fullWidth>
                      Send reset link
                    </Button>
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

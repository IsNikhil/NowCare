import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Stethoscope, Building2, ChevronRight, ArrowLeft } from 'lucide-react'
import SignupRoleChooser from '../../components/auth/SignupRoleChooser'
import PatientSignupForm from '../../components/auth/PatientSignupForm'
import DoctorSignupForm from '../../components/auth/DoctorSignupForm'
import HospitalSignupForm from '../../components/auth/HospitalSignupForm'
import { GlassCard } from '../../components/ui/GlassCard'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fadeRise } from '../../lib/motion'

function AuthShell({ title, subtitle, back, children }: {
  title: string
  subtitle: string
  back?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aurora-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.5 }} />
        <div className="aurora-2 absolute top-[30%] -right-[15%] w-[50vw] h-[50vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, hsla(265,70%,65%,0.15), transparent 70%)' }} />
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        variants={fadeRise}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-2 hover:underline"
          style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}>N</div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>NowCare</span>
          </div>
        </Link>

        {back && (
          <Link to={back} className="inline-flex items-center gap-1.5 text-sm mb-6 mt-4 hover:underline block"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Back
          </Link>
        )}

        <h1 className="text-3xl font-extrabold tracking-tight mb-1 mt-6" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>

        <GlassCard variant="elevated" className="p-6">
          {children}
        </GlassCard>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

export function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aurora-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.5 }} />
      </div>

      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div variants={fadeRise} initial="initial" animate="animate" className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}>N</div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>NowCare</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Create account
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Choose how you want to use NowCare.</p>

        <div className="flex flex-col gap-3">
          {[
            { icon: <User size={24} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />, label: 'I am a patient', desc: 'Find care based on your symptoms.', to: '/signup/patient' },
            { icon: <Stethoscope size={24} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />, label: 'I am a doctor', desc: 'Verify your NPI and manage availability.', to: '/signup/doctor' },
            { icon: <Building2 size={24} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />, label: 'I am a hospital', desc: 'Post ER status and imaging slots.', to: '/signup/hospital' },
          ].map((r) => (
            <Link key={r.to} to={r.to} className="block group">
              <GlassCard variant="interactive" className="flex items-center gap-4 p-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)' }}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
                </div>
                <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
              </GlassCard>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-teal)' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

export function PatientSignupPage() {
  return (
    <AuthShell title="Patient account" subtitle="Find care based on your symptoms, right now." back="/signup">
      <PatientSignupForm />
    </AuthShell>
  )
}

export function DoctorSignupPage() {
  return (
    <AuthShell title="Doctor account" subtitle="Verify your NPI and connect with patients near you." back="/signup">
      <DoctorSignupForm />
    </AuthShell>
  )
}

export function HospitalSignupPage() {
  return (
    <AuthShell title="Hospital account" subtitle="Register your facility. Admin review takes under 24 hours." back="/signup">
      <HospitalSignupForm />
    </AuthShell>
  )
}

// Keep for backwards compat
export { SignupRoleChooser }

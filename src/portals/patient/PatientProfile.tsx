import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Moon, Sun, LogOut, ChevronRight, Bell, FileText, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { toast } from 'sonner'
import { auth } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { fadeRise, stagger } from '../../lib/motion'

function SettingRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-4 text-left transition-colors hover:bg-[var(--surface-tint)] rounded-xl"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {value && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{value}</p>}
      </div>
      <ChevronRight size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
    </button>
  )
}

export default function PatientProfile() {
  const { user, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const displayName = profile?.email?.split('@')[0]
    ?.replace(/[._-]/g, ' ')
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') ?? 'Patient'

  const initial = displayName.charAt(0).toUpperCase()

  async function handleSignOut() {
    try {
      await signOut(auth)
      navigate('/login')
    } catch {
      toast.error('Could not sign out. Try again.')
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-xl mx-auto space-y-6">
      <motion.div variants={fadeRise}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Account settings and preferences.</p>
      </motion.div>

      {/* Avatar + identity */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-violet) 100%)',
                color: '#fff',
              }}
            >
              {initial}
            </div>
            <div>
              <p className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-teal)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--accent-teal)' }}>Patient account</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Navigation shortcuts */}
      <motion.div variants={fadeRise}>
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>QUICK ACCESS</p>
        <GlassCard className="overflow-hidden">
          <SettingRow
            icon={<History size={15} strokeWidth={1.75} />}
            label="My History"
            value="Past assessments and documents"
            onClick={() => navigate('/patient/history')}
          />
          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
          <SettingRow
            icon={<FileText size={15} strokeWidth={1.75} />}
            label="My Documents"
            value="Lab results, prescriptions, scans"
            onClick={() => navigate('/patient/documents')}
          />
        </GlassCard>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={fadeRise}>
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>PREFERENCES</p>
        <GlassCard className="overflow-hidden">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 py-3 px-4 text-left transition-colors hover:bg-[var(--surface-tint)] rounded-xl"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
              </p>
            </div>
            <div
              className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--surface-tint)', color: 'var(--accent-teal)' }}
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </div>
          </button>
        </GlassCard>
      </motion.div>

      {/* Account */}
      <motion.div variants={fadeRise}>
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>ACCOUNT</p>
        <GlassCard className="overflow-hidden">
          <SettingRow
            icon={<Mail size={15} strokeWidth={1.75} />}
            label="Email address"
            value={user?.email ?? ''}
          />
          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
          <SettingRow
            icon={<Shield size={15} strokeWidth={1.75} />}
            label="Security"
            value="Password managed via email"
          />
        </GlassCard>
      </motion.div>

      {/* Sign out */}
      <motion.div variants={fadeRise} className="pb-4">
        <Button variant="secondary" className="w-full" onClick={handleSignOut}>
          <LogOut size={16} strokeWidth={1.75} />
          Sign out
        </Button>
      </motion.div>
    </motion.div>
  )
}

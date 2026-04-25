import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  Activity,
  Camera,
  FileText,
  History,
  LogOut,
  Mail,
  Moon,
  Save,
  Shield,
  Sun,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { auth, db } from '../../services/firebase'
import { uploadPatientPhoto } from '../../services/storage'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { useTheme } from '../../context/ThemeContext'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { fadeRise, stagger } from '../../lib/motion'
import type { Patient } from '../../types'

type ProfileForm = {
  displayName: string
  age: string
  gender: Patient['gender']
  height: string
  weight: string
  medications: string
  pastMedications: string
  knownDiseases: string
  allergies: string
  emergencyContact: string
}

const genderOptions = [
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Nonbinary' },
]

function listToText(value?: string[]) {
  return value?.join(', ') ?? ''
}

function textToList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function PatientProfile() {
  const { user, profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { data: patient } = useFirestoreDoc<Patient>(user ? `patients/${user.uid}` : '')

  const fallbackName = useMemo(() => {
    return profile?.email?.split('@')[0]
      ?.replace(/[._-]/g, ' ')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ?? 'Patient'
  }, [profile?.email])

  const [form, setForm] = useState<ProfileForm>({
    displayName: '',
    age: '',
    gender: 'prefer_not_to_say',
    height: '',
    weight: '',
    medications: '',
    pastMedications: '',
    knownDiseases: '',
    allergies: '',
    emergencyContact: '',
  })
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    setForm({
      displayName: patient?.displayName ?? fallbackName,
      age: patient?.age ? String(patient.age) : '',
      gender: patient?.gender ?? 'prefer_not_to_say',
      height: patient?.height ?? '',
      weight: patient?.weight ?? '',
      medications: listToText(patient?.medications),
      pastMedications: listToText(patient?.pastMedications),
      knownDiseases: listToText(patient?.knownDiseases),
      allergies: listToText(patient?.allergies),
      emergencyContact: patient?.emergencyContact ?? '',
    })
  }, [patient, fallbackName])

  const displayName = form.displayName.trim() || fallbackName
  const initial = displayName.charAt(0).toUpperCase()

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!user) return
    const trimmedAge = form.age.trim()
    const age = trimmedAge ? Number(trimmedAge) : null
    if (age !== null && (!Number.isFinite(age) || age < 0 || age > 130)) {
      toast.error('Enter a valid age.')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName: form.displayName.trim(),
        gender: form.gender,
        height: form.height.trim(),
        weight: form.weight.trim(),
        medications: textToList(form.medications),
        pastMedications: textToList(form.pastMedications),
        knownDiseases: textToList(form.knownDiseases),
        allergies: textToList(form.allergies),
        emergencyContact: form.emergencyContact.trim(),
        updatedAt: serverTimestamp(),
      }
      if (age !== null) payload.age = age

      await setDoc(doc(db, 'patients', user.uid), payload, { merge: true })
      toast.success('Profile updated.')
    } catch {
      toast.error('Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenderChange(value: Patient['gender']) {
    updateField('gender', value)
    if (!user) return

    try {
      await setDoc(doc(db, 'patients', user.uid), {
        uid: user.uid,
        gender: value,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      toast.success('Gender updated.')
    } catch {
      toast.error('Could not update gender.')
    }
  }

  async function handlePhoto(file?: File) {
    if (!user || !file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Choose an image under 8 MB.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setPhotoUploading(true)
    try {
      const { downloadUrl } = await uploadPatientPhoto(user.uid, file)
      await setDoc(doc(db, 'patients', user.uid), {
        uid: user.uid,
        photoURL: downloadUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setPhotoPreview(null)
      toast.success('Profile photo updated.')
    } catch (err) {
      setPhotoPreview(null)
      const message = err instanceof Error ? err.message : ''
      toast.error(message.includes('storage') || message.includes('permission')
        ? 'Photo upload failed. Check Firebase Storage rules and try again.'
        : 'Could not upload your profile photo.')
    } finally {
      URL.revokeObjectURL(previewUrl)
      setPhotoUploading(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
      navigate('/login')
    } catch {
      toast.error('Could not sign out. Try again.')
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto max-w-5xl space-y-6">
      <motion.div variants={fadeRise}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Keep your health details current so assessments and provider search have better context.
        </p>
      </motion.div>

      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
              {photoPreview || patient?.photoURL ? (
                <img src={photoPreview ?? patient?.photoURL} alt={displayName} className="h-24 w-24 rounded-3xl object-cover" />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl text-4xl font-extrabold"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-violet) 100%)',
                    color: '#fff',
                  }}
                >
                  {initial}
                </div>
              )}
              <label
                className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-transform hover:scale-105"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--accent-teal)' }}
                title="Upload profile photo"
              >
                {photoUploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-teal)] border-t-transparent" />
                ) : (
                  <Camera size={16} strokeWidth={1.75} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoUploading}
                  onChange={(e) => {
                    handlePhoto(e.target.files?.[0])
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  patient?.age ? `${patient.age} years old` : 'Age not set',
                  patient?.height || 'Height not set',
                  patient?.weight || 'Weight not set',
                ].map((item) => (
                  <span key={item} className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} loading={saving}>
              <Save size={16} strokeWidth={1.75} />
              Save changes
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <motion.div variants={fadeRise} className="space-y-6">
          <GlassCard className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <User size={18} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Personal details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" value={form.displayName} onChange={(e) => updateField('displayName', e.target.value)} />
              <Input label="Age" type="number" min={0} max={130} value={form.age} onChange={(e) => updateField('age', e.target.value)} />
              <Select
                label="Gender"
                value={form.gender}
                options={genderOptions}
                onChange={(e) => handleGenderChange(e.target.value as Patient['gender'])}
                helperText="Saves immediately when changed."
              />
              <Input label="Emergency contact" value={form.emergencyContact} onChange={(e) => updateField('emergencyContact', e.target.value)} placeholder="Name and phone number" />
              <Input label="Height" value={form.height} onChange={(e) => updateField('height', e.target.value)} placeholder="5 ft 8 in or 173 cm" />
              <Input label="Weight" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} placeholder="160 lb or 73 kg" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex items-center gap-2">
              <Activity size={18} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Health background</h2>
            </div>
            <div className="grid gap-4">
              <Textarea
                label="Current medications"
                value={form.medications}
                onChange={(e) => updateField('medications', e.target.value)}
                helperText="Separate multiple items with commas or new lines."
                rows={3}
              />
              <Textarea
                label="Past medications"
                value={form.pastMedications}
                onChange={(e) => updateField('pastMedications', e.target.value)}
                helperText="Include medicines you used before if they matter."
                rows={3}
              />
              <Textarea
                label="Known diseases or conditions"
                value={form.knownDiseases}
                onChange={(e) => updateField('knownDiseases', e.target.value)}
                helperText="Examples: diabetes, asthma, hypertension."
                rows={3}
              />
              <Textarea
                label="Allergies"
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                rows={2}
              />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeRise} className="space-y-6">
          <GlassCard className="overflow-hidden">
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quick access</p>
            </div>
            {[
              { icon: History, label: 'My History', value: 'Past assessments and visits', to: '/patient/history' },
              { icon: FileText, label: 'My Documents', value: 'Lab results, prescriptions, scans', to: '/patient/documents' },
            ].map((row) => (
              <button
                key={row.label}
                onClick={() => navigate(row.to)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-tint)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                  <row.icon size={15} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.value}</p>
                </div>
              </button>
            ))}
          </GlassCard>

          <GlassCard className="overflow-hidden">
            <div className="border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Account</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                <Mail size={15} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Email address</p>
                <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                <Shield size={15} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Security</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Password managed via email</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <button onClick={toggleTheme} className="flex w-full items-center gap-3 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</p>
              </div>
            </button>
          </GlassCard>

          <Button variant="secondary" className="w-full" onClick={handleSignOut}>
            <LogOut size={16} strokeWidth={1.75} />
            Sign out
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

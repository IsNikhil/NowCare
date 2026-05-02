import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../services/firebase'
import { patientSignupSchema, type PatientSignupFormData } from '../../lib/validation'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useToastContext } from '../../context/ToastContext'
import { Mail, Lock, MapPin, CheckCircle2, Loader2 } from 'lucide-react'

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function PatientSignupForm() {
  const navigate = useNavigate()
  const { addToast } = useToastContext()
  const [locating, setLocating] = useState(false)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientSignupFormData>({ resolver: zodResolver(patientSignupSchema) as never })

  function detectLocation() {
    if (!navigator.geolocation) {
      addToast('error', 'Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setValue('lat', latitude, { shouldValidate: true })
        setValue('lng', longitude, { shouldValidate: true })
        setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setLocating(false)
      },
      () => {
        addToast('error', 'Could not detect location. Please allow location access and try again.')
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  async function onSubmit(data: PatientSignupFormData) {
    let created = false
    let uid = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      uid = cred.user.uid
      created = true

      await setDoc(doc(db, 'users', uid), {
        email: data.email,
        role: 'patient',
        createdAt: serverTimestamp(),
      })

      const patientDoc: Record<string, unknown> = { uid, age: data.age, gender: data.gender, height: data.height, weight: data.weight }
      if (data.lat != null && data.lng != null) {
        patientDoc.lat = data.lat
        patientDoc.lng = data.lng
      }
      await setDoc(doc(db, 'patients', uid), patientDoc)

      navigate('/patient')
    } catch (err) {
      if (created && uid) {
        try { await deleteUser(auth.currentUser!) } catch { /* rollback best-effort */ }
      }
      const msg = err instanceof Error ? err.message : 'Signup failed'
      if (msg.includes('email-already-in-use')) {
        addToast('error', 'That email is already registered. Try signing in.')
      } else {
        addToast('error', 'Could not create account. Please try again.')
      }
    }
  }

  const locationError = errors.lat?.message ?? errors.lng?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        icon={<Mail size={16} strokeWidth={1.75} />}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        icon={<Lock size={16} strokeWidth={1.75} />}
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Age"
        type="number"
        placeholder="Your age"
        error={errors.age?.message}
        {...register('age')}
      />
      <Select
        label="Gender"
        options={genderOptions}
        placeholder="Select gender"
        error={errors.gender?.message}
        {...register('gender')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Height"
          type="text"
          placeholder="e.g. 5ft 10in or 178 cm"
          error={errors.height?.message}
          {...register('height')}
        />
        <Input
          label="Weight"
          type="text"
          placeholder="e.g. 165 lbs or 75 kg"
          error={errors.weight?.message}
          {...register('weight')}
        />
      </div>

      <div className="glass-1 rounded-2xl p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MapPin size={16} strokeWidth={1.75} className="text-teal-500" />
          Your location
        </p>

        {locationLabel ? (
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} strokeWidth={1.75} className="text-emerald-500 shrink-0" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Location detected</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{locationLabel}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--accent-teal)] bg-[var(--surface-tint)] text-[var(--accent-teal)] text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-60"
        >
          {locating
            ? <><Loader2 size={15} strokeWidth={1.75} className="animate-spin" /> Detecting location...</>
            : <><MapPin size={15} strokeWidth={1.75} /> {locationLabel ? 'Re-detect my location' : 'Use my current location'}</>
          }
        </button>

        {locationError && (
          <p className="text-xs text-rose-500 mt-2">{locationError}</p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Optional — used to find providers near you. You can set it later from the providers page.</p>
      </div>

      <Button type="submit" loading={isSubmitting} fullWidth className="!rounded-lg mt-2">
        Create patient account
      </Button>
    </form>
  )
}

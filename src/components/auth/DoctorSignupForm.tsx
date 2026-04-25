import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../services/firebase'
import { doctorSignupSchema, type DoctorSignupFormData } from '../../lib/validation'
import { verifyNPI } from '../../services/nppes'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToastContext } from '../../context/ToastContext'
import { Mail, Lock, CreditCard } from 'lucide-react'

export default function DoctorSignupForm() {
  const navigate = useNavigate()
  const { addToast } = useToastContext()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorSignupFormData>({ resolver: zodResolver(doctorSignupSchema) })

  async function onSubmit(data: DoctorSignupFormData) {
    let created = false
    let uid = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      uid = cred.user.uid
      created = true

      await setDoc(doc(db, 'users', uid), {
        email: data.email,
        role: 'doctor',
        createdAt: serverTimestamp(),
      })

      const npiData = await verifyNPI(data.npi)

      await setDoc(doc(db, 'doctors', uid), {
        uid,
        npi: data.npi,
        npi_data: npiData ?? null,
        verified: npiData !== null,
        badge: 'npi_verified',
        specialty: npiData?.specialty ?? '',
      })

      if (!npiData) {
        addToast('info', 'NPI could not be verified right now. You can retry from your dashboard.')
      }

      navigate('/doctor')
    } catch (err) {
      if (created && uid) {
        try { await deleteUser(auth.currentUser!) } catch { /* rollback best-effort */ }
      }
      const msg = err instanceof Error ? err.message : 'Signup failed'
      if (msg.includes('email-already-in-use')) {
        addToast('error', 'That email is already registered.')
      } else {
        addToast('error', 'Could not create account. Please try again.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Email address"
        type="email"
        placeholder="you@clinic.com"
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
        label="NPI Number"
        type="text"
        placeholder="10-digit NPI"
        icon={<CreditCard size={16} strokeWidth={1.75} />}
        helperText="Your National Provider Identifier from NPPES."
        error={errors.npi?.message}
        {...register('npi')}
      />
      <Button type="submit" loading={isSubmitting} fullWidth className="!rounded-lg mt-2">
        Create doctor account
      </Button>
    </form>
  )
}

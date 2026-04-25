import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../services/firebase'
import { hospitalSignupSchema, type HospitalSignupFormData } from '../../lib/validation'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useToastContext } from '../../context/ToastContext'
import { Mail, Lock, Building2, FileText } from 'lucide-react'

export default function HospitalSignupForm() {
  const navigate = useNavigate()
  const { addToast } = useToastContext()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HospitalSignupFormData>({ resolver: zodResolver(hospitalSignupSchema) })

  async function onSubmit(data: HospitalSignupFormData) {
    let created = false
    let uid = ''
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      uid = cred.user.uid
      created = true

      await setDoc(doc(db, 'users', uid), {
        email: data.email,
        role: 'hospital',
        createdAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'hospitals', uid), {
        uid,
        name: data.name,
        email: data.email,
        status: 'pending',
        supportingDocuments: data.supportingDocuments ?? '',
        createdAt: serverTimestamp(),
      })

      navigate('/hospital/pending')
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
        placeholder="admin@yourhospital.com"
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
        label="Hospital name"
        type="text"
        placeholder="General Medical Center"
        icon={<Building2 size={16} strokeWidth={1.75} />}
        helperText="This name will be reviewed and matched to CMS data."
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Supporting documents"
        type="text"
        placeholder="Link to license, accreditation, or verification docs (optional)"
        icon={<FileText size={16} strokeWidth={1.75} />}
        {...register('supportingDocuments')}
      />
      <div className="glass-1 rounded-2xl p-4">
        <p className="text-sm text-slate-600">
          After registration, your hospital will be reviewed by an admin before going live. This usually takes within 24 hours.
        </p>
      </div>
      <Button type="submit" loading={isSubmitting} fullWidth className="!rounded-lg mt-2">
        Submit for review
      </Button>
    </form>
  )
}

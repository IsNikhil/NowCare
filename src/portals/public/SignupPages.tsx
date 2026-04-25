import SignupRoleChooser from '../../components/auth/SignupRoleChooser'
import PatientSignupForm from '../../components/auth/PatientSignupForm'
import DoctorSignupForm from '../../components/auth/DoctorSignupForm'
import HospitalSignupForm from '../../components/auth/HospitalSignupForm'

export function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-ink-800 tracking-tight text-center mb-2">Create your account</h1>
        <p className="text-slate-500 text-center mb-8">Who are you?</p>
        <SignupRoleChooser />
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-teal-600 font-semibold hover:text-teal-700">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export function PatientSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/signup" className="text-sm text-slate-500 hover:text-ink-700 block mb-6">Back</a>
        <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-2">Patient account</h1>
        <p className="text-slate-500 mb-6">Get an assessment and find nearby providers.</p>
        <PatientSignupForm />
      </div>
    </div>
  )
}

export function DoctorSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/signup" className="text-sm text-slate-500 hover:text-ink-700 block mb-6">Back</a>
        <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-2">Doctor account</h1>
        <p className="text-slate-500 mb-6">Verify your NPI and manage your availability.</p>
        <DoctorSignupForm />
      </div>
    </div>
  )
}

export function HospitalSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/signup" className="text-sm text-slate-500 hover:text-ink-700 block mb-6">Back</a>
        <h1 className="text-2xl font-bold text-ink-800 tracking-tight mb-2">Hospital account</h1>
        <p className="text-slate-500 mb-6">Register your facility for admin review.</p>
        <HospitalSignupForm />
      </div>
    </div>
  )
}

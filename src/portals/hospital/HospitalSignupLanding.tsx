import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { stockUrl } from '../../lib/stockPhotos'
import { Building2, Activity, HardDrive } from 'lucide-react'

export default function HospitalSignupLanding() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${stockUrl('heroHospital', 1200)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900/60 to-teal-900/40" />
      <div className="relative z-10 max-w-lg w-full">
        <Card level={2} padding="lg">
          <div className="text-center mb-8">
            <Building2 size={40} strokeWidth={1.75} className="text-teal-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-ink-800 tracking-tight">List your hospital on NowCare</h1>
          </div>
          <div className="space-y-4 mb-8">
            {[
              { icon: <Activity size={20} strokeWidth={1.75} />, label: 'Live ER status updates visible to patients' },
              { icon: <HardDrive size={20} strokeWidth={1.75} />, label: 'Manage MRI, CT, and X-Ray slot availability' },
              { icon: <Building2 size={20} strokeWidth={1.75} />, label: 'CMS data integrated and displayed to patients' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="text-teal-500">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <Link to="/signup/hospital">
            <Button fullWidth size="lg">Register your hospital</Button>
          </Link>
          <p className="text-xs text-slate-400 text-center mt-4">
            Registration is reviewed within 24 hours.
          </p>
        </Card>
      </div>
    </div>
  )
}

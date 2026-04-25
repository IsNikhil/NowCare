import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { verifyNPI } from '../../services/nppes'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { Doctor, Hospital, VerificationBadge } from '../../types'

export default function NPIVerify() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [npiInput, setNpiInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: doctor, loading: docLoading } = useFirestoreDoc<Doctor>(
    user ? `doctors/${user.uid}` : ''
  )

  const [seenNpi, setSeenNpi] = useState<string | undefined>(undefined)
  if (doctor?.npi && doctor.npi !== seenNpi) {
    setSeenNpi(doctor.npi)
    if (!npiInput) setNpiInput(doctor.npi)
  }

  async function handleVerify() {
    if (!user || !npiInput.trim()) return
    setLoading(true)
    setError(null)

    try {
      const npiData = await verifyNPI(npiInput.trim())

      if (!npiData) {
        setError('NPI not found or inactive. Check your number and try again.')
        return
      }

      let badge: VerificationBadge = 'npi_verified'
      if (npiData.organizationName) {
        try {
          const orgNameLower = npiData.organizationName.toLowerCase()
          const hospitalsSnap = await getDocs(
            query(collection(db, 'hospitals'), where('status', '==', 'approved'))
          )
          for (const h of hospitalsSnap.docs) {
            const hName = ((h.data() as Hospital).name ?? '').toLowerCase()
            if (hName.includes(orgNameLower) || orgNameLower.includes(hName)) {
              badge = 'hospital_verified'
              break
            }
          }
        } catch {
          // ignore, proceed with npi_verified
        }
      }

      try {
        await setDoc(
          doc(db, 'doctors', user.uid),
          {
            npi: npiInput.trim(),
            npi_data: npiData,
            verified: true,
            name: npiData.name,
            specialty: npiData.specialty,
            address: npiData.practiceAddress ?? '',
            badge,
            badgeUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch {
        setError('Could not save your verification. Please try again.')
        return
      }

      navigate('/doctor')
    } catch {
      setError('Verification failed due to a connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (docLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" className="text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="NPI verification"
        subtitle="Enter your National Provider Identifier to verify your credentials."
      />

      <Card level={2} padding="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="NPI number"
            placeholder="10-digit NPI"
            value={npiInput}
            onChange={(e) => {
              setNpiInput(e.target.value)
              setError(null)
            }}
            maxLength={10}
          />

          {error && (
            <p className="text-sm text-rose-500">{error}</p>
          )}

          <Button
            onClick={handleVerify}
            loading={loading}
            disabled={loading || npiInput.trim().length !== 10}
            fullWidth
            size="lg"
          >
            {loading ? 'Verifying...' : 'Verify and continue'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

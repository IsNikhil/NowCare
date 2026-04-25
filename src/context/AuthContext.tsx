import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import type { Role, User, HospitalStatus } from '../types'

type AuthContextValue = {
  user: FirebaseUser | null
  profile: User | null
  role: Role | null
  hospitalStatus: HospitalStatus | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [hospitalStatus, setHospitalStatus] = useState<HospitalStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setRole(null)
        setHospitalStatus(null)
        setLoading(false)
        return
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (!userSnap.exists()) {
          await signOut(auth)
          setUser(null)
          setProfile(null)
          setRole(null)
          setHospitalStatus(null)
          setLoading(false)
          return
        }

        const userProfile = userSnap.data() as User
        setUser(firebaseUser)
        setProfile(userProfile)
        setRole(userProfile.role)

        if (userProfile.role === 'hospital') {
          const hospSnap = await getDoc(doc(db, 'hospitals', firebaseUser.uid))
          if (hospSnap.exists()) {
            const hospData = hospSnap.data() as { status: HospitalStatus }
            setHospitalStatus(hospData.status)
          }
        } else {
          setHospitalStatus(null)
        }
      } catch {
        setUser(null)
        setProfile(null)
        setRole(null)
        setHospitalStatus(null)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  async function logout() {
    await signOut(auth)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, hospitalStatus, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  GeoPoint,
  serverTimestamp,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import * as dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig, 'seed-hospitals')
const db = getFirestore(app)
const auth = getAuth(app)

const SPECIFIC_HOSPITALS = [
  {
    email: 'tulane@nowcare.demo',
    name: 'Tulane Medical Center',
    cms_data: {
      facility_name: 'Tulane Medical Center',
      address: '1415 Tulane Ave',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70112',
      phone_number: '(504) 988-5263',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
    },
    coordinates: new GeoPoint(29.9499, -90.0758),
    lat: 29.9499,
    lng: -90.0758,
    er_status: 'moderate',
  },
  {
    email: 'ourladylake@nowcare.demo',
    name: 'Our Lady of the Lake Regional Medical Center',
    cms_data: {
      facility_name: 'Our Lady of the Lake Regional Medical Center',
      address: '5000 Hennessy Blvd',
      city: 'Baton Rouge',
      state: 'LA',
      zip_code: '70808',
      phone_number: '(225) 765-6565',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
    },
    coordinates: new GeoPoint(30.3725, -91.1073),
    lat: 30.3725,
    lng: -91.1073,
    er_status: 'low',
  },
]

async function createOrGetUid(email: string, password: string): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return cred.user.uid
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return cred.user.uid
    }
    throw err
  }
}

async function seedHospitals() {
  console.log('Seeding NowCare hospitals...\n')

  // Backfill existing hospital auth users that don't yet have a hospitals doc
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (adminEmail && adminPassword && adminEmail !== 'REPLACE_ME') {
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
      console.log('Signed in as admin.')

      const snap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'hospital'))
      )
      console.log(`Found ${snap.size} hospital user(s) in users collection.`)

      for (const userDoc of snap.docs) {
        const uid = userDoc.id
        const data = userDoc.data() as { displayName?: string; email?: string }
        await setDoc(
          doc(db, 'hospitals', uid),
          {
            uid,
            name: data.displayName ?? data.email ?? 'Hospital',
            email: data.email ?? '',
            status: 'approved',
            er_status: 'low',
            er_updated: serverTimestamp(),
            cms_data: {},
            cms_benchmarks: {},
          },
          { merge: true }
        )
        console.log(`  Backfilled: ${uid} (${data.email ?? 'no email'})`)
      }
    } catch (err) {
      console.log(
        '  Admin sign-in skipped:',
        err instanceof Error ? err.message : String(err)
      )
    }
  } else {
    console.log('SEED_ADMIN_EMAIL not set — skipping backfill of existing users.')
  }

  console.log('\nSeeding specific Louisiana hospitals...')

  for (const h of SPECIFIC_HOSPITALS) {
    const uid = await createOrGetUid(h.email, 'Demo1234!')

    await setDoc(doc(db, 'users', uid), {
      uid,
      email: h.email,
      role: 'hospital',
      createdAt: serverTimestamp(),
    })

    await setDoc(doc(db, 'hospitals', uid), {
      uid,
      name: h.name,
      email: h.email,
      status: 'approved',
      er_status: h.er_status,
      er_updated: serverTimestamp(),
      coordinates: h.coordinates,
      lat: h.lat,
      lng: h.lng,
      cms_data: h.cms_data,
      cms_benchmarks: {},
      createdAt: serverTimestamp(),
    })

    console.log(`  Created: ${h.name}`)
    console.log(`    Login: ${h.email} / Demo1234!`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

seedHospitals().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

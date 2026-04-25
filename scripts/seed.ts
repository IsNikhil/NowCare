import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function createUser<T extends Record<string, unknown>>(email: string, password: string, role: string, extraData: T) {
  let uid: string
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    uid = cred.user.uid
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      uid = cred.user.uid
    } else {
      throw err
    }
  }
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    role,
    createdAt: serverTimestamp(),
  })
  return { uid, ...extraData }
}

async function seed() {
  console.log('Seeding NowCare demo data...')

  const patientData = await createUser('patient@demo.com', 'Demo1234!', 'patient', {})
  await setDoc(doc(db, 'patients', patientData.uid), {
    uid: patientData.uid,
    displayName: 'Alex Rivera',
    dob: '1990-06-15',
    createdAt: serverTimestamp(),
  })
  console.log('Created patient: patient@demo.com / Demo1234!')

  const doctorData = await createUser('doctor@demo.com', 'Demo1234!', 'doctor', {})
  await setDoc(doc(db, 'doctors', doctorData.uid), {
    uid: doctorData.uid,
    displayName: 'Dr. Sarah Chen',
    npi: '1234567890',
    verified: true,
    specialty: 'Internal Medicine',
    lat: 30.3322,
    lng: -81.6557,
    telehealth: true,
    bio: 'Board-certified internist with 12 years of experience.',
    createdAt: serverTimestamp(),
  })
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  for (const day of days) {
    for (const time of ['09:00', '10:00', '11:00', '14:00', '15:00']) {
      await addDoc(collection(db, 'doctor_slots'), {
        doctorId: doctorData.uid,
        doctorName: 'Dr. Sarah Chen',
        day,
        time,
        available: true,
        telehealth: true,
        createdAt: serverTimestamp(),
      })
    }
  }
  console.log('Created doctor: doctor@demo.com / Demo1234!')

  // Demo hospital 1 (approved, Jacksonville area)
  const hosp1Data = await createUser('hospital1@demo.com', 'Demo1234!', 'hospital', {})
  await setDoc(doc(db, 'hospitals', hosp1Data.uid), {
    uid: hosp1Data.uid,
    name: 'St. Vincent Medical Center',
    email: 'hospital1@demo.com',
    status: 'approved',
    er_status: 'moderate',
    er_updated: serverTimestamp(),
    lat: 30.3211,
    lng: -81.6623,
    cms_data: {
      facility_name: 'St. Vincent Medical Center',
      address: '1800 Barrs St',
      city: 'Jacksonville',
      state: 'FL',
      zip_code: '32204',
      phone_number: '(904) 308-7300',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
    },
    cms_benchmarks: {},
    createdAt: serverTimestamp(),
  })
  // Add MRI slots
  for (let i = 0; i < 5; i++) {
    const slotDate = new Date()
    slotDate.setDate(slotDate.getDate() + i + 1)
    for (const time of ['08:00', '10:30', '13:00']) {
      const [h, m] = time.split(':').map(Number)
      const dt = new Date(slotDate)
      dt.setHours(h, m, 0, 0)
      await addDoc(collection(db, 'mri_slots'), {
        hospitalId: hosp1Data.uid,
        datetime: dt,
        type: 'MRI',
        available: true,
        createdAt: serverTimestamp(),
      })
    }
  }
  console.log('Created hospital 1: hospital1@demo.com / Demo1234!')

  // Demo hospital 2 (approved, Jacksonville area)
  const hosp2Data = await createUser('hospital2@demo.com', 'Demo1234!', 'hospital', {})
  await setDoc(doc(db, 'hospitals', hosp2Data.uid), {
    uid: hosp2Data.uid,
    name: 'Baptist Medical Center Jacksonville',
    email: 'hospital2@demo.com',
    status: 'approved',
    er_status: 'low',
    er_updated: serverTimestamp(),
    lat: 30.2899,
    lng: -81.6614,
    cms_data: {
      facility_name: 'Baptist Medical Center Jacksonville',
      address: '800 Prudential Dr',
      city: 'Jacksonville',
      state: 'FL',
      zip_code: '32207',
      phone_number: '(904) 202-2000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
    },
    cms_benchmarks: {},
    createdAt: serverTimestamp(),
  })
  console.log('Created hospital 2: hospital2@demo.com / Demo1234!')

  console.log('\nSeed complete! Demo accounts:')
  console.log('  Patient:   patient@demo.com  / Demo1234!')
  console.log('  Doctor:    doctor@demo.com   / Demo1234!')
  console.log('  Hospital1: hospital1@demo.com / Demo1234!')
  console.log('  Hospital2: hospital2@demo.com / Demo1234!')
  console.log('\nAdmin account must be created manually in Firebase Console')
  console.log('  1. Create user with email/password in Firebase Auth')
  console.log('  2. Add doc to /users/{uid} with role: "admin"')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  Timestamp,
  where,
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

const app = initializeApp(firebaseConfig, 'seed-availability')
const db = getFirestore(app)
const auth = getAuth(app)

type Role = 'doctor' | 'hospital'
type ScanType = 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound'
type HospitalDoc = {
  id: string
  name?: string
  email?: string
  services?: string[]
  scanTypes?: ScanType[]
  cms_data?: {
    facility_name?: string
  }
}

const PASSWORD = 'Demo1234!'

const DEMO_DOCTORS = [
  {
    email: 'doctor@demo.nowcare.app',
    displayName: 'Dr. Maya Patel',
    specialty: 'family_medicine',
    credentials: 'MD',
    npi: '1992999999',
    lat: 30.5044,
    lng: -90.4612,
    acceptedInsurance: ['blue_cross_blue_shield', 'aetna', 'united_healthcare', 'medicare_original', 'medicaid'],
  },
  {
    email: 'doctor1@demo.nowcare.app',
    displayName: 'Dr. Jordan Lee',
    specialty: 'internal_medicine',
    credentials: 'DO',
    npi: '1888888888',
    lat: 30.506,
    lng: -90.459,
    acceptedInsurance: ['blue_cross_blue_shield', 'cigna', 'humana', 'medicare_original'],
  },
]

const DEMO_HOSPITALS = [
  {
    email: 'hospital@demo.nowcare.app',
    name: 'NowCare Demo Hospital',
    lat: 30.5042,
    lng: -90.4602,
    phone: '(985) 555-0110',
    address: '15790 Paul Vega MD Dr, Hammond, LA 70403',
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'] as ScanType[],
  },
  {
    email: 'hospital1@demo.nowcare.app',
    name: 'Hospital 1 Demo Medical Center',
    lat: 30.5065,
    lng: -90.4621,
    phone: '(985) 555-0142',
    address: '100 Medical Center Dr, Hammond, LA 70403',
    scanTypes: ['MRI', 'X-Ray', 'Ultrasound'] as ScanType[],
  },
]

async function upsertUser(email: string, password: string, role: Role): Promise<string> {
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

  await setDoc(doc(db, 'users', uid), { uid, email, role, createdAt: serverTimestamp() }, { merge: true })
  return uid
}

function futureDate(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d
}

function isWeekday(daysFromNow: number) {
  const d = futureDate(daysFromNow, 9)
  const day = d.getDay()
  return day !== 0 && day !== 6
}

function scanTypesForHospital(hospital: HospitalDoc): ScanType[] {
  if (hospital.scanTypes?.length) return hospital.scanTypes

  const services = (hospital.services ?? []).join(' ').toLowerCase()
  const types: ScanType[] = []
  if (services.includes('mri')) types.push('MRI')
  if (services.includes('ct')) types.push('CT')
  if (services.includes('x-ray') || services.includes('xray')) types.push('X-Ray')
  if (services.includes('ultrasound')) types.push('Ultrasound')

  return types.length > 0 ? types : ['MRI', 'CT', 'X-Ray', 'Ultrasound']
}

async function seedScanSlotsForHospital(hospital: HospitalDoc, daysToSeed = 14): Promise<number> {
  const hours = [7, 8, 9, 10, 11, 13, 14, 15, 16]
  const scanTypes = scanTypesForHospital(hospital)
  const hospitalName = hospital.cms_data?.facility_name ?? hospital.name ?? 'Hospital'
  let count = 0

  for (let day = 1; day <= daysToSeed; day++) {
    for (const type of scanTypes) {
      for (const hour of hours) {
        const slotId = `${hospital.id}_${type.replace(/\W/g, '')}_${day}_${hour}`
        await setDoc(doc(db, 'mri_slots', slotId), {
          hospitalId: hospital.id,
          hospitalName,
          datetime: Timestamp.fromDate(futureDate(day, hour)),
          type,
          available: (day + hour + type.length) % 5 !== 0,
          createdAt: serverTimestamp(),
        }, { merge: true })
        count += 1
      }
    }
  }

  return count
}

async function seedDoctorAvailability() {
  console.log('\nSeeding demo doctor appointment slots...')

  for (const doctor of DEMO_DOCTORS) {
    const uid = await upsertUser(doctor.email, PASSWORD, 'doctor')

    await setDoc(doc(db, 'doctors', uid), {
      uid,
      email: doctor.email,
      displayName: doctor.displayName,
      name: doctor.displayName,
      specialty: doctor.specialty,
      credentials: doctor.credentials,
      npi: doctor.npi,
      npi_data: {
        npi: doctor.npi,
        name: doctor.displayName,
        credential: doctor.credentials,
        specialty: doctor.specialty,
        active: true,
      },
      verified: true,
      badge: 'npi_verified',
      lat: doctor.lat,
      lng: doctor.lng,
      telehealth: true,
      avgRating: 4.8,
      totalReviews: 96,
      languages: ['English', 'Spanish'],
      acceptedInsurance: doctor.acceptedInsurance,
      bio: 'Demo provider with seeded appointment availability for NowCare walkthroughs.',
      createdAt: serverTimestamp(),
    }, { merge: true })

    const hours = [8, 9, 10, 11, 13, 14, 15, 16]
    let count = 0
    for (let day = 1; day <= 21; day++) {
      if (!isWeekday(day)) continue
      for (const hour of hours) {
        const slotId = `${uid}_${day}_${hour}`
        await setDoc(doc(db, 'doctor_slots', slotId), {
          doctorId: uid,
          doctorName: doctor.displayName,
          specialty: doctor.specialty,
          datetime: Timestamp.fromDate(futureDate(day, hour)),
          available: true,
          status: 'open',
          durationMinutes: 30,
          createdAt: serverTimestamp(),
        }, { merge: true })
        count += 1
      }
    }

    console.log(`  Added ${count} slots for ${doctor.email}`)
  }
}

async function seedHospitalScanSlots() {
  console.log('\nSeeding demo hospital scan slots...')

  for (const hospital of DEMO_HOSPITALS) {
    const uid = await upsertUser(hospital.email, PASSWORD, 'hospital')

    await setDoc(doc(db, 'hospitals', uid), {
      uid,
      email: hospital.email,
      name: hospital.name,
      status: 'approved',
      lat: hospital.lat,
      lng: hospital.lng,
      phone: hospital.phone,
      address: hospital.address,
      er_status: 'low',
      er_updated: serverTimestamp(),
      services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Primary Care'],
      cms_data: {
        facility_name: hospital.name,
        address: hospital.address.split(',')[0],
        city: 'Hammond',
        state: 'LA',
        zip_code: '70403',
        phone_number: hospital.phone,
        emergency_services: 'Yes',
        hospital_type: 'Acute Care Hospitals',
        overall_rating: '4',
      },
      cms_benchmarks: {
        avgERWaitMinutes: 24,
        imagingEfficiencyScore: 86,
      },
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    }, { merge: true })

    const count = await seedScanSlotsForHospital({
      id: uid,
      name: hospital.name,
      scanTypes: hospital.scanTypes,
    })

    console.log(`  Added ${count} scan slots for ${hospital.email}`)
  }
}

async function seedAllApprovedHospitalScanSlots() {
  console.log('\nSeeding scan slots for all approved hospitals...')
  const snap = await getDocs(query(collection(db, 'hospitals'), where('status', '==', 'approved')))
  let total = 0
  let skipped = 0

  for (const hospitalDoc of snap.docs) {
    const hospital = { id: hospitalDoc.id, ...hospitalDoc.data() } as HospitalDoc
    const label = hospital.cms_data?.facility_name ?? hospital.name ?? hospital.id

    if (!hospital.email) {
      skipped += 1
      console.log(`  Skipped ${label}: no demo email on hospital record`)
      continue
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, hospital.email, PASSWORD)
      if (cred.user.uid !== hospital.id) {
        skipped += 1
        console.log(`  Skipped ${label}: email belongs to a different auth user`)
        continue
      }

      const count = await seedScanSlotsForHospital(hospital, 7)
      total += count
      console.log(`  Added ${count} scan slots for ${label}`)
    } catch (err) {
      skipped += 1
      const message = err instanceof Error ? err.message : String(err)
      console.log(`  Skipped ${label}: could not sign in with demo password (${message})`)
    }
  }

  console.log(`  Total scan slots seeded: ${total}`)
  if (skipped > 0) console.log(`  Skipped hospitals: ${skipped}`)
}

async function seedAvailability() {
  console.log('NowCare demo availability seed')
  console.log('==============================')
  await seedDoctorAvailability()
  await seedHospitalScanSlots()
  if (process.env.SEED_ALL_APPROVED_HOSPITALS === 'true') {
    await seedAllApprovedHospitalScanSlots()
  } else {
    console.log('\nSkipped all-approved-hospitals scan seeding.')
    console.log('Set SEED_ALL_APPROVED_HOSPITALS=true to run that heavier pass.')
  }
  console.log('\nDone. Demo password is Demo1234!')
  process.exit(0)
}

seedAvailability().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

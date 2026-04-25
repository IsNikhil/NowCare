/**
 * NowCare Demo Seed Script
 * Populates Firestore with real Hammond, LA area hospitals, doctors, and demo accounts.
 * Run: npm run seed
 *
 * After running, demo credentials:
 *   Patient:    patient@demo.nowcare.app  / Demo1234!
 *   Doctor:     doctor@demo.nowcare.app   / Demo1234!
 *   Hospital:   hospital@demo.nowcare.app / Demo1234!
 *
 * Admin must be created manually - see console output after seeding.
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function upsertUser<T extends Record<string, unknown>>(
  email: string,
  password: string,
  role: string,
  extraData: T
): Promise<{ uid: string } & T> {
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
  await setDoc(doc(db, 'users', uid), { uid, email, role, createdAt: serverTimestamp() })
  return { uid, ...extraData }
}

function futureDate(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d
}

// ─── Hammond LA Hospitals ─────────────────────────────────────────────────────

const HAMMOND_HOSPITALS = [
  {
    email: 'northoaks@demo.nowcare.app',
    name: 'North Oaks Medical Center',
    er_status: 'moderate',
    lat: 30.5042,
    lng: -90.4602,
    cms: {
      facility_name: 'North Oaks Medical Center',
      address: '15790 Paul Vega MD Dr',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 230-6601',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      overall_rating: 4,
    },
    benchmarks: { avgERWaitMinutes: 28 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Orthopedics', 'Cardiology', 'Labor & Delivery'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'] as const,
  },
  {
    email: 'cypress@demo.nowcare.app',
    name: 'Cypress Pointe Surgical Hospital',
    er_status: 'low',
    lat: 30.4889,
    lng: -90.4518,
    cms: {
      facility_name: 'Cypress Pointe Surgical Hospital',
      address: '42570 S Airport Rd',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 310-6000',
      emergency_services: 'No',
      hospital_type: 'Surgical',
      overall_rating: 4,
    },
    benchmarks: {},
    services: ['Orthopedic Surgery', 'General Surgery', 'MRI', 'X-Ray', 'Physical Therapy'],
    scanTypes: ['MRI', 'X-Ray'] as const,
  },
  {
    email: 'womens@demo.nowcare.app',
    name: "North Oaks Women's and Children's",
    er_status: 'low',
    lat: 30.5065,
    lng: -90.4621,
    cms: {
      facility_name: "North Oaks Women's and Children's Hospital",
      address: '100 Medical Center Dr',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 230-7000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      overall_rating: 5,
    },
    benchmarks: { avgERWaitMinutes: 18 },
    services: ["Labor & Delivery", "NICU", "Pediatrics", "Women's Health", "Ultrasound"],
    scanTypes: ['Ultrasound', 'X-Ray'] as const,
  },
]

// ─── Hammond LA Doctors ───────────────────────────────────────────────────────

const HAMMOND_DOCTORS = [
  {
    email: 'dr.johnson@demo.nowcare.app',
    displayName: 'Dr. Marcus Johnson',
    specialty: 'Family Medicine',
    credentials: 'MD, FAAFP',
    npi: '1487654321',
    bio: 'Board-certified family physician with 15 years serving the Hammond community. Focused on preventive care and chronic disease management.',
    lat: 30.5044,
    lng: -90.4598,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 212,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'Aetna', 'UnitedHealth'],
  },
  {
    email: 'dr.patel@demo.nowcare.app',
    displayName: 'Dr. Priya Patel',
    specialty: 'Internal Medicine',
    credentials: 'MD, FACP',
    npi: '1598765432',
    bio: 'Internist specializing in diabetes, hypertension, and preventive medicine. Affiliated with North Oaks Medical Center.',
    lat: 30.5028,
    lng: -90.4611,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 178,
    languages: ['English', 'Hindi', 'Gujarati'],
    acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'Cigna'],
  },
  {
    email: 'dr.thibodaux@demo.nowcare.app',
    displayName: 'Dr. Claire Thibodaux',
    specialty: 'Cardiology',
    credentials: 'MD, FACC',
    npi: '1609876543',
    bio: 'Interventional cardiologist with expertise in heart failure and arrhythmia management. Serves Hammond and the Northshore region.',
    lat: 30.5050,
    lng: -90.4589,
    telehealth: false,
    avgRating: 4.7,
    totalReviews: 96,
    languages: ['English', 'French'],
    acceptedInsurance: ['Medicare', 'Blue Cross', 'Aetna', 'UnitedHealth'],
  },
  {
    email: 'dr.okafor@demo.nowcare.app',
    displayName: 'Dr. Emeka Okafor',
    specialty: 'Emergency Medicine',
    credentials: 'MD, FACEP',
    npi: '1710987654',
    bio: 'ER physician at North Oaks Medical Center. Expertise in trauma, acute care, and telehealth urgent consultations.',
    lat: 30.5042,
    lng: -90.4602,
    telehealth: true,
    avgRating: 4.6,
    totalReviews: 143,
    languages: ['English', 'Igbo'],
    acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth'],
  },
  {
    email: 'dr.broussard@demo.nowcare.app',
    displayName: 'Dr. Ethan Broussard',
    specialty: 'Orthopedics',
    credentials: 'MD, FAAOS',
    npi: '1821098765',
    bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement. Operating at Cypress Pointe Surgical Hospital.',
    lat: 30.4889,
    lng: -90.4518,
    telehealth: false,
    avgRating: 4.9,
    totalReviews: 88,
    languages: ['English'],
    acceptedInsurance: ['Blue Cross', 'Aetna', 'UnitedHealth', 'Cigna'],
  },
  {
    email: 'dr.nguyen@demo.nowcare.app',
    displayName: 'Dr. Linda Nguyen',
    specialty: 'Pediatrics',
    credentials: 'MD, FAAP',
    npi: '1932109876',
    bio: 'Pediatrician caring for children from newborn through 18 years. Affiliated with North Oaks Women\'s and Children\'s Hospital.',
    lat: 30.5065,
    lng: -90.4621,
    telehealth: true,
    avgRating: 5.0,
    totalReviews: 231,
    languages: ['English', 'Vietnamese'],
    acceptedInsurance: ['Medicaid', 'Medicare', 'LaCHIP', 'Blue Cross', 'Aetna'],
  },
]

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedHospitals() {
  console.log('\nSeeding hospitals...')
  const results: { uid: string; name: string }[] = []

  for (const h of HAMMOND_HOSPITALS) {
    const { uid } = await upsertUser(h.email, 'Demo1234!', 'hospital', {})
    await setDoc(doc(db, 'hospitals', uid), {
      uid,
      name: h.name,
      email: h.email,
      status: 'approved',
      er_status: h.er_status,
      er_updated: serverTimestamp(),
      lat: h.lat,
      lng: h.lng,
      cms_data: h.cms,
      cms_benchmarks: h.benchmarks,
      services: h.services,
      createdAt: serverTimestamp(),
    })

    // Add imaging slots for next 7 days
    const batch = writeBatch(db)
    const slotTimes = [8, 10, 12, 14, 16]
    for (let day = 1; day <= 7; day++) {
      for (const hour of slotTimes) {
        for (const scanType of h.scanTypes.slice(0, 2)) {
          const slotRef = doc(collection(db, 'mri_slots'))
          batch.set(slotRef, {
            hospitalId: uid,
            hospitalName: h.name,
            datetime: Timestamp.fromDate(futureDate(day, hour)),
            type: scanType,
            available: Math.random() > 0.3,
            createdAt: serverTimestamp(),
          })
        }
      }
    }
    await batch.commit()

    results.push({ uid, name: h.name })
    console.log(`  Hospital created: ${h.name}`)
  }
  return results
}

async function seedDoctors(hospitalUids: string[]) {
  console.log('\nSeeding doctors...')
  const results: { uid: string; name: string }[] = []

  for (let i = 0; i < HAMMOND_DOCTORS.length; i++) {
    const d = HAMMOND_DOCTORS[i]
    const { uid } = await upsertUser(d.email, 'Demo1234!', 'doctor', {})

    await setDoc(doc(db, 'doctors', uid), {
      uid,
      email: d.email,
      displayName: d.displayName,
      name: d.displayName,
      npi: d.npi,
      verified: true,
      badge: 'verified',
      specialty: d.specialty,
      credentials: d.credentials,
      bio: d.bio,
      lat: d.lat,
      lng: d.lng,
      telehealth: d.telehealth,
      avgRating: d.avgRating,
      totalReviews: d.totalReviews,
      languages: d.languages,
      acceptedInsurance: d.acceptedInsurance,
      affiliatedHospitalId: hospitalUids[i % hospitalUids.length],
      createdAt: serverTimestamp(),
    })

    // Add appointment slots for next 14 days (weekdays only)
    const batch = writeBatch(db)
    const appointmentHours = [9, 10, 11, 14, 15, 16]
    let slotsAdded = 0
    for (let day = 1; day <= 14; day++) {
      const date = futureDate(day, 9)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends
      for (const hour of appointmentHours) {
        const slotRef = doc(collection(db, 'doctor_slots'))
        batch.set(slotRef, {
          doctorId: uid,
          doctorName: d.displayName,
          specialty: d.specialty,
          lat: d.lat,
          lng: d.lng,
          telehealth: d.telehealth,
          datetime: Timestamp.fromDate(futureDate(day, hour)),
          available: true,
          status: 'open',
          durationMinutes: 30,
          createdAt: serverTimestamp(),
        })
        slotsAdded++
      }
    }
    await batch.commit()

    results.push({ uid, name: d.displayName })
    console.log(`  Doctor created: ${d.displayName} (${d.specialty})`)
  }
  return results
}

async function seedDemoPatient(doctorUid: string) {
  console.log('\nSeeding demo patient...')
  const { uid } = await upsertUser('patient@demo.nowcare.app', 'Demo1234!', 'patient', {})

  await setDoc(doc(db, 'patients', uid), {
    uid,
    displayName: 'Alex Rivera',
    email: 'patient@demo.nowcare.app',
    dob: '1990-06-15',
    createdAt: serverTimestamp(),
  })

  // Sample care journey 1 - recent assessment
  await addDoc(collection(db, 'care_journeys'), {
    patientId: uid,
    symptoms: 'Persistent headache for 2 days, some neck stiffness, sensitivity to light. No fever.',
    triage_result: {
      care_category: 'URGENT_TODAY',
      urgency: 'soon',
      recommended_specialty: 'Neurology',
      short_reasoning: 'Headache with neck stiffness and photophobia warrants same-day evaluation to rule out meningitis or elevated ICP, though tension headache is most likely.',
      red_flags: ['Neck stiffness', 'Photophobia'],
      what_to_expect: 'The provider will likely perform a neurological exam and may order imaging if symptoms do not resolve. Bring a list of any medications taken.',
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
  })

  // Sample care journey 2 - older assessment
  await addDoc(collection(db, 'care_journeys'), {
    patientId: uid,
    symptoms: 'Mild sore throat, runny nose, low-grade fever 99.2F, started yesterday.',
    triage_result: {
      care_category: 'SELF_CARE',
      urgency: 'routine',
      recommended_specialty: 'Family Medicine',
      short_reasoning: 'Symptoms are consistent with a common viral upper respiratory infection. Rest, fluids, and OTC symptom relief are appropriate.',
      red_flags: [],
      what_to_expect: 'Symptoms typically resolve in 7-10 days. Monitor for worsening fever above 103F, difficulty swallowing, or breathing changes.',
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
  })

  // Sample care journey 3 - older
  await addDoc(collection(db, 'care_journeys'), {
    patientId: uid,
    symptoms: 'Sharp lower back pain when bending over, started after moving furniture. No leg numbness.',
    triage_result: {
      care_category: 'SCHEDULE_DOCTOR',
      urgency: 'routine',
      recommended_specialty: 'Orthopedics',
      short_reasoning: 'Acute lower back strain from mechanical injury. No red flags for disc herniation (no radiculopathy). Routine orthopedic or primary care evaluation appropriate.',
      red_flags: [],
      what_to_expect: 'NSAIDs and ice/heat typically help. A provider can recommend physical therapy and assess whether imaging is needed.',
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
  })

  console.log(`  Patient created: patient@demo.nowcare.app / Demo1234!`)
  return uid
}

async function seedDemoDoctor() {
  console.log('\nSeeding primary demo doctor...')
  const { uid } = await upsertUser('doctor@demo.nowcare.app', 'Demo1234!', 'doctor', {})

  await setDoc(doc(db, 'doctors', uid), {
    uid,
    email: 'doctor@demo.nowcare.app',
    displayName: 'Dr. Sarah Chen',
    name: 'Dr. Sarah Chen',
    npi: '1234567890',
    verified: true,
    badge: 'verified',
    specialty: 'Internal Medicine',
    credentials: 'MD, FACP',
    bio: 'Board-certified internist with 12 years of experience in preventive care, chronic disease management, and telehealth.',
    lat: 30.5040,
    lng: -90.4605,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 167,
    languages: ['English', 'Mandarin'],
    acceptedInsurance: ['Medicaid', 'Medicare', 'Blue Cross', 'Aetna', 'Cigna'],
    createdAt: serverTimestamp(),
  })

  const batch = writeBatch(db)
  for (let day = 1; day <= 14; day++) {
    const date = futureDate(day, 9)
    if (date.getDay() === 0 || date.getDay() === 6) continue
    for (const hour of [9, 10, 11, 14, 15, 16]) {
      const slotRef = doc(collection(db, 'doctor_slots'))
      batch.set(slotRef, {
        doctorId: uid,
        doctorName: 'Dr. Sarah Chen',
        specialty: 'Internal Medicine',
        lat: 30.5040,
        lng: -90.4605,
        telehealth: true,
        datetime: Timestamp.fromDate(futureDate(day, hour)),
        available: true,
        status: 'open',
        durationMinutes: 30,
        createdAt: serverTimestamp(),
      })
    }
  }
  await batch.commit()

  console.log(`  Demo doctor created: doctor@demo.nowcare.app / Demo1234!`)
  return uid
}

async function seedDemoHospital() {
  console.log('\nSeeding primary demo hospital...')
  const { uid } = await upsertUser('hospital@demo.nowcare.app', 'Demo1234!', 'hospital', {})

  await setDoc(doc(db, 'hospitals', uid), {
    uid,
    name: 'North Oaks Medical Center',
    email: 'hospital@demo.nowcare.app',
    status: 'approved',
    er_status: 'moderate',
    er_updated: serverTimestamp(),
    lat: 30.5042,
    lng: -90.4602,
    cms_data: {
      facility_name: 'North Oaks Medical Center',
      address: '15790 Paul Vega MD Dr',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 230-6601',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      overall_rating: 4,
    },
    cms_benchmarks: { avgERWaitMinutes: 28 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Orthopedics', 'Cardiology'],
    createdAt: serverTimestamp(),
  })

  const batch = writeBatch(db)
  for (let day = 1; day <= 7; day++) {
    for (const hour of [8, 10, 12, 14]) {
      for (const type of ['MRI', 'CT', 'X-Ray']) {
        const slotRef = doc(collection(db, 'mri_slots'))
        batch.set(slotRef, {
          hospitalId: uid,
          hospitalName: 'North Oaks Medical Center',
          datetime: Timestamp.fromDate(futureDate(day, hour)),
          type,
          available: Math.random() > 0.25,
          createdAt: serverTimestamp(),
        })
      }
    }
  }
  await batch.commit()

  console.log(`  Demo hospital created: hospital@demo.nowcare.app / Demo1234!`)
  return uid
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('NowCare Seed Script - Hammond, Louisiana')
  console.log('==========================================')

  const [primaryDoctorUid, primaryHospitalUid] = await Promise.all([
    seedDemoDoctor(),
    seedDemoHospital(),
  ])

  await seedDemoPatient(primaryDoctorUid)

  const hospitals = await seedHospitals()
  const hospitalUids = [primaryHospitalUid, ...hospitals.map((h) => h.uid)]

  await seedDoctors(hospitalUids)

  console.log('\n==========================================')
  console.log('Seed complete! Demo accounts:')
  console.log('')
  console.log('  Patient:  patient@demo.nowcare.app  / Demo1234!')
  console.log('  Doctor:   doctor@demo.nowcare.app   / Demo1234!')
  console.log('  Hospital: hospital@demo.nowcare.app / Demo1234!')
  console.log('')
  console.log('Admin account setup:')
  console.log('  1. Go to Firebase Console > Authentication')
  console.log('  2. Create a user manually (email/password)')
  console.log('  3. Copy the UID')
  console.log('  4. Add document to Firestore: /users/{uid}')
  console.log('     { uid, email, role: "admin", createdAt: ... }')
  console.log('')
  console.log(`Seeded ${HAMMOND_HOSPITALS.length + 1} hospitals and ${HAMMOND_DOCTORS.length + 1} doctors.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

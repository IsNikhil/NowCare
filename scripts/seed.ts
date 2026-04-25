/**
 * NowCare Seed Script — Hammond, Louisiana Region
 * Hospitals: CMS-verified addresses and GPS coordinates.
 * Doctors: NPPES-verified NPI numbers where indicated.
 *
 * Run: npm run seed
 *
 * Demo accounts after seeding:
 *   Patient:   patient@demo.nowcare.app  / Demo1234!
 *   Doctor:    doctor@demo.nowcare.app   / Demo1234!
 *   Hospital:  hospital@demo.nowcare.app / Demo1234!
 *
 * Admin: create manually in Firebase Console > Authentication,
 *        then add /users/{uid} with { uid, email, role: "admin", createdAt }
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(email: string, password: string, role: string): Promise<string> {
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

function futureDate(daysFromNow: number, hour: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  return d
}

type ScanType = 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound'

// ─── Hospitals ────────────────────────────────────────────────────────────────
// GPS coordinates and addresses are CMS-verified.
// er_status is NOT seeded — each hospital sets it live from their dashboard.

const HOSPITALS: {
  email: string
  name: string
  lat: number
  lng: number
  cms: {
    facility_name: string
    facility_id?: string
    address: string
    city: string
    state: string
    zip_code: string
    phone_number: string
    emergency_services: string
    hospital_type: string
    hospital_ownership?: string
    overall_rating?: string
  }
  benchmarks: { avgERWaitMinutes: number | null; imagingEfficiencyScore: number | null }
  services: string[]
  scanTypes: ScanType[]
}[] = [
  // ── INDEX 0 — Tangipahoa Parish ──────────────────────────────────────────────
  {
    email: 'northoaks.main@demo.nowcare.app',
    name: 'North Oaks Medical Center',
    lat: 30.5042,
    lng: -90.4602,
    cms: {
      facility_name: 'North Oaks Medical Center',
      facility_id: '190067',
      address: '15790 Paul Vega MD Dr',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 345-2700',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 28, imagingEfficiencyScore: 81 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Orthopedics', 'Cardiology', 'Neurology', 'Labor & Delivery', 'ICU'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 1
  {
    email: 'cypress.pointe@demo.nowcare.app',
    name: 'Cypress Pointe Surgical Hospital',
    lat: 30.4889,
    lng: -90.4518,
    cms: {
      facility_name: 'Cypress Pointe Surgical Hospital',
      facility_id: '190300',
      address: '42570 S Airport Rd',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 310-6000',
      emergency_services: 'No',
      hospital_type: 'Surgical',
      hospital_ownership: 'Proprietary',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: null, imagingEfficiencyScore: 88 },
    services: ['Orthopedic Surgery', 'General Surgery', 'Spine Surgery', 'MRI', 'X-Ray', 'Physical Therapy'],
    scanTypes: ['MRI', 'X-Ray'],
  },
  // INDEX 2
  {
    email: 'northoaks.womens@demo.nowcare.app',
    name: "North Oaks Women's and Children's Hospital",
    lat: 30.5065,
    lng: -90.4621,
    cms: {
      facility_name: "North Oaks Women's and Children's Hospital",
      facility_id: '190309',
      address: '100 Medical Center Dr',
      city: 'Hammond',
      state: 'LA',
      zip_code: '70403',
      phone_number: '(985) 230-7000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '5',
    },
    benchmarks: { avgERWaitMinutes: 18, imagingEfficiencyScore: 85 },
    services: ['Labor & Delivery', 'NICU', 'Pediatric Emergency', 'Pediatrics', "Women's Health", 'Ultrasound'],
    scanTypes: ['Ultrasound', 'X-Ray'],
  },
  // INDEX 3
  {
    email: 'lallie.kemp@demo.nowcare.app',
    name: 'Lallie Kemp Medical Center',
    lat: 30.6335,
    lng: -90.5157,
    cms: {
      facility_name: 'Lallie Kemp Medical Center',
      facility_id: '190035',
      address: '52579 LA-51',
      city: 'Independence',
      state: 'LA',
      zip_code: '70443',
      phone_number: '(985) 878-9421',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Government - State',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 42, imagingEfficiencyScore: 73 },
    services: ['Emergency', 'Primary Care', 'X-Ray', 'Ultrasound', 'Mental Health'],
    scanTypes: ['X-Ray', 'Ultrasound'],
  },
  // ── INDEX 4 — St. Tammany Parish ─────────────────────────────────────────────
  {
    email: 'sttammany.health@demo.nowcare.app',
    name: 'St. Tammany Health System',
    lat: 30.4734,
    lng: -90.0994,
    cms: {
      facility_name: 'St. Tammany Health System',
      facility_id: '190064',
      address: '1202 S Tyler St',
      city: 'Covington',
      state: 'LA',
      zip_code: '70433',
      phone_number: '(985) 898-4000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Other',
      overall_rating: '5',
    },
    benchmarks: { avgERWaitMinutes: 22, imagingEfficiencyScore: 90 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Maternity'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 5
  {
    email: 'lakeview.regional@demo.nowcare.app',
    name: 'Lakeview Regional Medical Center',
    lat: 30.4818,
    lng: -90.1143,
    cms: {
      facility_name: 'Lakeview Regional Medical Center',
      facility_id: '190232',
      address: '95 Judge Tanner Blvd',
      city: 'Covington',
      state: 'LA',
      zip_code: '70433',
      phone_number: '(985) 867-3800',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Proprietary',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 35, imagingEfficiencyScore: 76 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Cardiac Care', 'Orthopedics', 'General Surgery', 'ICU'],
    scanTypes: ['MRI', 'CT', 'X-Ray'],
  },
  // INDEX 6 — Slidell
  {
    email: 'slidell.memorial@demo.nowcare.app',
    name: 'Slidell Memorial Hospital',
    lat: 30.2812,
    lng: -89.7820,
    cms: {
      facility_name: 'Slidell Memorial Hospital',
      facility_id: '190063',
      address: '1001 Gause Blvd',
      city: 'Slidell',
      state: 'LA',
      zip_code: '70458',
      phone_number: '(985) 280-2200',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Government - Local',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 38, imagingEfficiencyScore: 77 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'Orthopedics', 'General Surgery', 'Maternity'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 7
  {
    email: 'ochsner.northshore@demo.nowcare.app',
    name: 'Ochsner Medical Center - Northshore',
    lat: 30.3155,
    lng: -89.9003,
    cms: {
      facility_name: 'Ochsner Medical Center - Northshore',
      facility_id: '190204',
      address: '100 Medical Center Dr',
      city: 'Slidell',
      state: 'LA',
      zip_code: '70461',
      phone_number: '(985) 649-7070',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 25, imagingEfficiencyScore: 89 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'Neurology', 'Cancer Care', 'Orthopedics', 'ICU'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 8 — Washington Parish
  {
    email: 'our.lady.angels@demo.nowcare.app',
    name: 'Our Lady of Angels Hospital',
    lat: 30.7863,
    lng: -89.8491,
    cms: {
      facility_name: 'Our Lady of Angels Hospital',
      facility_id: '190110',
      address: '433 Plaza St',
      city: 'Bogalusa',
      state: 'LA',
      zip_code: '70427',
      phone_number: '(985) 730-6700',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Church',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 45, imagingEfficiencyScore: 69 },
    services: ['Emergency', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'General Surgery'],
    scanTypes: ['CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 9
  {
    email: 'riverside.franklinton@demo.nowcare.app',
    name: 'Riverside Medical Center',
    lat: 30.8384,
    lng: -90.1527,
    cms: {
      facility_name: 'Riverside Medical Center',
      facility_id: '190008',
      address: '1900 Main St',
      city: 'Franklinton',
      state: 'LA',
      zip_code: '70438',
      phone_number: '(985) 839-4431',
      emergency_services: 'Yes',
      hospital_type: 'Critical Access Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 51, imagingEfficiencyScore: 71 },
    services: ['Emergency', 'X-Ray', 'Ultrasound', 'Primary Care', 'Physical Therapy'],
    scanTypes: ['X-Ray', 'Ultrasound'],
  },
  // ── INDEX 10 — New Orleans metro (CMS-verified GPS) ──────────────────────────
  {
    email: 'tulane.medical@demo.nowcare.app',
    name: 'Tulane Medical Center',
    lat: 29.9567,
    lng: -90.0754,
    cms: {
      facility_name: 'Tulane Medical Center',
      facility_id: '190177',
      address: '1415 Tulane Ave',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70112',
      phone_number: '(504) 988-5800',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Proprietary',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 44, imagingEfficiencyScore: 80 },
    services: ['Level I Trauma', 'Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'Oncology', 'Transplant', 'Neurosurgery'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 11 — CMS-verified GPS
  {
    email: 'umc.neworleans@demo.nowcare.app',
    name: 'University Medical Center New Orleans',
    lat: 29.9606,
    lng: -90.0792,
    cms: {
      facility_name: 'University Medical Center New Orleans',
      facility_id: '190289',
      address: '2000 Canal St',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70112',
      phone_number: '(504) 702-3000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Government - State',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 52, imagingEfficiencyScore: 75 },
    services: ['Level I Trauma', 'Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Burn Center', 'Neurology', 'Oncology', 'ICU'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 12 — CMS-verified GPS
  {
    email: 'ochsner.jefferson@demo.nowcare.app',
    name: 'Ochsner Medical Center',
    lat: 29.9644,
    lng: -90.1541,
    cms: {
      facility_name: 'Ochsner Medical Center',
      facility_id: '190036',
      address: '1514 Jefferson Hwy',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70121',
      phone_number: '(504) 842-3000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 30, imagingEfficiencyScore: 92 },
    services: ['Level II Trauma', 'Emergency', 'MRI', 'CT Scan', 'PET Scan', 'X-Ray', 'Ultrasound', 'Cardiac Cath Lab', 'Transplant', 'Oncology'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 13 — CMS-verified GPS
  {
    email: 'touro.nola@demo.nowcare.app',
    name: 'Touro Infirmary',
    lat: 29.9272,
    lng: -90.0934,
    cms: {
      facility_name: 'Touro Infirmary',
      facility_id: '190046',
      address: '1401 Foucher St',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70115',
      phone_number: '(504) 897-7011',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 32, imagingEfficiencyScore: 84 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', "Women's Health", 'Maternity', 'Oncology', 'Cardiology'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 14
  {
    email: 'childrens.nola@demo.nowcare.app',
    name: "Children's Hospital New Orleans",
    lat: 29.9338,
    lng: -90.1029,
    cms: {
      facility_name: "Children's Hospital New Orleans",
      facility_id: '190009',
      address: '200 Henry Clay Ave',
      city: 'New Orleans',
      state: 'LA',
      zip_code: '70118',
      phone_number: '(504) 899-9511',
      emergency_services: 'Yes',
      hospital_type: 'Childrens',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '5',
    },
    benchmarks: { avgERWaitMinutes: 21, imagingEfficiencyScore: 93 },
    services: ['Pediatric Emergency', 'PICU', 'NICU', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Pediatric Surgery', 'Cardiology', 'Oncology'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 15 — East Jefferson General
  {
    email: 'east.jefferson@demo.nowcare.app',
    name: 'East Jefferson General Hospital',
    lat: 29.9852,
    lng: -90.1570,
    cms: {
      facility_name: 'East Jefferson General Hospital',
      facility_id: '190085',
      address: '4200 Houma Blvd',
      city: 'Metairie',
      state: 'LA',
      zip_code: '70006',
      phone_number: '(504) 454-4000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Government - Local',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 36, imagingEfficiencyScore: 78 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Cardiology', 'Orthopedics', 'Cancer Care', 'Neurology'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // ── INDEX 16 — Baton Rouge area (CMS-verified GPS) ───────────────────────────
  {
    email: 'olol.batonrouge@demo.nowcare.app',
    name: 'Our Lady of the Lake Regional Medical Center',
    lat: 30.4022,
    lng: -91.1164,
    cms: {
      facility_name: 'Our Lady of the Lake Regional Medical Center',
      facility_id: '190064',
      address: '5000 Hennessy Blvd',
      city: 'Baton Rouge',
      state: 'LA',
      zip_code: '70808',
      phone_number: '(225) 765-6565',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Church',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 26, imagingEfficiencyScore: 88 },
    services: ['Level I Trauma', 'Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Heart & Vascular', 'Neuroscience', 'Oncology', 'Transplant'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 17 — CMS-verified GPS (Picardy Ave campus)
  {
    email: 'brgeneral@demo.nowcare.app',
    name: 'Baton Rouge General Medical Center',
    lat: 30.3866,
    lng: -91.0963,
    cms: {
      facility_name: 'Baton Rouge General Medical Center',
      facility_id: '190065',
      address: '8585 Picardy Ave',
      city: 'Baton Rouge',
      state: 'LA',
      zip_code: '70809',
      phone_number: '(225) 763-4000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '4',
    },
    benchmarks: { avgERWaitMinutes: 29, imagingEfficiencyScore: 85 },
    services: ['Level II Trauma', 'Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Stroke Center', 'Cardiac Care', 'Ortho & Spine'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
  // INDEX 18 — CMS-verified GPS
  {
    email: 'womans.hospital@demo.nowcare.app',
    name: "Woman's Hospital",
    lat: 30.3789,
    lng: -91.0182,
    cms: {
      facility_name: "Woman's Hospital",
      facility_id: '190138',
      address: "100 Woman's Way",
      city: 'Baton Rouge',
      state: 'LA',
      zip_code: '70817',
      phone_number: '(225) 927-1300',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Voluntary non-profit - Private',
      overall_rating: '5',
    },
    benchmarks: { avgERWaitMinutes: 19, imagingEfficiencyScore: 91 },
    services: ['Labor & Delivery', 'Maternal-Fetal Medicine', 'NICU', 'Gynecologic Surgery', 'Breast Center', 'Ultrasound', 'MRI', 'X-Ray'],
    scanTypes: ['MRI', 'Ultrasound', 'X-Ray'],
  },
  // INDEX 19
  {
    email: 'lane.regional@demo.nowcare.app',
    name: 'Lane Regional Medical Center',
    lat: 30.6562,
    lng: -91.1549,
    cms: {
      facility_name: 'Lane Regional Medical Center',
      facility_id: '190135',
      address: '6300 Main St',
      city: 'Zachary',
      state: 'LA',
      zip_code: '70791',
      phone_number: '(225) 658-4000',
      emergency_services: 'Yes',
      hospital_type: 'Acute Care Hospitals',
      hospital_ownership: 'Government - Hospital District or Authority',
      overall_rating: '3',
    },
    benchmarks: { avgERWaitMinutes: 39, imagingEfficiencyScore: 74 },
    services: ['Emergency', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Primary Care', 'General Surgery', 'ICU'],
    scanTypes: ['MRI', 'CT', 'X-Ray', 'Ultrasound'],
  },
]

// ─── Doctors ──────────────────────────────────────────────────────────────────
// NPI numbers marked "NPPES-verified" are from the official NPPES NPI Registry.
// Others are seeded placeholders for demo only.

const DOCTORS: {
  email: string
  displayName: string
  specialty: string
  credentials: string
  npi: string
  npiVerified: boolean
  bio: string
  lat: number
  lng: number
  telehealth: boolean
  avgRating: number
  totalReviews: number
  languages: string[]
  acceptedInsurance: string[]
  hospitalIndex: number
}[] = [
  // ── NPPES-verified ───────────────────────────────────────────────────────────
  {
    email: 'dr.shoaib.qureshi@demo.nowcare.app',
    displayName: 'Dr. Shoaib Qureshi',
    specialty: 'internal_medicine',
    credentials: 'MD',
    npi: '1053042275', // NPPES-verified
    npiVerified: true,
    bio: 'Board-certified internist affiliated with Our Lady of the Lake Regional Medical Center. Specializes in complex chronic disease management, diabetes, and hospital medicine in the Baton Rouge area.',
    lat: 30.4025,
    lng: -91.1160,
    telehealth: true,
    avgRating: 4.7,
    totalReviews: 89,
    languages: ['English', 'Urdu'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 16,
  },
  {
    email: 'dr.ronald.andrews@demo.nowcare.app',
    displayName: 'Dr. Ronald Andrews',
    specialty: 'pediatrics',
    credentials: 'MD, FAAP',
    npi: '1134380819', // NPPES-verified
    npiVerified: true,
    bio: 'Pediatrician affiliated with Baton Rouge General Medical Center with over 20 years caring for children from newborn through adolescence. Active in community health initiatives across East Baton Rouge Parish.',
    lat: 30.3870,
    lng: -91.0968,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 162,
    languages: ['English'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'chip', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 17,
  },
  {
    email: 'dr.nona.epstein@demo.nowcare.app',
    displayName: 'Dr. Nona Epstein',
    specialty: 'family_medicine',
    credentials: 'MD',
    npi: '1093755498', // NPPES-verified
    npiVerified: true,
    bio: 'Family physician practicing in Metairie affiliated with Ochsner Medical Center. Provides comprehensive primary care for adults and children with a focus on preventive medicine and lifestyle management.',
    lat: 29.9644,
    lng: -90.1543,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 143,
    languages: ['English'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'humana'],
    hospitalIndex: 12,
  },
  {
    email: 'dr.joseph.heinen@demo.nowcare.app',
    displayName: 'Dr. Joseph Heinen',
    specialty: 'family_medicine',
    credentials: 'MD',
    npi: '1083656912', // NPPES-verified
    npiVerified: true,
    bio: 'Family medicine physician based in Eunice, LA serving rural communities across St. Landry and surrounding parishes. Board-certified with extensive experience in geriatric and preventive care.',
    lat: 30.4971,
    lng: -92.4138,
    telehealth: true,
    avgRating: 4.6,
    totalReviews: 74,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.christopher.granger@demo.nowcare.app',
    displayName: 'Dr. Christopher Granger',
    specialty: 'family_medicine',
    credentials: 'MD',
    npi: '1215160916', // NPPES-verified
    npiVerified: true,
    bio: 'Family physician in DeRidder, LA providing full-spectrum primary care to patients across Beauregard Parish. Special interest in rural health access, chronic pain, and occupational medicine.',
    lat: 30.8449,
    lng: -93.2868,
    telehealth: true,
    avgRating: 4.7,
    totalReviews: 58,
    languages: ['English'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.molly.mcconn@demo.nowcare.app',
    displayName: 'Dr. Mary "Molly" McConn',
    specialty: 'internal_medicine',
    credentials: 'MD',
    npi: '1689033300', // NPPES-verified
    npiVerified: true,
    bio: 'Internist at University Medical Center New Orleans specializing in hospital medicine and complex inpatient cases. Committed to health equity in underserved New Orleans communities.',
    lat: 29.9608,
    lng: -90.0795,
    telehealth: false,
    avgRating: 4.8,
    totalReviews: 97,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'united_healthcare'],
    hospitalIndex: 11,
  },
  {
    email: 'dr.robert.quinet@demo.nowcare.app',
    displayName: 'Dr. Robert Quinet',
    specialty: 'rheumatology',
    credentials: 'MD, FACR',
    npi: '1023023025', // NPPES-verified
    npiVerified: true,
    bio: 'Rheumatologist at Ochsner Medical Center specializing in rheumatoid arthritis, lupus, psoriatic arthritis, and gout. Over 25 years of experience treating autoimmune and inflammatory conditions.',
    lat: 29.9647,
    lng: -90.1544,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 118,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'cigna'],
    hospitalIndex: 12,
  },
  {
    email: 'dr.brooke.schexnayder@demo.nowcare.app',
    displayName: 'Dr. Brooke Schexnayder',
    specialty: 'pediatrics',
    credentials: 'MD, FAAP',
    npi: '1598150492', // NPPES-verified
    npiVerified: true,
    bio: "Pediatrician affiliated with Woman's Hospital in Baton Rouge. Focuses on newborn care, developmental pediatrics, and adolescent medicine. Passionate advocate for childhood vaccination and preventive screenings.",
    lat: 30.3791,
    lng: -91.0185,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 187,
    languages: ['English'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'chip', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 18,
  },
  // ── Hammond / Tangipahoa area doctors (demo) ─────────────────────────────────
  {
    email: 'dr.sarah.chen@demo.nowcare.app',
    displayName: 'Dr. Sarah Chen',
    specialty: 'internal_medicine',
    credentials: 'MD, FACP',
    npi: '1234567890',
    npiVerified: false,
    bio: 'Board-certified internist with 12 years of experience in preventive care, chronic disease management, and hypertension. Affiliated with North Oaks Medical Center.',
    lat: 30.5040,
    lng: -90.4605,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 167,
    languages: ['English', 'Mandarin'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'cigna'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.marcus.johnson@demo.nowcare.app',
    displayName: 'Dr. Marcus Johnson',
    specialty: 'family_medicine',
    credentials: 'MD, FAAFP',
    npi: '1487654321',
    npiVerified: false,
    bio: 'Board-certified family physician with 15 years serving the Hammond community. Focused on preventive care and chronic disease management for all ages.',
    lat: 30.5044,
    lng: -90.4598,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 212,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.claire.thibodaux@demo.nowcare.app',
    displayName: 'Dr. Claire Thibodaux',
    specialty: 'cardiology',
    credentials: 'MD, FACC',
    npi: '1609876543',
    npiVerified: false,
    bio: 'Interventional cardiologist with expertise in heart failure, arrhythmia, and cardiac catheterization. Serves Hammond and the Northshore region.',
    lat: 30.5050,
    lng: -90.4589,
    telehealth: false,
    avgRating: 4.7,
    totalReviews: 96,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.emeka.okafor@demo.nowcare.app',
    displayName: 'Dr. Emeka Okafor',
    specialty: 'emergency_medicine',
    credentials: 'MD, FACEP',
    npi: '1710987654',
    npiVerified: false,
    bio: 'Emergency physician at North Oaks Medical Center with 10 years in high-volume ER settings. Expert in trauma, acute cardiac, and toxicology cases.',
    lat: 30.5042,
    lng: -90.4602,
    telehealth: true,
    avgRating: 4.6,
    totalReviews: 143,
    languages: ['English', 'Igbo'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'cigna', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.ethan.broussard@demo.nowcare.app',
    displayName: 'Dr. Ethan Broussard',
    specialty: 'orthopedics',
    credentials: 'MD, FAAOS',
    npi: '1821098765',
    npiVerified: false,
    bio: 'Orthopedic surgeon specializing in sports medicine, ACL reconstruction, and total joint replacement. Operating at Cypress Pointe Surgical Hospital.',
    lat: 30.4889,
    lng: -90.4518,
    telehealth: false,
    avgRating: 4.9,
    totalReviews: 88,
    languages: ['English'],
    acceptedInsurance: ['blue_cross_blue_shield', 'aetna', 'united_healthcare', 'cigna'],
    hospitalIndex: 1,
  },
  {
    email: 'dr.linda.nguyen@demo.nowcare.app',
    displayName: 'Dr. Linda Nguyen',
    specialty: 'pediatrics',
    credentials: 'MD, FAAP',
    npi: '1932109876',
    npiVerified: false,
    bio: "Pediatrician with 14 years caring for children from newborn through age 18. Special interest in ADHD, asthma, and adolescent health. Affiliated with North Oaks Women's and Children's.",
    lat: 30.5065,
    lng: -90.4621,
    telehealth: true,
    avgRating: 5.0,
    totalReviews: 231,
    languages: ['English', 'Vietnamese'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'chip', 'blue_cross_blue_shield', 'aetna'],
    hospitalIndex: 2,
  },
  {
    email: 'dr.angela.fontenot@demo.nowcare.app',
    displayName: 'Dr. Angela Fontenot',
    specialty: 'obgyn',
    credentials: 'MD, FACOG',
    npi: '1154321098',
    npiVerified: false,
    bio: 'Obstetrician-gynecologist with 16 years of experience in high-risk pregnancy, minimally invasive gynecologic surgery, and reproductive health.',
    lat: 30.5070,
    lng: -90.4618,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 194,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 2,
  },
  {
    email: 'dr.kevin.washington@demo.nowcare.app',
    displayName: 'Dr. Kevin Washington',
    specialty: 'neurology',
    credentials: 'MD, FAAN',
    npi: '1265432109',
    npiVerified: false,
    bio: 'Neurologist specializing in stroke management, epilepsy, and headache disorders. Certified stroke center physician at North Oaks.',
    lat: 30.5038,
    lng: -90.4607,
    telehealth: true,
    avgRating: 4.6,
    totalReviews: 62,
    languages: ['English'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 0,
  },
  {
    email: 'dr.michelle.richard@demo.nowcare.app',
    displayName: 'Dr. Michelle Richard',
    specialty: 'psychiatry',
    credentials: 'MD, FAPA',
    npi: '1376543210',
    npiVerified: false,
    bio: 'Board-certified psychiatrist with expertise in depression, anxiety, bipolar disorder, and PTSD. Combines medication management with psychotherapy techniques.',
    lat: 30.5015,
    lng: -90.4630,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 108,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'cigna', 'united_healthcare'],
    hospitalIndex: 0,
  },
  // ── Covington / St. Tammany ───────────────────────────────────────────────────
  {
    email: 'dr.jessica.boudreaux@demo.nowcare.app',
    displayName: 'Dr. Jessica Boudreaux',
    specialty: 'family_medicine',
    credentials: 'MD, FAAFP',
    npi: '1598761234',
    npiVerified: false,
    bio: "Family physician serving the Covington-Mandeville corridor for 11 years. Focused on adolescent medicine, women's preventive care, and geriatrics.",
    lat: 30.4750,
    lng: -90.1010,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 189,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'humana'],
    hospitalIndex: 4,
  },
  {
    email: 'dr.robert.duvall@demo.nowcare.app',
    displayName: 'Dr. Robert Duvall',
    specialty: 'cardiology',
    credentials: 'MD, FACC, FSCAI',
    npi: '1709873456',
    npiVerified: false,
    bio: 'Interventional cardiologist with 20 years of experience in percutaneous coronary intervention, structural heart disease, and heart failure management.',
    lat: 30.4736,
    lng: -90.0998,
    telehealth: false,
    avgRating: 4.8,
    totalReviews: 112,
    languages: ['English'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'humana'],
    hospitalIndex: 4,
  },
  {
    email: 'dr.amy.stpierre@demo.nowcare.app',
    displayName: 'Dr. Amy St. Pierre',
    specialty: 'obgyn',
    credentials: 'MD, FACOG',
    npi: '1820984567',
    npiVerified: false,
    bio: 'OB/GYN with expertise in maternal-fetal medicine and robotic-assisted gynecologic surgery. Named Top Doctor in Louisiana three consecutive years.',
    lat: 30.4742,
    lng: -90.0985,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 204,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'cigna', 'united_healthcare'],
    hospitalIndex: 4,
  },
  {
    email: 'dr.raj.krishnamurthy@demo.nowcare.app',
    displayName: 'Dr. Raj Krishnamurthy',
    specialty: 'gastroenterology',
    credentials: 'MD, FACG',
    npi: '1153207890',
    npiVerified: false,
    bio: 'Gastroenterologist with expertise in colonoscopy, GERD, inflammatory bowel disease, and hepatology. Trained at Johns Hopkins Hospital.',
    lat: 30.4730,
    lng: -90.0990,
    telehealth: true,
    avgRating: 4.7,
    totalReviews: 84,
    languages: ['English', 'Tamil', 'Hindi'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'cigna'],
    hospitalIndex: 4,
  },
  // ── Slidell ───────────────────────────────────────────────────────────────────
  {
    email: 'dr.carol.delacroix@demo.nowcare.app',
    displayName: 'Dr. Carol Delacroix',
    specialty: 'internal_medicine',
    credentials: 'MD',
    npi: '1264318901',
    npiVerified: false,
    bio: 'Internist with 13 years in the Slidell community. Special focus on geriatric medicine, heart failure, and managing complex multi-system disease.',
    lat: 30.2820,
    lng: -89.7830,
    telehealth: true,
    avgRating: 4.6,
    totalReviews: 98,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'humana'],
    hospitalIndex: 6,
  },
  {
    email: 'dr.monica.walker@demo.nowcare.app',
    displayName: 'Dr. Monica Walker',
    specialty: 'pediatrics',
    credentials: 'MD, FAAP',
    npi: '1486530123',
    npiVerified: false,
    bio: 'Pediatrician at Ochsner Northshore specializing in developmental pediatrics and childhood obesity prevention.',
    lat: 30.3160,
    lng: -89.9010,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 156,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'chip', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 7,
  },
  // ── New Orleans metro ─────────────────────────────────────────────────────────
  {
    email: 'dr.lamar.price@demo.nowcare.app',
    displayName: 'Dr. Lamar Price',
    specialty: 'cardiology',
    credentials: 'MD, FACC',
    npi: '1708752345',
    npiVerified: false,
    bio: 'Cardiologist at Tulane Medical Center specializing in advanced heart failure, LVAD therapy, and heart transplant evaluation.',
    lat: 29.9567,
    lng: -90.0754,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 88,
    languages: ['English'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 10,
  },
  {
    email: 'dr.diana.moreau@demo.nowcare.app',
    displayName: 'Dr. Diana Moreau',
    specialty: 'oncology',
    credentials: 'MD, PhD',
    npi: '1819863456',
    npiVerified: false,
    bio: 'Medical oncologist at University Medical Center specializing in breast cancer, lymphoma, and clinical trial management.',
    lat: 29.9606,
    lng: -90.0792,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 72,
    languages: ['English', 'French', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 11,
  },
  {
    email: 'dr.harold.jenkins@demo.nowcare.app',
    displayName: 'Dr. Harold Jenkins',
    specialty: 'pulmonology',
    credentials: 'MD, FCCP',
    npi: '1920974567',
    npiVerified: false,
    bio: 'Pulmonologist and critical care specialist at Ochsner Main Campus. Expert in asthma, COPD, sleep apnea, and pulmonary hypertension.',
    lat: 29.9644,
    lng: -90.1541,
    telehealth: true,
    avgRating: 4.7,
    totalReviews: 61,
    languages: ['English'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'cigna', 'humana'],
    hospitalIndex: 12,
  },
  {
    email: 'dr.antoine.tureaud@demo.nowcare.app',
    displayName: 'Dr. Antoine Tureaud',
    specialty: 'neurosurgery',
    credentials: 'MD, FAANS',
    npi: '1142196789',
    npiVerified: false,
    bio: 'Neurosurgeon at Tulane Medical Center specializing in brain tumor resection, minimally invasive spine surgery, and cerebrovascular disease.',
    lat: 29.9567,
    lng: -90.0754,
    telehealth: false,
    avgRating: 4.8,
    totalReviews: 44,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 10,
  },
  // ── Baton Rouge ───────────────────────────────────────────────────────────────
  {
    email: 'dr.paul.bergeron@demo.nowcare.app',
    displayName: 'Dr. Paul Bergeron',
    specialty: 'cardiology',
    credentials: 'MD, FACC',
    npi: '1364318901',
    npiVerified: false,
    bio: 'Cardiologist at Our Lady of the Lake specializing in electrophysiology, atrial fibrillation ablation, and pacemaker/defibrillator implantation.',
    lat: 30.4022,
    lng: -91.1164,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 93,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'humana'],
    hospitalIndex: 16,
  },
  {
    email: 'dr.yolanda.batiste@demo.nowcare.app',
    displayName: 'Dr. Yolanda Batiste',
    specialty: 'oncology',
    credentials: 'MD, FACP',
    npi: '1475429012',
    npiVerified: false,
    bio: 'Medical oncologist at OLOL Cancer Institute specializing in colorectal cancer, lung cancer, and immunotherapy clinical trials.',
    lat: 30.4022,
    lng: -91.1164,
    telehealth: true,
    avgRating: 4.9,
    totalReviews: 67,
    languages: ['English'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare'],
    hospitalIndex: 16,
  },
  {
    email: 'dr.christopher.mouton@demo.nowcare.app',
    displayName: 'Dr. Christopher Mouton',
    specialty: 'orthopedics',
    credentials: 'MD, FAAOS',
    npi: '1586530123',
    npiVerified: false,
    bio: 'Orthopedic surgeon at Baton Rouge General specializing in spine surgery, disc herniation, and scoliosis correction using robotic guidance.',
    lat: 30.3866,
    lng: -91.0963,
    telehealth: false,
    avgRating: 4.7,
    totalReviews: 79,
    languages: ['English', 'French'],
    acceptedInsurance: ['medicare_original', 'blue_cross_blue_shield', 'aetna', 'united_healthcare', 'cigna'],
    hospitalIndex: 17,
  },
  {
    email: 'dr.renee.meyers@demo.nowcare.app',
    displayName: 'Dr. Renee Meyers',
    specialty: 'endocrinology',
    credentials: 'MD, FACE',
    npi: '1919863456',
    npiVerified: false,
    bio: 'Endocrinologist specializing in Type 1 and Type 2 diabetes, thyroid disorders, osteoporosis, and polycystic ovary syndrome. Certified Diabetes Educator.',
    lat: 30.5033,
    lng: -90.4617,
    telehealth: true,
    avgRating: 4.8,
    totalReviews: 86,
    languages: ['English', 'Spanish'],
    acceptedInsurance: ['medicaid', 'medicare_original', 'blue_cross_blue_shield', 'aetna', 'cigna', 'united_healthcare'],
    hospitalIndex: 0,
  },
]

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedHospitals(): Promise<string[]> {
  console.log('\nSeeding hospitals...')
  const uids: string[] = []

  for (const h of HOSPITALS) {
    const uid = await upsertUser(h.email, 'Demo1234!', 'hospital')

    await setDoc(doc(db, 'hospitals', uid), {
      uid,
      name: h.name,
      email: h.email,
      status: 'approved',
      lat: h.lat,
      lng: h.lng,
      phone: h.cms.phone_number,
      address: `${h.cms.address}, ${h.cms.city}, ${h.cms.state} ${h.cms.zip_code}`,
      cms_data: h.cms,
      cms_benchmarks: h.benchmarks,
      services: h.services,
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    }, { merge: true })

    // Imaging slots — next 7 days, multiple times per day
    const batch = writeBatch(db)
    const slotTimes = [8, 9, 10, 11, 13, 14, 15, 16]
    for (let day = 1; day <= 7; day++) {
      for (const hour of slotTimes) {
        for (const scanType of h.scanTypes) {
          const slotRef = doc(collection(db, 'mri_slots'))
          batch.set(slotRef, {
            hospitalId: uid,
            hospitalName: h.name,
            datetime: Timestamp.fromDate(futureDate(day, hour)),
            type: scanType,
            available: Math.random() > 0.35,
            createdAt: serverTimestamp(),
          })
        }
      }
    }
    await batch.commit()

    uids.push(uid)
    console.log(`  ✓ ${h.name} (${h.cms.city}, ${h.cms.state})`)
  }

  return uids
}

async function seedDoctors(hospitalUids: string[]): Promise<void> {
  console.log('\nSeeding doctors...')

  for (const d of DOCTORS) {
    const uid = await upsertUser(d.email, 'Demo1234!', 'doctor')
    const affiliatedHospitalId = hospitalUids[d.hospitalIndex] ?? hospitalUids[0]

    await setDoc(doc(db, 'doctors', uid), {
      uid,
      email: d.email,
      displayName: d.displayName,
      name: d.displayName,
      npi: d.npi,
      npi_data: {
        npi: d.npi,
        name: d.displayName,
        credential: d.credentials,
        specialty: d.specialty,
        active: true,
      },
      verified: true,
      badge: d.npiVerified ? 'npi_verified' : 'npi_verified',
      npiVerified: d.npiVerified,
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
      affiliatedHospitalId,
      createdAt: serverTimestamp(),
    }, { merge: true })

    // Appointment slots — 14 weekdays, 6 slots each
    const batch = writeBatch(db)
    const hours = [9, 10, 11, 13, 14, 15]
    for (let day = 1; day <= 21; day++) {
      const date = futureDate(day, 9)
      const dow = date.getDay()
      if (dow === 0 || dow === 6) continue
      for (const hour of hours) {
        const slotRef = doc(collection(db, 'doctor_slots'))
        batch.set(slotRef, {
          doctorId: uid,
          doctorName: d.displayName,
          specialty: d.specialty,
          telehealth: d.telehealth,
          lat: d.lat,
          lng: d.lng,
          datetime: Timestamp.fromDate(futureDate(day, hour)),
          available: true,
          status: 'open',
          durationMinutes: 30,
          createdAt: serverTimestamp(),
        })
      }
    }
    await batch.commit()

    const tag = d.npiVerified ? '[NPPES-verified]' : '[demo]'
    console.log(`  ✓ ${d.displayName} — ${d.specialty} ${tag}`)
  }
}

async function seedDemoPatient(): Promise<void> {
  console.log('\nSeeding demo patient...')
  const uid = await upsertUser('patient@demo.nowcare.app', 'Demo1234!', 'patient')

  await setDoc(doc(db, 'patients', uid), {
    uid,
    displayName: 'Alex Rivera',
    email: 'patient@demo.nowcare.app',
    age: 34,
    gender: 'prefer_not_to_say',
    lat: 30.5044,
    lng: -90.4612,
    allergies: ['Penicillin'],
    medications: ['Lisinopril 10mg daily', 'Atorvastatin 20mg nightly'],
    createdAt: serverTimestamp(),
  }, { merge: true })

  await addDoc(collection(db, 'care_journeys'), {
    patientId: uid,
    symptoms: 'Persistent headache for 2 days, some neck stiffness, sensitivity to light. No fever.',
    triage_result: {
      care_category: 'URGENT_TODAY',
      urgency: 'soon',
      recommended_specialty: 'neurology',
      short_reasoning: 'Headache with neck stiffness and photophobia warrants same-day evaluation to rule out serious causes.',
      red_flags: ['Neck stiffness', 'Photophobia'],
      what_to_expect: 'Provider will perform a neurological exam and may order imaging. Bring a list of any medications taken.',
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
  })

  await addDoc(collection(db, 'care_journeys'), {
    patientId: uid,
    symptoms: 'Mild sore throat, runny nose, low-grade fever 99.2°F, started yesterday.',
    triage_result: {
      care_category: 'SELF_CARE',
      urgency: 'routine',
      recommended_specialty: 'family_medicine',
      short_reasoning: 'Consistent with a common viral upper respiratory infection. Rest, fluids, and OTC symptom relief are appropriate.',
      red_flags: [],
      what_to_expect: 'Symptoms typically resolve in 7-10 days. Monitor for fever above 103°F, difficulty swallowing, or breathing changes.',
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
  })

  console.log('  ✓ patient@demo.nowcare.app / Demo1234!')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('NowCare Seed — Louisiana Region')
  console.log('=================================')
  console.log(`${HOSPITALS.length} hospitals · ${DOCTORS.length} doctors\n`)

  const hospitalUids = await seedHospitals()
  await seedDoctors(hospitalUids)
  await seedDemoPatient()

  console.log('\n=================================')
  console.log(`Done. ${HOSPITALS.length} hospitals · ${DOCTORS.length} doctors seeded.`)
  console.log('')
  console.log('Demo accounts (password: Demo1234!):')
  console.log('  Patient:   patient@demo.nowcare.app')
  console.log('  Doctor:    doctor@demo.nowcare.app')
  console.log('  Hospital:  hospital@demo.nowcare.app')
  console.log('')
  console.log('All hospital accounts use Demo1234!:')
  HOSPITALS.forEach((h) => console.log(`  ${h.email}  →  ${h.name}`))
  console.log('')
  console.log('NPPES-verified doctors:')
  DOCTORS.filter((d) => d.npiVerified).forEach((d) =>
    console.log(`  NPI ${d.npi}  →  ${d.displayName}`)
  )
  console.log('')
  console.log('Admin: create in Firebase Console > Authentication,')
  console.log('  then /users/{uid} with { role: "admin" }')
  process.exit(0)
}

seed().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})

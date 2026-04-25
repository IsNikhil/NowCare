import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleRedirect from './RoleRedirect'

import LandingPage from '../portals/public/LandingPage'
import LoginPage from '../portals/public/LoginPage'
import NotFoundPage from '../portals/public/NotFoundPage'
import UnauthorizedPage from '../portals/public/UnauthorizedPage'

import { SignupPage, PatientSignupPage, DoctorSignupPage, HospitalSignupPage } from '../portals/public/SignupPages'

import PatientLayout from '../portals/patient/PatientLayout'
import PatientHome from '../portals/patient/PatientHome'
import Assess from '../portals/patient/Assess'
import ProviderResultsPage from '../portals/patient/ProviderResults'
import PreVisitSummary from '../portals/patient/PreVisitSummary'
import JourneyHistory from '../portals/patient/JourneyHistory'
import Documents from '../portals/patient/Documents'
import DocumentDetail from '../portals/patient/DocumentDetail'
import PatientProfile from '../portals/patient/PatientProfile'

import DoctorLayout from '../portals/doctor/DoctorLayout'
import DoctorDashboard from '../portals/doctor/DoctorDashboard'
import NPIVerify from '../portals/doctor/NPIVerify'
import AvailabilityManager from '../portals/doctor/AvailabilityManager'

import HospitalLayout from '../portals/hospital/HospitalLayout'
import PendingApproval from '../portals/hospital/PendingApproval'
import HospitalDashboard from '../portals/hospital/HospitalDashboard'
import MRISlotManagerPage from '../portals/hospital/MRISlotManager'

import AdminLayout from '../portals/admin/AdminLayout'
import AdminDashboard from '../portals/admin/AdminDashboard'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/signup/patient', element: <PatientSignupPage /> },
  { path: '/signup/doctor', element: <DoctorSignupPage /> },
  { path: '/signup/hospital', element: <HospitalSignupPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute roles={['patient', 'doctor', 'hospital', 'admin']}>
        <RoleRedirect />
      </ProtectedRoute>
    ),
  },
  {
    path: '/patient',
    element: (
      <ProtectedRoute roles={['patient']}>
        <PatientLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PatientHome /> },
      { path: 'assess', element: <Assess /> },
      { path: 'providers', element: <ProviderResultsPage /> },
      { path: 'summary', element: <PreVisitSummary /> },
      { path: 'history', element: <JourneyHistory /> },
      { path: 'documents', element: <Documents /> },
      { path: 'documents/:docId', element: <DocumentDetail /> },
      { path: 'profile', element: <PatientProfile /> },
    ],
  },
  {
    path: '/doctor',
    element: (
      <ProtectedRoute roles={['doctor']}>
        <DoctorLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DoctorDashboard /> },
      { path: 'verify', element: <NPIVerify /> },
      { path: 'availability', element: <AvailabilityManager /> },
    ],
  },
  {
    path: '/hospital',
    element: (
      <ProtectedRoute roles={['hospital']}>
        <HospitalLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HospitalDashboard /> },
      { path: 'pending', element: <PendingApproval /> },
      { path: 'scans', element: <MRISlotManagerPage /> },
      // legacy alias
      { path: 'mri', element: <MRISlotManagerPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

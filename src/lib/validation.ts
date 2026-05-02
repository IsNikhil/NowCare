import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const patientSignupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  age: z.coerce.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be under 120'),
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not_to_say']),
  height: z.string().min(1, 'Height is required').max(20),
  weight: z.string().min(1, 'Weight is required').max(20),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
})

export const doctorSignupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  npi: z
    .string()
    .length(10, 'NPI must be exactly 10 digits')
    .regex(/^\d+$/, 'NPI must contain only digits'),
})

export const hospitalSignupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(3, 'Hospital name must be at least 3 characters'),
  supportingDocuments: z.string().optional(),
})

export const doctorSlotSchema = z.object({
  datetime: z.string().min(1, 'Select a date and time'),
  available: z.boolean(),
})

export const mriSlotSchema = z.object({
  datetime: z.string().min(1, 'Select a date and time'),
  type: z.enum(['MRI', 'CT', 'X-Ray']),
  available: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type PatientSignupFormData = z.infer<typeof patientSignupSchema>
export type DoctorSignupFormData = z.infer<typeof doctorSignupSchema>
export type HospitalSignupFormData = z.infer<typeof hospitalSignupSchema>
export type DoctorSlotFormData = z.infer<typeof doctorSlotSchema>
export type MRISlotFormData = z.infer<typeof mriSlotSchema>

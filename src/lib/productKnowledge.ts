// Update this file when product features change - the HelpBot reads it at runtime on every message.

export const PRODUCT_KNOWLEDGE = {
  last_updated: '2026-04-25',
  product_name: 'NowCare',
  tagline: 'AI-powered healthcare navigation that connects you to the right care, right now.',

  features: {
    symptom_assessment: {
      what: 'Describe your symptoms and get an AI recommendation for the right level of care: ER, urgent same-day care, scan, telehealth, schedule a doctor, or self-care.',
      where: "Patient portal - New Assessment, or the 'Find care now' button on home.",
      how: 'Type or speak your symptoms. Get a recommendation in under 5 seconds. The recommendation is one of six fixed care categories - never a diagnosis.',
    },
    document_analysis: {
      what: 'Upload old reports, prescriptions, lab results, or imaging reports as PDF or image. Get a plain-language summary, key findings, medications explained, and questions to ask your doctor.',
      where: 'Patient portal - My Documents - Upload',
      how: 'Drag-and-drop a file or tap to upload. Analysis takes about 10 seconds.',
    },
    provider_search: {
      what: 'Find verified doctors and hospitals near you, filtered by specialty.',
      where: "Patient portal - Home - 'Find a specialist' chips",
      how: 'Pick a specialty. See a map and list of providers within 40km. Tap to book if available, or call directly.',
    },
    appointment_booking: {
      what: 'Book an open slot directly with a doctor.',
      where: "Provider results page - tap a doctor - 'Book appointment'",
      how: "Pick a date and time from the doctor's open slots. You'll get a confirmation immediately.",
    },
    care_history: {
      what: 'Every assessment and uploaded document is saved to your timeline.',
      where: 'Patient portal - My History',
    },
  },

  account: {
    forgot_password: "On the login screen, tap 'Forgot password?' Enter your email. You'll get a reset link within a minute.",
    change_password: "Currently, change your password by signing out and using 'Forgot password?' on the login screen.",
    delete_account: 'Email support@nowcare.app - we will process your request within 24 hours.',
    add_location: 'Patient portal - Profile - set your location so we can find providers near you.',
  },

  roles: {
    patient: 'Sign up with email, age, gender, location. No verification required.',
    doctor: 'Sign up with email and your NPI number. We verify automatically against the NPPES Registry. Approval is instant if your NPI is active.',
    hospital: 'Sign up with email and hospital name. A NowCare admin reviews and approves within 24 hours. CMS data is auto-populated on approval.',
    admin: 'Internal NowCare team only.',
  },

  trust_and_safety: {
    data_privacy: 'Your symptom assessments and uploaded documents are private. Only you can see them. We do not sell your data.',
    not_medical_advice: 'NowCare is a navigation tool, not a doctor. Every recommendation is a suggestion, not a diagnosis. In an emergency, call 911 immediately.',
    verification: "Doctors are verified through the U.S. government's NPPES NPI Registry. Hospitals are reviewed manually before activation.",
  },

  troubleshooting: {
    document_upload_failed: 'Make sure the file is under 20 MB and is a PDF, JPG, PNG, or DOCX. If it still fails, try a different browser.',
    map_not_loading: 'Allow location permission in your browser. If providers still do not appear, set your location manually in your profile.',
    voice_input_not_working: 'Voice input requires Chrome or Edge with microphone permission granted. On other browsers, please type your symptoms.',
    appointment_not_showing: 'Bookings appear immediately in My History. If you do not see one, refresh the page. If still missing, the booking may have failed - please try again.',
  },
}

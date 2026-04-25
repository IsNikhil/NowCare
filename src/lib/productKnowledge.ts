// NowCare Companion reads this at runtime on every message. Update when features change.

export const PRODUCT_KNOWLEDGE = {
  last_updated: '2026-04-25',
  product_name: 'NowCare',
  tagline: 'AI-powered healthcare navigation. Care, found faster.',

  features: {
    symptom_assessment: {
      what: 'Describe your symptoms and get an AI recommendation for the right level of care: ER now, urgent same-day care, get a scan, try telehealth, schedule a doctor, or take care at home.',
      where: "Patient portal - New Assessment, or type in the 'Find care now' bar on your home page.",
      how: 'Type or speak your symptoms. Get a recommendation in under 5 seconds. The recommendation is one of six fixed care categories - never a diagnosis.',
    },
    document_analysis: {
      what: 'Upload medical reports, prescriptions, lab results, or imaging reports as PDF or image. Get a plain-language summary, key findings, and questions to ask your doctor.',
      where: 'Patient portal - My Documents - Upload',
      how: 'Drag-and-drop a file or tap to upload. Analysis takes about 10 seconds.',
    },
    provider_search: {
      what: 'Find verified doctors and hospitals near you, filtered by specialty and insurance.',
      where: "Patient portal - Home - 'Find a specialist' chips, or Find Providers in the sidebar.",
      how: 'Pick a specialty. See a map and list of providers. Tap to book if available, or call directly.',
    },
    appointment_booking: {
      what: 'Book an open slot directly with a NowCare-listed doctor.',
      where: "Provider results page - tap a doctor - 'Book appointment'",
      how: "Pick a date and time from the doctor's open slots. You will get a confirmation immediately.",
    },
    care_history: {
      what: 'Every assessment and uploaded document is saved to your assessment history.',
      where: 'Patient portal - My History',
    },
    scan_slots: {
      what: 'View available imaging slots (MRI, CT, X-Ray, Ultrasound) at nearby hospitals.',
      where: 'Provider results page - filter by scan type, or follow a scan recommendation from your assessment.',
      how: 'Tap a slot to book or call to confirm.',
    },
    companion_chat: {
      what: 'NowCare Companion can help you navigate the product, explain values from uploaded documents, walk you through features, and look up your upcoming bookings.',
      where: 'Bottom-right bubble on every screen.',
      how: 'Just ask in plain language. For symptom or urgency questions, Companion will redirect you to the Assessment tool.',
    },
  },

  account: {
    forgot_password: "On the login screen, tap 'Forgot password?' Enter your email. You will get a reset link within a minute.",
    change_password: "Sign out and use 'Forgot password?' on the login screen.",
    delete_account: 'Email support@nowcare.app - we will process your request within 24 hours and remove all your data.',
    add_location: 'Patient portal - Profile - set your location so we can find providers near you.',
    update_insurance: 'Patient portal - Profile - Lifestyle and access section. Pick your insurance carrier. The provider search filter updates automatically.',
  },

  roles: {
    patient: 'Sign up with email, date of birth, gender, and location. No verification required.',
    doctor: 'Sign up with email and your NPI number. We verify automatically against the NPPES Registry. Approval is instant if your NPI is active.',
    hospital: 'Sign up with email and hospital name. A NowCare admin reviews and approves within 24 hours. CMS data is auto-populated on approval.',
    admin: 'Internal NowCare team only.',
  },

  trust_and_safety: {
    data_privacy: 'Your symptom assessments and uploaded documents are private. Only you and providers you book with can see relevant pieces. We do not sell your data.',
    not_medical_advice: 'NowCare is a navigation tool, not a doctor. Every assessment recommendation is a suggestion, not a diagnosis. In an emergency, call 911 immediately.',
    verification: "Doctors are verified through the U.S. government's NPPES NPI Registry. Hospitals are reviewed by NowCare admins before activation. Look for the verified badge.",
  },

  data_sources: {
    doctors: 'We use the official U.S. NPPES NPI Registry - the same database used by hospitals and insurers - updated daily.',
    hospitals: 'Hospital data comes from the CMS Hospital General Information dataset.',
    insurance_acceptance: 'For NowCare-onboarded providers, insurance is self-declared during signup. For providers without verified data, we show "Insurance not verified - call to confirm."',
  },

  troubleshooting: {
    document_upload_failed: 'Make sure the file is under 20 MB and is a PDF, JPG, PNG, or DOCX. If it still fails, try a different browser.',
    map_not_loading: 'Allow location permission in your browser. If providers still do not appear, set your location manually in your profile.',
    voice_input_not_working: 'Voice input requires Chrome or Edge with microphone permission granted. On other browsers, please type your symptoms.',
    assessment_not_saving: 'Assessments save automatically after you receive a result. If one is missing, check My History after refreshing the page.',
  },
}

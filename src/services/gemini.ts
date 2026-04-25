import { GoogleGenAI } from '@google/genai'
import type { TriageResult, DocumentAnalysis } from '../types'
import type { CareCategory, Urgency } from '../lib/careCategories'
import { PRODUCT_KNOWLEDGE } from '../lib/productKnowledge'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string })

// ─── Triage ───────────────────────────────────────────────────────────────────

const FALLBACK_TRIAGE: TriageResult = {
  care_category: 'URGENT_TODAY',
  urgency: 'soon',
  short_reasoning: 'We could not fully process your description. Please consult a same-day care provider to be safe.',
  red_flags: ['Worsening pain', 'Difficulty breathing', 'Loss of consciousness'],
  what_to_expect: 'A provider will evaluate your symptoms in person and recommend next steps.',
}

const TRIAGE_SYSTEM = `You are NowCare's symptom assessment engine. You are NOT a doctor. You do NOT diagnose. Your only job is to recommend ONE category of care from this fixed list:

- ER_NOW: chest pain with breath issues, severe bleeding, stroke signs, severe head injury, anaphylaxis, suicidal crisis, severe allergic reaction
- URGENT_TODAY: high fever with worsening symptoms, moderate injuries, infections needing antibiotics today, dehydration, severe pain that is new
- SCAN_NEEDED: suspected fractures, persistent unexplained pain in a specific area, post-injury follow-up imaging
- TELEHEALTH: cold/flu symptoms, simple medication questions, mild rash, mental health check-in, prescription refill discussion
- SCHEDULE_DOCTOR: chronic condition follow-up, routine preventive concerns, mild symptoms persisting more than 2 weeks, specialist referral needs
- SELF_CARE: mild headache, minor cold first-day symptoms, minor cuts/scrapes, mild muscle soreness from exercise

Rules:
1. Output ONLY valid JSON matching the schema. No markdown fences. No prose outside JSON.
2. NEVER write more than 2 sentences in short_reasoning. Plain language. No medical jargon.
3. NEVER suggest a specific medication, dose, or diagnosis.
4. ALWAYS include red_flags with symptoms that should escalate to ER if they appear.
5. If symptoms are vague, default to a more cautious category (e.g., URGENT_TODAY over SELF_CARE).
6. recommended_specialty must be one of: internal_medicine, family_medicine, pediatrics, cardiology, neurology, dermatology, dentistry, obgyn, psychiatry, ophthalmology, ent, urology, gastroenterology, orthopedics, pulmonology, emergency_medicine. Omit if uncertain.
7. scan_type is required ONLY when care_category is SCAN_NEEDED.

Schema:
{
  "care_category": "ER_NOW" | "URGENT_TODAY" | "SCAN_NEEDED" | "TELEHEALTH" | "SCHEDULE_DOCTOR" | "SELF_CARE",
  "urgency": "immediate" | "soon" | "routine",
  "recommended_specialty": string (optional),
  "scan_type": "MRI" | "CT" | "X-Ray" | "Ultrasound" (optional),
  "short_reasoning": string (max 2 sentences),
  "red_flags": string[],
  "what_to_expect": string (1 sentence)
}`

const VALID_CATEGORIES: CareCategory[] = ['ER_NOW', 'URGENT_TODAY', 'SCAN_NEEDED', 'TELEHEALTH', 'SCHEDULE_DOCTOR', 'SELF_CARE']
const VALID_URGENCIES: Urgency[] = ['immediate', 'soon', 'routine']

export async function triage(
  symptoms: string,
  patientContext?: { age: number; gender: string }
): Promise<TriageResult> {
  try {
    const age = patientContext?.age ?? 30
    const gender = patientContext?.gender ?? 'unknown'
    const userMessage = `Patient is ${age} year old ${gender}. Symptoms: ${symptoms}.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: TRIAGE_SYSTEM,
        temperature: 0.2,
      },
    })

    const raw = response.text ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as TriageResult

    if (
      !VALID_CATEGORIES.includes(parsed.care_category) ||
      !VALID_URGENCIES.includes(parsed.urgency)
    ) {
      return FALLBACK_TRIAGE
    }

    return {
      care_category: parsed.care_category,
      urgency: parsed.urgency,
      recommended_specialty: parsed.recommended_specialty,
      scan_type: parsed.scan_type,
      short_reasoning: parsed.short_reasoning ?? FALLBACK_TRIAGE.short_reasoning,
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      what_to_expect: parsed.what_to_expect ?? '',
    }
  } catch {
    return FALLBACK_TRIAGE
  }
}

// ─── Document Analysis ────────────────────────────────────────────────────────

const DOCUMENT_SYSTEM = `You are NowCare's medical document analyzer. Your job is to read a patient's medical document (lab result, prescription, imaging report, discharge summary, etc.) and produce a clear, plain-language summary.

Strict rules:
1. Output ONLY valid JSON matching the schema. No markdown fences.
2. NEVER diagnose. NEVER prescribe. NEVER tell the patient to stop or change a medication.
3. Translate medical jargon into plain English. A 7th grader should understand every sentence.
4. For lab values, classify status as normal/low/high based on reference ranges in the document. If no reference range is visible, mark status as "info".
5. For each key_finding's "explanation," write 1 sentence telling the patient what this measurement is and what an abnormal value might mean - NOT what is wrong with them specifically.
6. questions_to_ask_doctor must be specific to what is in the document, not generic.
7. red_flags must include any values that are critically out of range OR any text in the doc indicating "urgent," "abnormal," or "follow up immediately."
8. disclaimer is always: "This is an AI-generated summary to help you understand your document. It is not medical advice. Always discuss your results with your doctor."

Return JSON only matching this schema:
{
  "document_type": string,
  "date_of_document": string (optional, ISO date if visible),
  "provider_name": string (optional),
  "patient_name": string (optional),
  "summary": string (2-3 plain-language sentences),
  "key_findings": [{ "label": string, "value": string, "reference_range": string (optional), "status": "normal"|"low"|"high"|"abnormal"|"info", "explanation": string }],
  "medications": [{ "name": string, "dose": string (optional), "frequency": string (optional), "purpose": string }] (optional),
  "follow_up_recommendations": string[],
  "questions_to_ask_doctor": string[],
  "red_flags": string[],
  "disclaimer": string
}`

export async function analyzeDocument(file: File): Promise<DocumentAnalysis> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: DOCUMENT_SYSTEM },
          { inlineData: { mimeType: file.type, data: base64 } },
        ],
      },
    ],
    config: { temperature: 0.2 },
  })

  const raw = response.text ?? ''
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as DocumentAnalysis
  return parsed
}

// ─── Document Q&A ──────────────────────────────────────────────────────────────

export async function askAboutDocument(
  question: string,
  documentAnalysis: DocumentAnalysis,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `You are NowCare's document assistant. A patient is asking questions about their medical document.
Answer based ONLY on the document analysis below. Use plain language.
NEVER diagnose. NEVER suggest changing medications. Always remind them to discuss with their doctor.
If the question is not answerable from the document, say so clearly.

Document Analysis:
${JSON.stringify(documentAnalysis, null, 2)}`

  const conversationHistory = history.map((h) => `${h.role === 'user' ? 'Patient' : 'Assistant'}: ${h.content}`).join('\n')
  const fullPrompt = conversationHistory ? `${conversationHistory}\nPatient: ${question}` : question

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    },
  })

  return response.text ?? 'I could not answer that question based on this document.'
}

// ─── Pre-Visit Summary ─────────────────────────────────────────────────────────

const SUMMARY_SYSTEM = `You are NowCare's pre-visit summary writer. Generate a concise, structured document a patient can show their doctor on arrival.

Rules:
1. Output JSON matching the schema.
2. Format the body as if it is already on a clipboard - short, scannable, professional.
3. Include a chief complaint, symptom timeline (if mentioned), relevant context, and questions the patient has.
4. NEVER include a diagnosis. NEVER include vital signs you do not have.
5. Maximum 250 words across all body fields combined.

Schema:
{
  "chief_complaint": string,
  "symptom_summary": string,
  "duration_and_progression": string,
  "patient_questions": string[],
  "relevant_context": string
}`

export async function generatePreVisitSummary(
  symptoms: string,
  triageResult: TriageResult,
  patientContext: { age: number; gender: string }
): Promise<string> {
  try {
    const userMessage = `Patient: ${patientContext.age} year old ${patientContext.gender}.
Reported symptoms: ${symptoms}.
Triage classification: ${triageResult.care_category}, urgency: ${triageResult.urgency}.
Triage reasoning: ${triageResult.short_reasoning}.
Red flags identified: ${triageResult.red_flags.join(', ') || 'none'}.
Generate the pre-visit summary now.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: SUMMARY_SYSTEM,
        temperature: 0.3,
      },
    })

    return response.text ?? ''
  } catch {
    return ''
  }
}

// ─── Doctor Performance Insights ─────────────────────────────────────────────

export async function generateDoctorInsights(
  doctorName: string,
  specialty: string,
  recentReasons: string[]
): Promise<string[]> {
  try {
    const systemPrompt = `You are a practice management advisor. Based on a doctor's recent patient visit reasons, generate 2-3 short, actionable insights. Each insight is 1 sentence. Plain language. No medical advice. Output as a JSON array of strings.`

    const userMessage = `Doctor: ${doctorName}, Specialty: ${specialty}.
Recent patient visit reasons (last 30 days):
${recentReasons.slice(0, 20).join('\n')}

Generate 2-3 practice insights as a JSON array of strings.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: { systemInstruction: systemPrompt, temperature: 0.4 },
    })

    const raw = response.text ?? '[]'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [
      'Your appointment slots fill fastest on weekday mornings - consider adding afternoon availability.',
      'Most patients book within 48 hours of their assessment - keeping open slots improves access.',
    ]
  }
}

// ─── Help Bot ────────────────────────────────────────────────────────────────

const HELPBOT_SYSTEM = `You are NowCare Helper, the help desk assistant inside the NowCare app. You help users navigate the product, troubleshoot issues, change settings, and understand features.

You are NOT a medical assistant. You DO NOT discuss symptoms, diagnoses, treatments, medications, or anything clinical. If the user asks anything medical, respond exactly: "I'm the help desk - I can only help with using NowCare. For symptom questions, please use the 'New Assessment' tool on your patient home page."

Your knowledge base is the PRODUCT_KNOWLEDGE provided below. ALWAYS prefer information from PRODUCT_KNOWLEDGE over your general knowledge. If the user asks about something not in PRODUCT_KNOWLEDGE, say "I do not have current information on that - please email support@nowcare.app" rather than guessing.

Tone: warm, concise, helpful. Maximum 3 short paragraphs per response. Use bullet points only when listing steps. NEVER use emojis.

When the user asks how to do something, give exact navigation steps.
If the user expresses frustration, acknowledge it briefly then offer the fix. Never lecture. Never apologize excessively.

PRODUCT_KNOWLEDGE:
${JSON.stringify(PRODUCT_KNOWLEDGE, null, 2)}`

export async function helpBotChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const conversationParts = history.slice(-10).map((h) => `${h.role === 'user' ? 'User' : 'NowCare Helper'}: ${h.content}`).join('\n')
  const fullMessage = conversationParts ? `${conversationParts}\nUser: ${message}` : message

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullMessage,
    config: {
      systemInstruction: HELPBOT_SYSTEM,
      temperature: 0.3,
    },
  })

  return response.text ?? 'I am having trouble responding right now. Please try again.'
}

// ─── Legacy compat ─────────────────────────────────────────────────────────────

export async function summary(
  symptoms: string,
  triageResult: TriageResult,
  patientContext: { age: number; gender: string }
): Promise<string> {
  return generatePreVisitSummary(symptoms, triageResult, patientContext)
}

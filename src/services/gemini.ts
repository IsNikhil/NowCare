import { GoogleGenAI } from '@google/genai'
import type { TriageResult } from '../types'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string })

const FALLBACK_TRIAGE: TriageResult = {
  care_type: 'urgent',
  urgency: 'soon',
  reasoning: 'We could not assess your symptoms. Please consult a healthcare provider to be safe.',
  red_flags: [],
}

const TRIAGE_SYSTEM = `You are a healthcare triage assistant. A patient will describe their symptoms. Recommend the most appropriate type of care for them to seek right now.

Respond ONLY with valid JSON. No markdown, no explanation, no preamble.

{
  "care_type": "er" | "urgent" | "telehealth" | "wait",
  "urgency": "immediate" | "soon" | "routine",
  "reasoning": "1-2 plain sentences. No jargon. No AI references. Be specific about care type and why.",
  "red_flags": ["string"]
}

care_type: er = life-threatening, urgent = same-day non-emergency, telehealth = remote assessment fine, wait = minor, can schedule later
urgency: immediate = go now, soon = within hours, routine = day or two is fine
reasoning: sounds like a knowledgeable friend, not a clinical report. Max 2 sentences.
If input is too vague: return wait with reasoning asking for more detail.`

const SUMMARY_SYSTEM = `You generate a short pre-visit summary document the patient can show to a provider on arrival. Write in plain English. 120 to 180 words. Start with a one line patient descriptor. Then list the symptoms in the patient's own words. Then list the duration and severity if mentioned. Then list the triage classification and urgency. End with any red flags. No medical diagnosis. No prescriptions.`

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
      !['er', 'urgent', 'telehealth', 'wait'].includes(parsed.care_type) ||
      !['immediate', 'soon', 'routine'].includes(parsed.urgency)
    ) {
      return FALLBACK_TRIAGE
    }

    return {
      care_type: parsed.care_type,
      urgency: parsed.urgency,
      reasoning: parsed.reasoning ?? FALLBACK_TRIAGE.reasoning,
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
    }
  } catch {
    return FALLBACK_TRIAGE
  }
}

export async function summary(
  symptoms: string,
  triageResult: TriageResult,
  patientContext: { age: number; gender: string }
): Promise<string> {
  try {
    const userMessage = `Patient: ${patientContext.age} year old ${patientContext.gender}.
Reported symptoms: ${symptoms}.
Triage classification: ${triageResult.care_type}, urgency: ${triageResult.urgency}.
Triage reasoning: ${triageResult.reasoning}.
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

    return response.text ?? 'Summary could not be generated. Please describe your symptoms to the provider on arrival.'
  } catch {
    return 'Summary could not be generated. Please describe your symptoms to the provider on arrival.'
  }
}

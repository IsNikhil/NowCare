# NowCare 🏥
AI-Powered Healthcare Navigation Platform

Built for LionHacks 2026 (GDG on Campus SELU)

---

## 🚀 Overview

NowCare is a real-time healthcare navigation platform that helps patients:

- Understand what level of care they need using AI triage (Gemini)
- Find nearby hospitals and doctors with live availability
- View ER status, MRI slots, and doctor availability in real time
- Generate pre-visit summaries for doctors
- Track full care journeys

It acts as a "GPS for healthcare".

---

## 🧠 Core Features

### 👤 Patient Portal
- Symptom input (text / voice)
- AI triage (ER / urgent / telehealth / wait)
- Nearby providers on Google Maps
- Pre-visit medical summary

### 🏥 Hospital Portal
- ER status updates (Low / Moderate / High / Closed)
- MRI slot management
- CMS-backed hospital verification

### 👨‍⚕️ Doctor Portal
- NPI verification (NPPES API)
- Availability slot management
- Credential badge system

### 🛠 Admin Portal
- Hospital approval system
- Manual verification controls

---

## ⚙️ Tech Stack

- React + TypeScript
- Vite
- Firebase Auth + Firestore + Hosting
- Gemini API (AI triage + summaries)
- Google Maps JavaScript API
- CMS + NPPES APIs (government healthcare data)

---

---

## 🌿 Branch Strategy

We use a simple feature-branch workflow:

- `main` → stable production-ready demo
- `dev` → integration branch
- `feature/patient-*` → patient portal work
- `feature/doctor-*` → doctor portal work
- `feature/hospital-*` → hospital portal work
- `feature/admin-*` → admin dashboard

---

## 🔧 Setup

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd NowCare
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the development server:**
   ```
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your Firebase configuration:
   ```bash
   cp .env.example .env
   ```
   Required variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.

---

## 📁 Project Structure

## 🔧 Deployed Link

[nowcare.vercel.app](https://nowcare.vercel.app)
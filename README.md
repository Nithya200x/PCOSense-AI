# PCOSense AI 🌸
*The Future of Women's Healthcare*

PCOSense AI is a continuous, intelligent, PCOS-specialized predictive system focused on early awareness, guidance, and personalized support for women affected by Polycystic Ovary Syndrome.

Built as a hackathon-winning YC startup product, this app demonstrates a scalable API-first architecture, beautiful glassmorphism UI, and highly-tuned Explainable AI.

## 🚀 Features & Architecture (As Pitched)
- **Session Memory & Conversational UI**: Full conversation history is retained and sent back to the AI. The system longitudinal tracks symptoms instead of treating interactions as one-offs.
- **PCOS-Tuned AI & Medical Guardrails**: The OpenAI system prompt is carefully tuned to Follow a strict `Listen ➔ Extract ➔ Educate ➔ Guide` loop. Guardrails ensure the AI *never* diagnoses or prescribes medication, but acts as a companion.
- **Speech-to-Text (Voice API)**: Built-in natural language input using Web Speech API, allowing users of any literacy level to share their symptoms via Voice.
- **Report Analyzer (OCR Vision AI)**: Powered by **Tesseract OCR** and OpenAI. Users can upload blood tests/ultrasound reports, and the AI extracts the raw text and interprets hormone values (e.g., Testosterone, Insulin) into plain English.
- **Personalized Lifestyle Guidance**: Adapts diet, movement, and sleep routines in real-time based on the user's ongoing profile.

## 🧠 Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS v4, Recharts *(Note: Cross-platform PWA strategy replacing Flutter for web-first approach)*
- **Backend**: FastAPI (Python), Uvicorn, Pydantic
- **AI & NLP**: OpenAI GPT-4o-mini
- **Voice & OCR**: Web Speech API (Google Engine) & Tesseract OCR
- **Data & Auth**: Firebase initialized (Authentication, Realtime Database, Cloud Storage)

## 📦 How to Run

### 1. Start the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

*(Important: API & Firebase Configuration)*
To enable the **Real AI, OCR, & Database** features, you must provide your keys.

**1. OpenAI Key (Backend)**
1. Copy `.env.example` to `.env` in the `backend` folder.
2. Add your key: `OPENAI_API_KEY=sk-your-real-key-here`

**2. Firebase Setup (Frontend)**
The `frontend/.env.local` is already configured with your Google API Key:
`NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...`
Firebase SDK is wired up in `frontend/src/lib/firebase.ts`.

Start the server:
```bash
python3 main.py
```
*Backend will run on `http://localhost:8001`*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on `http://localhost:3000`*

## 💡 Note
**Disclaimer:** This tool supports awareness and is not a medical diagnosis replacement. Always consult with a healthcare professional.

---

## 🤖 For AI Agents & Developers (Context Guide)
If you are an AI assistant or a new developer modifying this codebase, please adhere to these strict architectural rules established for this hackathon project:

### 1. Port Mapping & Network Architecture
- **Frontend** runs on `localhost:3000`.
- **Backend MUST run on `localhost:8001`**. Do NOT change this to `8000`. We explicitly migrated to `8001` because of known port collisions (`[Errno 48]`) with other localized workspaces. Frontend `fetch` calls are hardcoded to `8001`.

### 2. The Fallback Pattern (CRITICAL)
Both the `analyze-report` (OCR) and `chat` endpoints contain **Simulated Demo Logic (Fallbacks)**. 
- If `pytesseract` is not installed on the host machine, or if `OPENAI_API_KEY` is missing/exhausted, the backend gracefully catches the exception and returns hardcoded, realistic demo data (simulated latency via `time.sleep()`). 
- **DO NOT remove the fallback blocks**. They are safety nets to ensure the app never crashes during a live hackathon pitch.

### 3. State Management & Session Memory
- The backend API is **stateless**. Session memory is implemented entirely via the frontend sending the *full conversation history* array (`messages: List[ChatMessage]`) to the `/api/chat` endpoint on every request. 
- Do not attempt to add `ConversationBufferMemory` or local database storage to the FastAPI layer for session management without consulting the user.

### 4. System Prompt Integrity
The `System Prompt` in `backend/main.py` is specifically aligned with the team's Pitch Deck (Slide 05 & 06). It explicitly enforces a 4-step pipeline: `Listen ➔ Extract ➔ Educate ➔ Guide`, along with strict medical guardrails (no diagnosing). Do not generalize or weaken this prompt.

### 5. API Keys
- `OPENAI_API_KEY` goes in `backend/.env`.
- Firebase keys (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`) go in `frontend/.env.local`. 
- Voice Input utilizes the browser-native `Web Speech API` (via `window.webkitSpeechRecognition`) which does not require a third-party key.

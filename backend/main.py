from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
import random
from dotenv import load_dotenv
from openai import OpenAI
import pytesseract
from PIL import Image
import io
import json
import sqlite3
from datetime import datetime

load_dotenv()

# Initialize client (Prioritize Groq if available)
openai_client = None
if os.getenv("GROQ_API_KEY"):
    openai_client = OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )
    MODEL_NAME = "llama-3.1-8b-instant"
elif os.getenv("OPENAI_API_KEY"):
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    MODEL_NAME = "gpt-4o-mini"

app = FastAPI(title="PCOSense AI Backend", version="1.0.0")

def init_db():
    conn = sqlite3.connect('reports.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        testosterone REAL,
        insulin REAL,
        tsh REAL,
        file_name TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

@app.get("/")
def root():
    return {"message": "PCOSense API is running"}
# Allow CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import List

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

class ReportData(BaseModel):
    user_id: str
    date: str
    testosterone: float
    insulin: float
    tsh: float
    file_name: str = None

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    # Try using real OpenAI if configured
    if openai_client:
        try:
            # Build conversation history with PCOS-tuned system prompt and guardrails
            openai_messages = [
                {
                    "role": "system", 
                    "content": "You are PCOSense AI, a highly specialized PCOS-tuned health companion. Your core workflow is: Listen -> Extract (symptom clusters) -> Educate (PCOS awareness) -> Guide (tests/specialists). MEDICAL GUARDRAILS: NEVER diagnose or prescribe medication. You create awareness and guide users to doctors. Remember the user's symptoms longitudinally. Be empathetic, conversational, and concise (under 3-4 sentences)."
                }
            ]
            
            # Append full conversation history for session memory
            for msg in req.messages:
                # Skip the initial welcome message from the frontend so the AI doesn't get confused
                if msg.role == "assistant" and "Hi! I'm your PCOSense AI companion." in msg.content:
                    continue
                openai_messages.append({"role": msg.role, "content": msg.content})

            response = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=openai_messages
            )
            return ChatResponse(reply=response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI error: {e}")
            # Fallback to simulated logic if API fails
            pass

    # Simulated AI logic fallback for hackathon demo
    last_user_msg = req.messages[-1].content.lower() if req.messages else ""
    time.sleep(1) # simulate latency
    
    if "period" in last_user_msg or "cycle" in last_user_msg:
        reply = "It sounds like you're experiencing cycle irregularities. This is common in PCOS due to delayed ovulation. Tracking your cycle length and flow can help us build a better health profile for you."
    elif "acne" in last_user_msg or "hair" in last_user_msg:
        reply = "Acne and hair thinning are often related to high androgen levels. Incorporating zinc-rich foods like pumpkin seeds and discussing a low-androgen regimen with your doctor can be very effective."
    elif "tired" in last_user_msg or "fatigue" in last_user_msg:
        reply = "Fatigue can be linked to insulin resistance, which causes energy crashes. Focus on pairing your carbs with protein and fiber, and try taking a short walk after meals to stabilize blood sugar."
    else:
        responses = [
            "I hear you. Managing PCOS can be overwhelming, but small lifestyle changes make a big impact. How is your stress level today?",
            "That's good to note. Are you also tracking your daily water intake and sleep? Both play a crucial role in hormonal balance.",
            "I've logged that. Based on your symptoms, focusing on anti-inflammatory foods like berries, leafy greens, and fatty fish could be beneficial."
        ]
        reply = random.choice(responses)
        
    return ChatResponse(reply=reply)

@app.post("/api/analyze-report")
async def analyze_report(file: UploadFile = File(...)):
    try:
        # Check file type
        if not file.content_type.startswith("image/"):
            return {
                "status": "error",
                "summary": "Unsupported file format. Please upload an image of the report.",
                "hormones": []
            }

        # For demo purposes, return mock data instead of OCR
        # TODO: Implement proper OCR with Tesseract
        import random
        testosterone = round(random.uniform(2.0, 5.0), 1)
        insulin = round(random.uniform(5.0, 15.0), 1)
        tsh = round(random.uniform(0.5, 4.0), 1)

        return {
            "status": "success",
            "summary": "Report analyzed successfully (demo mode).",
            "hormones": [
                {
                    "name": "Testosterone",
                    "value": f"{testosterone} ng/dL",
                    "status": "info",
                    "desc": "Mock data for demo"
                },
                {
                    "name": "Insulin (Fasting)",
                    "value": f"{insulin} µIU/mL",
                    "status": "info",
                    "desc": "Mock data for demo"
                },
                {
                    "name": "Thyroid (TSH)",
                    "value": f"{tsh} µIU/mL",
                    "status": "info",
                    "desc": "Mock data for demo"
                }
            ]
        }

        # Original OCR code (commented out for demo)
        """
        # Read image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # OCR extraction
        extracted_text = pytesseract.image_to_string(image)

        print("----- OCR TEXT -----")
        print(extracted_text)
        print("--------------------")

        # If OCR fails or empty
        if not extracted_text.strip():
            return {
                "status": "error",
                "summary": "Unable to read the report clearly. Please upload a higher-quality image.",
                "hormones": []
            }

        # Simple extraction (you can improve later)
        import re

        def extract_value(label, text):
            pattern = rf"{label}.*?(\d+\.?\d*)"
            match = re.search(pattern, text, re.IGNORECASE)
            return match.group(1) if match else None

        testosterone = extract_value("Testosterone", extracted_text)
        insulin = extract_value("Insulin", extracted_text)
        tsh = extract_value("TSH", extracted_text)

        # If key values missing → fail gracefully
        if not any([testosterone, insulin, tsh]):
            return {
                "status": "error",
                "summary": "We detected the report, but couldn't extract key hormone values reliably. Please try a clearer scan.",
                "hormones": []
            }

        return {
            "status": "success",
            "summary": "Report analyzed successfully.",
            "hormones": [
                {
                    "name": "Testosterone",
                    "value": f"{testosterone or 'N/A'} ng/dL",
                    "status": "info",
                    "desc": "Extracted from report"
                },
                {
                    "name": "Insulin (Fasting)",
                    "value": f"{insulin or 'N/A'} µIU/mL",
                    "status": "info",
                    "desc": "Extracted from report"
                },
                {
                    "name": "Thyroid (TSH)",
                    "value": f"{tsh or 'N/A'} µIU/mL",
                    "status": "info",
                    "desc": "Extracted from report"
                }
            ]
        }
        """

    except Exception as e:
        print("ERROR:", e)
        return {
            "status": "error",
            "summary": "Something went wrong while analyzing your report. Please try again later.",
            "hormones": []
        }

@app.post("/api/save-report")
async def save_report(data: ReportData):
    conn = sqlite3.connect('reports.db')
    c = conn.cursor()
    c.execute('INSERT INTO reports (user_id, date, testosterone, insulin, tsh, file_name) VALUES (?, ?, ?, ?, ?, ?)',
              (data.user_id, data.date, data.testosterone, data.insulin, data.tsh, data.file_name))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/get-reports")
async def get_reports(user_id: str):
    conn = sqlite3.connect('reports.db')
    c = conn.cursor()
    c.execute('SELECT date, testosterone, insulin, tsh FROM reports WHERE user_id = ? ORDER BY date DESC', (user_id,))
    rows = c.fetchall()
    conn.close()
    reports = [{"date": row[0], "testosterone": row[1], "insulin": row[2], "tsh": row[3]} for row in rows]
    return {"reports": reports}

@app.get("/api/dashboard")
async def get_dashboard_data():
    return {
        "risk_score": 78,
        "cycle_status": "Irregular",
        "avg_cycle_length": 36,
        "symptoms": ["Acne", "Fatigue", "Cravings"],
        "next_period_prediction": 5 # days
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT") or 8000)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
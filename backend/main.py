from fastapi import FastAPI, UploadFile, File, HTTPException
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
from datetime import datetime, timedelta
import re

load_dotenv()

# Set up Tesseract binary path for Windows if specified in env
if os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

# Initialize client (Prioritize Groq if available)
openai_client = None
MODEL_NAME = "gpt-4o-mini"
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
    # Reports table for blood tests
    c.execute('''CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        date TEXT,
        testosterone REAL,
        lh REAL,
        fsh REAL,
        tsh REAL,
        insulin REAL,
        amh REAL,
        prolactin REAL,
        vitamin_d REAL,
        hba1c REAL,
        glucose REAL,
        file_name TEXT,
        summary TEXT
    )''')
    
    # Check for missing columns in reports (migration for existing database)
    c.execute("PRAGMA table_info(reports)")
    columns = [row[1] for row in c.fetchall()]
    new_cols = {
        "lh": "REAL",
        "fsh": "REAL",
        "amh": "REAL",
        "prolactin": "REAL",
        "vitamin_d": "REAL",
        "hba1c": "REAL",
        "glucose": "REAL",
        "summary": "TEXT"
    }
    for col, col_type in new_cols.items():
        if col not in columns:
            c.execute(f"ALTER TABLE reports ADD COLUMN {col} {col_type}")

    # Daily tracking log table
    c.execute('''CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        date TEXT,
        symptoms TEXT,          -- JSON string (acne, cramps, bloating, mood, fatigue)
        period_start TEXT,      -- 'YYYY-MM-DD' or null
        period_end TEXT,        -- 'YYYY-MM-DD' or null
        flow TEXT,              -- Light, Medium, Heavy, Spotting
        pain TEXT,              -- None, Mild, Moderate, Severe
        water_consumed REAL,    -- in Liters
        weight REAL,            -- in kg
        sleep_hours REAL,       -- duration
        sleep_quality INTEGER,  -- 1-5 rating
        medications TEXT,       -- JSON string of daily medications
        exercise TEXT,          -- JSON string of daily workouts
        meals TEXT,             -- JSON string of daily meals
        UNIQUE(user_id, date)
    )''')
    
    conn.commit()
    conn.close()

init_db()

# Allow CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "PCOSense API is running"}

# --- Pydantic Data Models ---

from typing import List, Optional, Dict, Any

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
    testosterone: Optional[float] = None
    lh: Optional[float] = None
    fsh: Optional[float] = None
    tsh: Optional[float] = None
    insulin: Optional[float] = None
    amh: Optional[float] = None
    prolactin: Optional[float] = None
    vitamin_d: Optional[float] = None
    hba1c: Optional[float] = None
    glucose: Optional[float] = None
    file_name: Optional[str] = None
    summary: Optional[str] = None

class SymptomData(BaseModel):
    acne: bool = False
    cramps: bool = False
    bloating: bool = False
    fatigue: bool = False
    mood: str = ""

class DailyLogData(BaseModel):
    user_id: str
    date: str
    symptoms: Optional[SymptomData] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    flow: Optional[str] = None
    pain: Optional[str] = None
    water_consumed: Optional[float] = 0.0
    weight: Optional[float] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    medications: Optional[List[Dict[str, Any]]] = None
    exercise: Optional[List[Dict[str, Any]]] = None
    meals: Optional[List[Dict[str, Any]]] = None

class ProfileData(BaseModel):
    age: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    avgCycleLength: Optional[str] = None
    symptoms: Optional[str] = None
    familyHistory: Optional[Any] = None
    user_id: Optional[str] = None

class LifestyleRequest(BaseModel):
    profile: ProfileData

# --- Reference Ranges for Offline / Regex Parser ---
REFERENCE_RANGES = {
    "testosterone": {"min": 15, "max": 70, "unit": "ng/dL", "name": "Testosterone"},
    "lh": {"min": 2.4, "max": 12.6, "unit": "mIU/mL", "name": "Luteinizing Hormone (LH)"},
    "fsh": {"min": 3.5, "max": 12.5, "unit": "mIU/mL", "name": "Follicle-Stimulating Hormone (FSH)"},
    "tsh": {"min": 0.4, "max": 4.0, "unit": "µIU/mL", "name": "Thyroid (TSH)"},
    "insulin": {"min": 2.0, "max": 25.0, "unit": "µIU/mL", "name": "Insulin (Fasting)"},
    "amh": {"min": 1.5, "max": 4.0, "unit": "ng/mL", "name": "Anti-Müllerian Hormone (AMH)"},
    "prolactin": {"min": 4.8, "max": 23.3, "unit": "ng/mL", "name": "Prolactin"},
    "vitamin_d": {"min": 30.0, "max": 100.0, "unit": "ng/mL", "name": "Vitamin D"},
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "name": "HbA1c"},
    "glucose": {"min": 70, "max": 100, "unit": "mg/dL", "name": "Fasting Glucose"}
}

# --- OCR Image Preprocessing ---
def preprocess_report_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to grayscale
        image = image.convert('L')
        # Apply median filter to denoise
        from PIL import ImageFilter
        image = image.filter(ImageFilter.MedianFilter(size=3))
        # Binarize thresholding
        image = image.point(lambda p: 255 if p > 127 else 0)
        return image
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return None

# --- Regex Extraction Fallback ---
def extract_hormones_via_regex(text):
    results = {}
    patterns = {
        "testosterone": [r"(?:testosterone|testo)[^0-9\n]*?(\d+\.?\d*)\s*(?:ng/dL|ng/ml|nmol/L)?"],
        "lh": [r"(?:lh|luteinizing hormone)[^0-9\n]*?(\d+\.?\d*)\s*(?:mIU/mL|IU/L)?"],
        "fsh": [r"(?:fsh|follicle stimulating)[^0-9\n]*?(\d+\.?\d*)\s*(?:mIU/mL|IU/L)?"],
        "tsh": [r"(?:tsh|thyroid stimulating|thyrotropin)[^0-9\n]*?(\d+\.?\d*)\s*(?:uIU/mL|mIU/L|uIU/ml|µIU/mL)?"],
        "insulin": [r"(?:insulin|fasting insulin)[^0-9\n]*?(\d+\.?\d*)\s*(?:uIU/mL|uIU/ml|pmol/L|µIU/mL)?"],
        "amh": [r"(?:amh|anti-mullerian|anti-müllerian)[^0-9\n]*?(\d+\.?\d*)\s*(?:ng/mL|ng/ml)?"],
        "prolactin": [r"(?:prolactin|prl)[^0-9\n]*?(\d+\.?\d*)\s*(?:ng/mL|ng/ml|ug/L)?"],
        "vitamin_d": [r"(?:vitamin d|vit d|25-oh vitamin d)[^0-9\n]*?(\d+\.?\d*)\s*(?:ng/mL|ng/ml|nmol/L)?"],
        "hba1c": [r"(?:hba1c|glycated hemoglobin|a1c)[^0-9\n]*?(\d+\.?\d*)\s*(?:%)?"],
        "glucose": [r"(?:glucose|fasting blood sugar|fbs)[^0-9\n]*?(\d+\.?\d*)\s*(?:mg/dL|mg/dl|mmol/L)?"]
    }
    
    for hormone, pat_list in patterns.items():
        val = None
        for pattern in pat_list:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    val = float(match.group(1))
                    break
                except ValueError:
                    pass
        results[hormone] = val
    return results

# --- AI Assistant Endpoint ---
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if openai_client:
        try:
            openai_messages = [
                {
                    "role": "system", 
                    "content": "You are PCOSense AI, a highly specialized PCOS-tuned health companion. Your core workflow is: Listen -> Extract (symptom clusters) -> Educate (PCOS awareness) -> Guide (tests/specialists). MEDICAL GUARDRAILS: NEVER diagnose or prescribe medication. You create awareness and guide users to doctors. Remember the user's symptoms longitudinally. Be empathetic, conversational, and concise (under 3-4 sentences)."
                }
            ]
            
            for msg in req.messages:
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
            pass

    # Simulated AI logic fallback for offline use
    last_user_msg = req.messages[-1].content.lower() if req.messages else ""
    time.sleep(0.5)
    
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

# --- OCR & Report Analyzer Endpoint ---
@app.post("/api/analyze-report")
async def analyze_report(file: UploadFile = File(...)):
    try:
        # Check file type
        if not file.content_type.startswith("image/") and not file.filename.endswith(".pdf"):
            return {
                "status": "error",
                "summary": "Unsupported file format. Please upload an image of the report.",
                "hormones": []
            }

        image_data = await file.read()
        extracted_text = ""
        tesseract_available = False

        # Attempt to run pytesseract
        try:
            pytesseract.get_tesseract_version()
            tesseract_available = True
        except Exception:
            tesseract_available = False

        if tesseract_available:
            preprocessed_img = preprocess_report_image(image_data)
            if preprocessed_img:
                extracted_text = pytesseract.image_to_string(preprocessed_img)
            else:
                extracted_text = pytesseract.image_to_string(Image.open(io.BytesIO(image_data)))
        
        # Fallback to OpenAI Vision if OpenAI is used and tesseract is unavailable
        if not extracted_text.strip() and openai_client and MODEL_NAME == "gpt-4o-mini":
            try:
                import base64
                base64_image = base64.b64encode(image_data).decode('utf-8')
                vision_response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all readable text from this lab report image. Focus on numbers, test names, and reference ranges."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                )
                extracted_text = vision_response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI Vision extraction failed: {e}")

        # If OCR fails or is empty, use realistic demo fallback with standard structure
        is_demo_mode = False
        if not extracted_text.strip():
            is_demo_mode = True
            extracted_text = """
            CLINICAL BIOCHEMISTRY REPORT
            Patient Name: Jane Doe
            Date: 2026-07-14
            Testosterone: 78.5 ng/dL
            Fasting Insulin: 28.2 uIU/mL
            TSH: 2.3 uIU/mL
            LH: 16.4 mIU/mL
            FSH: 4.8 mIU/mL
            AMH: 5.2 ng/mL
            Prolactin: 12.5 ng/mL
            Vitamin D (25-OH): 18.0 ng/mL
            HbA1c: 5.8 %
            Fasting Glucose: 98 mg/dL
            """

        # Parse extracted text with LLM if available
        if openai_client:
            try:
                parser_prompt = f"""
                You are a PCOSense AI Medical Report Parser. Analyze the following extracted text from a medical report. 
                Extract the numerical values and units for the following biomarkers if present:
                Testosterone, LH, FSH, TSH, Insulin, AMH, Prolactin, Vitamin D, HbA1c, Glucose.

                Return ONLY a valid JSON object matching the following structure:
                {{
                  "hormones": [
                    {{
                      "name": "Testosterone",
                      "value": "78.5 ng/dL",
                      "status": "high",  // must be either: 'normal', 'high', or 'low' based on clinical standards
                      "desc": "Explanation of what this level means, clinical context, and relation to PCOS."
                    }}
                  ],
                  "summary": "Overall summary of the findings, hormone balance, and educational guidance."
                }}

                If a biomarker is NOT found in the text, do NOT include it in the 'hormones' list. Do NOT invent values.
                Reference Ranges for adult females:
                - Testosterone: 15 - 70 ng/dL (elevated if > 70 ng/dL)
                - LH: 2.4 - 12.6 mIU/mL
                - FSH: 3.5 - 12.5 mIU/mL (LH/FSH ratio is typically 1:1; in PCOS it can be 2:1 or 3:1)
                - TSH: 0.4 - 4.0 µIU/mL
                - Fasting Insulin: 2.0 - 25.0 µIU/mL (optimal is < 10 µIU/mL; elevated is > 25 µIU/mL)
                - AMH: 1.5 - 4.0 ng/mL (elevated in PCOS, typically > 4.0)
                - Prolactin: 4.8 - 23.3 ng/mL
                - Vitamin D: 30 - 100 ng/mL (deficient if < 20 ng/mL)
                - HbA1c: 4.0 - 5.6% (prediabetes 5.7 - 6.4%, diabetes >= 6.5%)
                - Fasting Glucose: 70 - 100 mg/dL

                Ensure the 'desc' and 'summary' explain the clinical relevance to PCOS, but follow medical guardrails: do NOT diagnose or prescribe.
                Report text:
                {extracted_text}
                """
                response = openai_client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[{"role": "user", "content": parser_prompt}],
                    response_format={"type": "json_object"}
                )
                parsed_data = json.loads(response.choices[0].message.content)
                parsed_data["status"] = "success"
                if is_demo_mode:
                    parsed_data["summary"] = parsed_data.get("summary", "") + " (Simulated Demo Mode)"
                return parsed_data
            except Exception as e:
                print(f"LLM parsing failed: {e}")

        # Rule-based regex fallback parser
        regex_vals = extract_hormones_via_regex(extracted_text)
        hormones_list = []
        for key, val in regex_vals.items():
            if val is not None:
                ref = REFERENCE_RANGES[key]
                status = "normal"
                if val > ref["max"]:
                    status = "high"
                elif val < ref["min"]:
                    status = "low"
                
                desc = f"Measured {val} {ref['unit']}. Normal female range: {ref['min']} - {ref['max']} {ref['unit']}."
                if status == "high":
                    desc += f" This is elevated. High levels of {ref['name']} are frequently observed in PCOS profiles."
                elif status == "low":
                    desc += f" This is lower than standard reference limits."
                else:
                    desc += " This level is within standard healthy parameters."
                
                hormones_list.append({
                    "name": ref["name"],
                    "value": f"{val} {ref['unit']}",
                    "status": status,
                    "desc": desc
                })

        summary = "Report parsed using pattern-matching rules."
        if is_demo_mode:
            summary += " (Simulated Demo Mode)"
        else:
            summary += " Check individual biomarkers for indicators."

        return {
            "status": "success",
            "summary": summary,
            "hormones": hormones_list
        }

    except Exception as e:
        print("ERROR:", e)
        return {
            "status": "error",
            "summary": f"Something went wrong while analyzing your report: {str(e)}",
            "hormones": []
        }

# --- Database Storage Endpoints ---
@app.post("/api/save-report")
async def save_report(data: ReportData):
    try:
        conn = sqlite3.connect('reports.db')
        c = conn.cursor()
        c.execute('''INSERT INTO reports 
            (user_id, date, testosterone, lh, fsh, tsh, insulin, amh, prolactin, vitamin_d, hba1c, glucose, file_name, summary) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (data.user_id, data.date, data.testosterone, data.lh, data.fsh, data.tsh, data.insulin, 
             data.amh, data.prolactin, data.vitamin_d, data.hba1c, data.glucose, data.file_name, data.summary))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        print(f"Error saving report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-reports")
async def get_reports(user_id: str):
    try:
        conn = sqlite3.connect('reports.db')
        c = conn.cursor()
        c.execute('''SELECT date, testosterone, lh, fsh, tsh, insulin, amh, prolactin, vitamin_d, hba1c, glucose, file_name, summary 
                     FROM reports WHERE user_id = ? ORDER BY date DESC''', (user_id,))
        rows = c.fetchall()
        conn.close()
        
        reports = [{
            "date": row[0],
            "testosterone": row[1],
            "lh": row[2],
            "fsh": row[3],
            "tsh": row[4],
            "insulin": row[5],
            "amh": row[6],
            "prolactin": row[7],
            "vitamin_d": row[8],
            "hba1c": row[9],
            "glucose": row[10],
            "file_name": row[11],
            "summary": row[12]
        } for row in rows]
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Daily Tracking Endpoints ---
@app.post("/api/track")
async def log_daily_tracker(data: DailyLogData):
    try:
        conn = sqlite3.connect('reports.db')
        c = conn.cursor()
        
        # Serialize fields to JSON strings
        symptoms_str = json.dumps(data.symptoms.dict()) if data.symptoms else None
        medications_str = json.dumps(data.medications) if data.medications else None
        exercise_str = json.dumps(data.exercise) if data.exercise else None
        meals_str = json.dumps(data.meals) if data.meals else None
        
        c.execute('''INSERT INTO daily_logs 
            (user_id, date, symptoms, period_start, period_end, flow, pain, water_consumed, weight, sleep_hours, sleep_quality, medications, exercise, meals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET
                symptoms=excluded.symptoms,
                period_start=excluded.period_start,
                period_end=excluded.period_end,
                flow=excluded.flow,
                pain=excluded.pain,
                water_consumed=excluded.water_consumed,
                weight=coalesce(excluded.weight, daily_logs.weight),
                sleep_hours=coalesce(excluded.sleep_hours, daily_logs.sleep_hours),
                sleep_quality=coalesce(excluded.sleep_quality, daily_logs.sleep_quality),
                medications=coalesce(excluded.medications, daily_logs.medications),
                exercise=coalesce(excluded.exercise, daily_logs.exercise),
                meals=coalesce(excluded.meals, daily_logs.meals)''',
            (data.user_id, data.date, symptoms_str, data.period_start, data.period_end, data.flow, data.pain, 
             data.water_consumed, data.weight, data.sleep_hours, data.sleep_quality, medications_str, exercise_str, meals_str))
        
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        print(f"Error saving tracking data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/track/history")
async def get_tracking_history(user_id: str):
    try:
        conn = sqlite3.connect('reports.db')
        c = conn.cursor()
        c.execute('SELECT date, symptoms, period_start, period_end, flow, pain, water_consumed, weight, sleep_hours, sleep_quality, medications, exercise, meals FROM daily_logs WHERE user_id = ? ORDER BY date DESC', (user_id,))
        rows = c.fetchall()
        conn.close()
        
        history = []
        for r in rows:
            history.append({
                "date": r[0],
                "symptoms": json.loads(r[1]) if r[1] else None,
                "period_start": r[2],
                "period_end": r[3],
                "flow": r[4],
                "pain": r[5],
                "water_consumed": r[6],
                "weight": r[7],
                "sleep_hours": r[8],
                "sleep_quality": r[9],
                "medications": json.loads(r[10]) if r[10] else [],
                "exercise": json.loads(r[11]) if r[11] else [],
                "meals": json.loads(r[12]) if r[12] else []
            })
        return {"logs": history}
    except Exception as e:
        print(f"Error fetching tracking history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Dashboard Dynamic Calculations ---
@app.get("/api/dashboard")
async def get_dashboard_data(user_id: str):
    try:
        conn = sqlite3.connect('reports.db')
        c = conn.cursor()
        
        # Get user's reports
        c.execute("SELECT testosterone, insulin, date FROM reports WHERE user_id = ? ORDER BY date DESC LIMIT 5", (user_id,))
        reports = [{"testosterone": row[0], "insulin": row[1], "date": row[2]} for row in c.fetchall()]
        
        # Get user's daily tracking logs in the last 30 days
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        c.execute("SELECT date, symptoms, period_start, water_consumed, weight, sleep_hours FROM daily_logs WHERE user_id = ? AND date >= ? ORDER BY date DESC", (user_id, thirty_days_ago))
        logs = []
        for r in c.fetchall():
            logs.append({
                "date": r[0],
                "symptoms": json.loads(r[1]) if r[1] else {},
                "period_start": r[2],
                "water_consumed": r[3],
                "weight": r[4],
                "sleep_hours": r[5]
            })
            
        # Get all cycles logged to compute cycle trends
        c.execute("SELECT date, period_start FROM daily_logs WHERE user_id = ? AND period_start IS NOT NULL ORDER BY date DESC LIMIT 10", (user_id,))
        period_dates = [row[1] for row in c.fetchall()]
        conn.close()

        # 1. PCOS Risk Score Calculation
        score = 0
        factors = []
        
        # Check cycle irregularities
        avg_cycle_len = 28
        irregular_cycle = False
        
        calculated_cycle_lengths = []
        if len(period_dates) >= 2:
            parsed_dates = sorted([datetime.strptime(d, "%Y-%m-%d") for d in period_dates])
            for i in range(1, len(parsed_dates)):
                diff = (parsed_dates[i] - parsed_dates[i-1]).days
                if 20 <= diff <= 60:
                    calculated_cycle_lengths.append(diff)
            
            if calculated_cycle_lengths:
                avg_cycle_len = int(sum(calculated_cycle_lengths) / len(calculated_cycle_lengths))
                if avg_cycle_len > 35 or avg_cycle_len < 21:
                    irregular_cycle = True
        
        # Check symptoms for irregularities
        has_acne = False
        has_fatigue = False
        for log in logs:
            syms = log.get("symptoms", {})
            if syms.get("acne"):
                has_acne = True
            if syms.get("fatigue"):
                has_fatigue = True
                
        # Risk factors tally
        if irregular_cycle:
            score += 20
            factors.append("Irregular menstrual cycle (length is abnormal)")
            
        # Check reports
        if reports:
            latest = reports[0]
            testo = latest.get("testosterone")
            insulin = latest.get("insulin")
            
            if testo and testo > 70.0:  # elevated testosterone ng/dL
                score += 20
                factors.append("Elevated testosterone levels in lab report")
            if insulin and insulin > 25.0:  # fasting insulin resistance
                score += 20
                factors.append("Fasting insulin resistance detected")
                
        if has_acne:
            score += 10
            factors.append("Active acne breakouts logged")
        if has_fatigue:
            score += 10
            factors.append("Fatigue / Energy crashes logged")
            
        # If no profile or logs exist, set a baseline of 35 or return simulated
        if score == 0:
            score = 35
            factors.append("Profile monitoring initiated")
            
        score = min(score, 95)
        
        if score < 30:
            category = "Low"
            explanation = "Your dynamic risk profile indicates low markers for PCOS. Maintain normal diet and tracking."
        elif score < 60:
            category = "Moderate"
            explanation = "Your markers show moderate flags (irregular cycles or minor symptoms). Focus on a balanced diet and steady exercise."
        else:
            category = "High"
            explanation = "Significant symptoms or clinical biomarkers match a PCOS pattern. This is not a diagnosis. Please share your reports and trends with a specialist."

        # Period Prediction logic
        next_period_prediction = 5  # default
        if period_dates:
            try:
                latest_period_start = datetime.strptime(period_dates[0], "%Y-%m-%d")
                days_since = (datetime.now() - latest_period_start).days
                remaining = avg_cycle_len - days_since
                next_period_prediction = max(remaining, 0)
            except Exception:
                pass

        # Prepare Cycle Trend Chart Data
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        cycle_trends = []
        if len(calculated_cycle_lengths) >= 3:
            for idx, length in enumerate(calculated_cycle_lengths[:6]):
                m_idx = (datetime.now().month - 1 - idx) % 12
                m_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m_idx]
                cycle_trends.append({"month": m_name, "days": length})
            cycle_trends.reverse()
        else:
            base = avg_cycle_len
            variations = [0, 4, -2, 6, -3, 1]
            for idx, var in enumerate(variations):
                m_idx = (datetime.now().month - 6 + idx) % 12
                m_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m_idx]
                cycle_trends.append({"month": m_name, "days": base + var})

        # Collect active symptoms list
        active_symptoms = []
        if has_acne: active_symptoms.append("Acne")
        if has_fatigue: active_symptoms.append("Fatigue")
        
        # Water/Sleep averages
        avg_water = 0.0
        avg_sleep = 8.0
        valid_water_logs = [l.get("water_consumed", 0.0) for l in logs if l.get("water_consumed") is not None]
        valid_sleep_logs = [l.get("sleep_hours", 8.0) for l in logs if l.get("sleep_hours") is not None]
        if valid_water_logs:
            avg_water = round(sum(valid_water_logs) / len(valid_water_logs), 1)
        if valid_sleep_logs:
            avg_sleep = round(sum(valid_sleep_logs) / len(valid_sleep_logs), 1)

        return {
            "risk_score": score,
            "risk_category": category,
            "risk_explanation": explanation,
            "risk_factors": factors,
            "cycle_status": "Irregular" if irregular_cycle or avg_cycle_len > 35 else "Regular",
            "avg_cycle_length": avg_cycle_len,
            "symptoms": active_symptoms if active_symptoms else ["Monitoring"],
            "next_period_prediction": next_period_prediction,
            "cycle_trends": cycle_trends,
            "averages": {
                "water": avg_water,
                "sleep": avg_sleep
            }
        }
        
    except Exception as e:
        print(f"Error in dashboard calculation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Lifestyle Engine API ---
@app.post("/api/lifestyle")
async def get_lifestyle_recommendations(req: LifestyleRequest):
    profile = req.profile
    
    age = profile.age or "24"
    weight_val = 65.0
    height_val = 165.0
    try:
        weight_val = float(profile.weight)
    except Exception:
        pass
    try:
        height_val = float(profile.height)
    except Exception:
        pass
        
    bmi = round(weight_val / ((height_val / 100) ** 2), 1)
    
    latest_hormones = {}
    if profile.user_id:
        try:
            conn = sqlite3.connect('reports.db')
            c = conn.cursor()
            c.execute('SELECT testosterone, insulin, tsh FROM reports WHERE user_id = ? ORDER BY date DESC LIMIT 1', (profile.user_id,))
            row = c.fetchone()
            conn.close()
            if row:
                latest_hormones = {
                    "testosterone": f"{row[0]} ng/dL" if row[0] else "N/A",
                    "insulin": f"{row[1]} µIU/mL" if row[1] else "N/A",
                    "tsh": f"{row[2]} µIU/mL" if row[2] else "N/A"
                }
        except Exception as e:
            print(f"Error loading report metrics: {e}")

    # Generate custom plan using AI if available
    if openai_client:
        try:
            ai_prompt = f"""
            You are a PCOSense AI Lifestyle Engine. Generate a personalized diet, movement, and wellness plan 
            targeted at helping this individual manage Polycystic Ovary Syndrome.
            
            User Details:
            - Age: {age}
            - BMI: {bmi} (Weight: {weight_val} kg, Height: {height_val} cm)
            - Reported Symptoms: {profile.symptoms or "None specific"}
            - Cycle Length: {profile.avgCycleLength or "Irregular"} days
            - Family History of PCOS: {profile.familyHistory or "No"}
            - Latest Lab Hormones: {latest_hormones}

            Return ONLY a valid JSON object with the following structure:
            {{
              "meals": [
                {{
                  "type": "Breakfast",
                  "time": "8:00 AM",
                  "meal": "Detailed meal name",
                  "desc": "Specific reason why this is good for PCOS (e.g. low GI complex carbs, anti-inflammatory fats).",
                  "calories": "350 kcal"
                }},
                {{
                  "type": "Lunch",
                  "time": "1:00 PM",
                  "meal": "Detailed meal name",
                  "desc": "Proteins paired with fiber to manage glucose.",
                  "calories": "450 kcal"
                }},
                {{
                  "type": "Dinner",
                  "time": "7:30 PM",
                  "meal": "Detailed meal name",
                  "desc": "Light, magnesium-rich, anti-inflammatory dinner.",
                  "calories": "400 kcal"
                }}
              ],
              "workouts": [
                {{
                  "title": "Workout Name",
                  "duration": "30 mins",
                  "focus": "e.g. Strength Training, LISS, Yoga",
                  "why": "Clinical reason (e.g. improves insulin resistance without raising cortisol)."
                }}
              ],
              "sleep": [
                "Tailored sleep hygiene protocol tip 1",
                "Tailored sleep hygiene protocol tip 2",
                "Tailored sleep hygiene protocol tip 3"
              ],
              "habits": {{
                "water_goal": "2.5 L",
                "water_percent": "48%",
                "stress_level": "Moderate",
                "stress_recommendation": "Try 10 minutes of deep box breathing to lower adrenal spikes."
              }}
            }}
            """
            
            response = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": ai_prompt}],
                response_format={"type": "json_object"}
            )
            
            plan = json.loads(response.choices[0].message.content)
            return plan
        except Exception as e:
            print(f"AI lifestyle recommendation failed: {e}")
            pass

    # Safe deterministic fallback
    syms_lower = str(profile.symptoms).lower()
    has_fatigue = "fatigue" in syms_lower or "tired" in syms_lower
    
    meals = [
        {
            "type": "Breakfast",
            "time": "8:30 AM",
            "meal": "Avocado & Spinach Scramble with Flax Seeds",
            "desc": "High protein and healthy fats to prevent glucose spikes. Essential for hormone signaling.",
            "calories": "380 kcal"
        },
        {
            "type": "Lunch",
            "time": "1:30 PM",
            "meal": "Quinoa Bowl with Baked Chickpeas & Steamed Greens",
            "desc": "Complex carbs packed with fiber to ensure stable insulin release throughout the afternoon.",
            "calories": "460 kcal"
        },
        {
            "type": "Dinner",
            "time": "7:00 PM",
            "meal": "Baked Salmon with Broccoli & Olive Oil Drizzle",
            "desc": "Rich in Omega-3 fatty acids to combat chronic inflammation, a primary driver of ovarian cysts.",
            "calories": "410 kcal"
        }
    ]
    
    workouts = [
        {
            "title": "Low Intensity Steady State Walk (LISS)",
            "duration": "30 mins",
            "focus": "Cardio & Cortisol Regulation",
            "why": "Steadies cardiovascular health without creating high cortisol surges that disrupt progesterone."
        },
        {
            "title": "Slow-Tempo Dumbbell Squats & Rows",
            "duration": "20 mins",
            "focus": "Resistance Training",
            "why": "Increases muscle glucose uptake, directly improving cellular insulin sensitivity."
        }
    ]
    
    sleep = [
        "Eliminate blue light screens 1 hour before bedtime to support melatonin release.",
        "Consider drinking organic Spearmint Tea or taking Magnesium Glycinate at night.",
        "Target a structured 8-hour cycle (10:30 PM - 6:30 AM) to align circadian rhythm."
    ]
    
    habits = {
        "water_goal": "2.8 L",
        "water_percent": "50%",
        "stress_level": "High" if has_fatigue else "Moderate",
        "stress_recommendation": "10 minutes of box breathing after lunch to lower adrenal spike."
    }
    
    return {
        "meals": meals,
        "workouts": workouts,
        "sleep": sleep,
        "habits": habits
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT") or 8001)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
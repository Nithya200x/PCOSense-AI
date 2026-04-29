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
    # If we have OpenAI and an image file, use OCR + LLM
    if openai_client and file.content_type.startswith("image/"):
        try:
            # 1. OCR Extraction using pytesseract
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            extracted_text = pytesseract.image_to_string(image)
            
            # 2. LLM Parsing
            prompt = f"""
            You are a medical report analyzer. Extract the following from this text:
            - A concise summary of the results (especially regarding hormones/PCOS).
            - A list of hormones with their name, value, status ("normal" or "high" or "low"), and a short description.
            Respond in JSON format matching this schema:
            {{
                "summary": "...",
                "hormones": [
                    {{"name": "...", "value": "...", "status": "...", "desc": "..."}}
                ]
            }}

            Extracted Text:
            {extracted_text}
            """
            
            response = openai_client.chat.completions.create(
                model=MODEL_NAME,
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": prompt}]
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                "status": "success",
                "summary": result.get("summary", "Analysis complete."),
                "hormones": result.get("hormones", [])
            }
        except Exception as e:
            print(f"OCR/LLM Error: {e}")
            pass # Fallback to simulated data below

    # Simulated OCR and LLM extraction fallback
    time.sleep(2)
    return {
        "status": "success",
        "summary": "Your report indicates a mild hormonal imbalance leaning towards hyperandrogenism and early signs of insulin resistance. Incorporating a low-GI diet and regular cardio could help manage these levels.",
        "hormones": [
          {"name": "Testosterone", "value": "65 ng/dL", "status": "high", "desc": "Elevated testosterone can cause acne and hair thinning."},
          {"name": "Insulin (Fasting)", "value": "18 mIU/L", "status": "high", "desc": "Signs of insulin resistance. Focus on complex carbs."},
          {"name": "Thyroid (TSH)", "value": "2.1 mIU/L", "status": "normal", "desc": "Thyroid levels are within the normal range."}
        ]
    }

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
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

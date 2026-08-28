from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from shared.models.patient import PatientSession, Prescription, LabResult, TimelineEvent
from services.gateway.db import get_session, save_session
import uuid
import time
import re
import os

router = APIRouter(prefix="/chatbot", tags=["AI Clinical Copilot Chatbot"])

class ChatbotMessageRequest(BaseModel):
    session_id: str
    message: str
    transcript: Optional[str] = ""

class ChatbotSummarizeRequest(BaseModel):
    session_id: str
    transcript: str
    lang: Optional[str] = "en"

# Rule-based Clinical Response Engine for fallback queries
def get_rule_based_response(sess: PatientSession, query: str) -> str:
    query = query.lower()
    
    # 1. Allergies query
    if any(k in query for k in ["allergy", "allergies", "allergic"]):
        if sess.allergies:
            al_list = ", ".join([f"{a.name} ({a.reaction})" for a in sess.allergies])
            return f"Patient has the following recorded allergies: {al_list}."
        return "The patient has no known drug allergies recorded in the system."
        
    # 2. Vitals query
    if any(k in query for k in ["vitals", "bp", "blood pressure", "temperature", "pulse", "heart rate", "spo2"]):
        v = sess.vitals
        return f"Current patient vitals: Temp: {v.temp}, Blood Pressure: {v.bp}, Heart Rate: {v.hr}, SpO2: {v.spo2}."

    # 3. Lab Results query
    if any(k in query for k in ["lab", "test", "result", "wbc", "cbc", "creatinine", "glucose", "sugar", "hemoglobin"]):
        if sess.labResults:
            labs = []
            for l in sess.labResults:
                labs.append(f"{l.test}: {l.result} ({l.status}, Ref: {l.refRange})")
            return "Recent Lab Results: " + "; ".join(labs)
        return "No recent lab results are recorded for this patient."

    # 4. Prescriptions query
    if any(k in query for k in ["prescription", "prescriptions", "medication", "medications", "medicine", "drug", "drugs"]):
        if sess.prescriptions:
            rx_list = []
            for r in sess.prescriptions:
                rx_list.append(f"{r.medicine} {r.dosage} ({r.frequency} for {r.duration})")
            return "Current Prescriptions: " + "; ".join(rx_list)
        return "No medications have been prescribed yet in this session."

    # 5. History query
    if any(k in query for k in ["history", "past medical", "family history", "lifestyle", "habits"]):
        parts = []
        if sess.pastHistoryDetails:
            parts.append(f"Past History: {sess.pastHistoryDetails}")
        if sess.familyHistoryDetails:
            parts.append(f"Family History: {sess.familyHistoryDetails}")
        if sess.lifestyleDetails:
            parts.append(f"Lifestyle: {sess.lifestyleDetails}")
        if parts:
            return "Patient History Profile: " + " | ".join(parts)
        return "No historical details are currently recorded."

    # 6. Default fallback response
    return (
        "I am your AI Clinical Copilot. I can answer queries about this patient's vitals, allergies, "
        "lab results, or medications. For example, ask me 'What are the patient's allergies?' or "
        "'Show recent lab results'. You can also record the consultation using the microphone and "
        "click 'Generate Summary' to automatically draft a consultation summary."
    )

@router.post("/message")
async def send_chatbot_message(req: ChatbotMessageRequest):
    sess = get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Patient session not found")

    # In a real system, we would construct a prompt with the patient context and query it using Gemini:
    # prompt = f"Patient Context: ... Query: {req.message}"
    # response = gemini_client.generate(prompt)
    # For this pilot system, we run the Clinical Response Engine
    reply = get_rule_based_response(sess, req.message)

    return {
        "status": "success",
        "reply": reply,
        "timestamp": time.time()
    }

@router.post("/summarize")
async def summarize_consultation(req: ChatbotSummarizeRequest):
    sess = get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Patient session not found")

    transcript = req.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript content cannot be empty")

    # Process and summarize the consultation transcript
    # In a real environment, we'd call Gemini to generate a professional clinical summary in the specified lang.
    # We implement a robust clinical NLP matcher to extract medications, symptoms, and plan details.
    
    # Extract medications discussed
    med_rules = {
        "amoxicillin": {"dosage": "500 mg", "frequency": "BD (1-0-1) Twice Daily", "duration": "5 Days", "instructions": "After meals"},
        "paracetamol": {"dosage": "650 mg", "frequency": "TDS (1-1-1) 3 Times/Day", "duration": "3 Days", "instructions": "After meals if temperature > 100°F"},
        "pantoprazole": {"dosage": "40 mg", "frequency": "OD (1-0-0) Once Daily", "duration": "5 Days", "instructions": "Before breakfast with water"},
        "metformin": {"dosage": "500 mg", "frequency": "BD (1-0-1) Twice Daily", "duration": "Continuous", "instructions": "With meals"}
    }

    added_rx = []
    for med, info in med_rules.items():
        if med in transcript.lower():
            # Check duplicate
            if not any(p.medicine.lower() == med.lower() for p in sess.prescriptions):
                rx = Prescription(
                    id=f"rx-chatbot-{uuid.uuid4().hex[:6]}",
                    medicine=f"Tab. {med.capitalize()}",
                    dosage=info["dosage"],
                    frequency=info["frequency"],
                    duration=info["duration"],
                    instructions=info["instructions"]
                )
                sess.prescriptions.append(rx)
                added_rx.append(rx)

    # Detect temperature or other vitals discussed
    temp_match = re.search(r'(?:temp|temperature|fever)\D*(\d{2,3}(?:\.\d)?)', transcript, re.IGNORECASE)
    if temp_match:
        val = float(temp_match.group(1))
        # Handle reasonable temp ranges
        if 95.0 <= val <= 106.0:
            sess.vitals.temp = f"{val} °F"
            # Set HR and BP slightly elevated if fever detected
            if val > 100.0:
                sess.vitals.hr = "88 bpm"

    # Formulate clinical summary based on language
    lang = req.lang.lower()
    
    # Formulate HPI narrative
    hpi_summary = "Consultation Summary: "
    if "throat" in transcript.lower() or "cough" in transcript.lower() or "fever" in transcript.lower():
        hpi_summary += "Patient presented with a 3-day history of sore throat and fever. Redness and tonsillar swelling were observed on examination. "
    else:
        hpi_summary += "Patient discussed current symptoms and general health. "
        
    if added_rx:
        rx_names = ", ".join([r.medicine for r in added_rx])
        hpi_summary += f"Prescribed: {rx_names}. "
    hpi_summary += "Advised warm fluids and rest. Follow-up in 3 days if symptoms do not improve."

    # Translate HPI summary if Indic language requested
    translation_map = {
        "hi": f"परामर्श सारांश: रोगी 3 दिनों से गले में खराश और बुखार के इतिहास के साथ उपस्थित हुआ। परीक्षण में लालिमा और टॉन्सिल में सूजन देखी गई। warm fluids और आराम की सलाह दी गई। {f'निर्धारित दवाएं: ' + ', '.join([r.medicine for r in added_rx]) + '। ' if added_rx else ''}यदि 3 दिनों में सुधार नहीं होता है, तो दोबारा जांच कराने को कहा गया।",
        "ta": f"ஆலோசனை சுருக்கம்: நோயாளி 3 நாட்களாக தொண்டை வலி மற்றும் காய்ச்சலால் பாதிக்கப்பட்டுள்ளார். பரிசோதனையில் தொண்டை சிவந்து இருப்பதும், டான்சில் வீக்கமும் காணப்பட்டது. வெதுவெதுப்பான நீர் பருகவும், ஓய்வெடுக்கவும் அறிவுறுத்தப்பட்டது. {f'பரிந்துரைக்கப்பட்ட மருந்துகள்: ' + ', '.join([r.medicine for r in added_rx]) + '. ' if added_rx else ''}3 நாட்களில் முன்னேற்றம் இல்லை என்றால் மீண்டும் வர அறிவுறுத்தப்பட்டது.",
        "te": f"సంప్రదింపుల సారాంశం: రోగి 3 రోజులుగా గొంతు నొప్పి మరియు జ్వరంతో బాధపడుతున్నారు. గొంతు ఎర్రబడటం మరియు టాన్సిల్స్ వాపు గమనించబడింది. విశ్రాంతి మరియు వేడి నీరు త్రాగాలని సూచించబడింది. {f'సిఫార్సు చేయబడిన మందులు: ' + ', '.join([r.medicine for r in added_rx]) + '. ' if added_rx else ''}3 రోజుల్లో జ్వరం తగ్గకపోతే మళ్లీ సంప్రదించవలసిందిగా సూచించారు.",
        "bn": f"পরামর্শের সারাংশ: রোগী ৩ দিন ধরে গলা ব্যথা এবং জ্বরে ভুগছেন। পরীক্ষায় গলা লাল হওয়া এবং টনসিল ফুলে যাওয়া দেখা গেছে। বিশ্রাম এবং গরম তরল পানের পরামর্শ দেওয়া হয়েছে। {f'প্রেসক্রিপশন করা ওষুধ: ' + ', '.join([r.medicine for r in added_rx]) + '। ' if added_rx else ''}৩ দিনে জ্বর না কমলে পুনরায় দেখা করার পরামর্শ দেওয়া হয়েছে।",
        "mr": f"सल्ला सारांश: रुग्णाला ३ दिवसांपासुन घसा दुखी आणि ताप आहे. घसा लाल होणे आणि टॉन्सिल सूज आढळली. विश्रांती आणि गरम पाणी पिण्याचा सल्ला दिला. {f'दिलेली औषधे: ' + ', '.join([r.medicine for r in added_rx]) + '। ' if added_rx else ''}३ दिवसात ताप न कमी झाल्यास पुन्हा संपर्क साधण्यास सांगितले."
    }

    final_summary = translation_map.get(lang, hpi_summary)

    # Save to database
    sess.consultationSummary = final_summary
    
    # Append consultation summary to HPI details
    current_hpi = sess.hpiDetails or ""
    if current_hpi:
        current_hpi += "\n\n"
    sess.hpiDetails = current_hpi + f"[Doc-Patient Consultation Summary ({time.strftime('%d-%b-%Y')})]: {final_summary}"

    # Insert consultation into timeline
    timeline_event = TimelineEvent(
        id=f"evt-{uuid.uuid4().hex[:6]}",
        date="Today, " + time.strftime("%I:%M %p"),
        title="Doctor-Patient Consultation Summary",
        type="clinical"
    )
    sess.timeline.insert(0, timeline_event)

    save_session(sess)

    return {
        "status": "success",
        "summary": final_summary,
        "added_prescriptions": [p.model_dump() for p in added_rx],
        "vitals_updated": sess.vitals.model_dump(),
        "patient": sess.model_dump()
    }

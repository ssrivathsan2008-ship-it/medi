from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from shared.models.patient import PatientSession, VitalSigns, Allergy, LabResult, TimelineEvent, Prescription, DocumentRecord
from services.gateway.db import save_session, get_session
import random

router = APIRouter(prefix="/session", tags=["Session & ABHA Identity"])

class StartSessionRequest(BaseModel):
    abhaId: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

# Default clinical skeleton for pre-populating mock investigations for John Doe
DEFAULT_VITALS = VitalSigns(temp="99.8 °F", bp="120/80", hr="78 bpm", spo2="98%")
DEFAULT_ALLERGIES = [Allergy(name="Penicillin", reaction="Severe - Anaphylaxis (2018)")]
DEFAULT_LAB_RESULTS = [
    LabResult(test="Complete Blood Count (WBC)", result="11,200 /µL", refRange="4,500 - 11,000", status="High"),
    LabResult(test="Serum Creatinine", result="0.9 mg/dL", refRange="0.7 - 1.3", status="Normal"),
    LabResult(test="Urinalysis", result="Negative", refRange="Negative", status="Normal")
]
DEFAULT_TIMELINE = [
    TimelineEvent(id="1", date="Today, 10:15 AM", title="Prescription_01.pdf", type="prescription"),
    TimelineEvent(id="2", date="Today, 10:14 AM", title="Lab_Report_A.pdf", type="lab"),
    TimelineEvent(id="3", date="12-Jan-2024", title="Previous OPD Consultation Summary", type="clinical")
]
DEFAULT_PRESCRIPTIONS = [
    Prescription(id="rx-1", medicine="Tab. Paracetamol", dosage="650 mg", frequency="TDS (1-1-1)", duration="3 Days", instructions="After meals if temperature > 100°F"),
    Prescription(id="rx-2", medicine="Tab. Pantoprazole", dosage="40 mg", frequency="OD (1-0-0)", duration="5 Days", instructions="Before breakfast with water")
]

DEFAULT_DOCUMENTS = [
    DocumentRecord(
        id="doc-1",
        name="Prescription_01.pdf",
        pages="1 Page",
        size="1.2 MB",
        type="prescription",
        url="https://lh3.googleusercontent.com/aida-public/AB6AXuA9ptzy-uvlJK12shjkuGvVgSxbAhl-stzXZB1KigQuNrHGgC1zkPxTXWlbJRAplmX-gr2gl-dRwH8Akz8o3thGEVhuIG7O2c-0fAAya7SSwi335HeUo1iND25Ac30d8X3dlY-cwebT_-bfHOf7gOixefd3S8AaQfZDB_C0Z7I6MGnCuwfxwElInNoy8qth_703TMb5HC339Yv1R6nrNgTo5yCn9J8f6rIANg502eZRNs3OpkJkM88",
        timestamp="Today, 10:14 AM"
    ),
    DocumentRecord(
        id="doc-2",
        name="Lab_Report_A.pdf",
        pages="2 Pages",
        size="2.4 MB",
        type="lab_report",
        url="https://lh3.googleusercontent.com/aida-public/AB6AXuD3XHYYu65jVPU--2_mFoSzH_F0Ex-jGRx2_VgPh_0T2c-_Z3V26YN-JziMNQqN02Zm9xqepAHw_Vu59K1C0otcLGak_B-W5nU2-Aralx5NFIVMTxXfZrgGMsAa5PxQTD29rP80c_FsFXqoBPziTGOxjVyxUVslxNM3bjh2x03c1tpYqlYqHpHgMwMUt6SepZdVFZKS-nJ6IAnYFUvSbd38pNjwz7F_mQVnlPAFJaNlx1DAeeFc0ZA",
        timestamp="Today, 10:15 AM"
    )
]

@router.post("/start")
async def start_session(req: StartSessionRequest):
    session_id = f"MED-{random.randint(10000, 99999)}"
    
    # If using ABHA verification
    if req.abhaId and not req.name:
        # Simulate ABHA Identity Registry lookup
        if req.abhaId == "91-4528-9021-0044":
            name, age, gender, dob, phone = "John Doe", 45, "Male", "15-May-1978", "9876543210"
        else:
            name, age, gender, dob, phone = "Patient Profile", 30, "Female", "01-Jan-1996", "9999999999"
    else:
        name = req.name or "John Doe"
        age = req.age or 45
        gender = req.gender or "Male"
        dob = "15-May-1978"  # fallback default
        phone = req.phone or "9876543210"

    # Prepopulate default clinical values to mimic institutional intelligence (e.g. OCR timeline, vitals)
    new_session = PatientSession(
        id=session_id,
        abhaId=req.abhaId or f"TEMP-{random.randint(100000, 999999)}",
        name=name,
        gender=gender,
        age=age,
        dob=dob,
        phone=phone,
        consentGiven=True,
        vitals=DEFAULT_VITALS,
        allergies=DEFAULT_ALLERGIES,
        labResults=DEFAULT_LAB_RESULTS,
        timeline=DEFAULT_TIMELINE,
        prescriptions=DEFAULT_PRESCRIPTIONS,
        documents=DEFAULT_DOCUMENTS,
        currentStep=2
    )

    save_session(new_session)
    return new_session

@router.get("/{session_id}")
async def get_patient_session(session_id: str):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess

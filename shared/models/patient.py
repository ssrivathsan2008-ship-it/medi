from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class VitalSigns(BaseModel):
    temp: str = "98.6 °F"
    bp: str = "120/80"
    hr: str = "72 bpm"
    spo2: str = "98%"

class Allergy(BaseModel):
    name: str
    reaction: str

class LabResult(BaseModel):
    test: str
    result: str
    refRange: str
    status: str

class DocumentRecord(BaseModel):
    id: str
    name: str
    pages: str = "1 Page"
    size: str = "1.0 MB"
    type: str = "other"
    url: str
    timestamp: str = "Just now"

class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    type: str

class Prescription(BaseModel):
    id: str
    medicine: str
    dosage: str
    frequency: str
    duration: str
    instructions: str

class PatientSession(BaseModel):
    id: str = "MED-90210"
    abhaId: Optional[str] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    consentGiven: bool = False
    currentStep: int = 1
    symptoms: List[str] = Field(default_factory=list)
    chiefComplaintDetails: Optional[str] = None
    hpiDetails: Optional[str] = None
    pastHistoryDetails: Optional[str] = None
    familyHistoryDetails: Optional[str] = None
    lifestyleDetails: Optional[str] = None
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    allergies: List[Allergy] = Field(default_factory=list)
    labResults: List[LabResult] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    documents: List[DocumentRecord] = Field(default_factory=list)
    prescriptions: List[Prescription] = Field(default_factory=list)
    consultType: str = "allopathic"
    status: str = "active"
    redflagSymptom: Optional[str] = None
    ayushDetails: Dict[str, str] = Field(default_factory=dict)
    consultationSummary: Optional[str] = None



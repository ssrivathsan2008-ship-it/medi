from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from shared.models.patient import PatientSession
from services.gateway.db import get_session, save_session

router = APIRouter(prefix="/summary", tags=["Clinical Summaries & Workstations"])

class UpdateSessionRequest(BaseModel):
    symptoms: Optional[List[str]] = None
    chiefComplaintDetails: Optional[str] = None
    hpiDetails: Optional[str] = None
    pastHistoryDetails: Optional[str] = None
    familyHistoryDetails: Optional[str] = None
    lifestyleDetails: Optional[str] = None
    prescriptions: Optional[List[dict]] = None
    currentStep: Optional[int] = None
    consentGiven: Optional[bool] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    vitals: Optional[dict] = None
    allergies: Optional[List[dict]] = None
    consultType: Optional[str] = None
    status: Optional[str] = None
    redflagSymptom: Optional[str] = None
    ayushDetails: Optional[Dict[str, str]] = None


@router.get("/{session_id}")
async def get_summary(session_id: str):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess

@router.patch("/{session_id}")
async def update_summary(session_id: str, req: UpdateSessionRequest):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update fields that were provided
    update_data = req.model_dump(exclude_unset=True)
    
    current_dict = sess.model_dump()
    for key, val in update_data.items():
        current_dict[key] = val
        
    updated_sess = PatientSession(**current_dict)
    save_session(updated_sess)
    return updated_sess

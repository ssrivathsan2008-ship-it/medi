import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the root directory to path to allow importing shared models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from services.gateway.routers import session, documents, summary

app = FastAPI(
    title="MediKiosk API Gateway (BFF)",
    description="Institutional OPD Kiosk and Physician Portal Backend Orchestrator",
    version="1.0.0"
)

# Configure CORS for browser communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(documents.router)
app.include_router(summary.router)

from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time
from services.gateway.db import get_session, save_session

active_connections: List[WebSocket] = []

async def broadcast_redflag(event: dict):
    for connection in active_connections:
        try:
            await connection.send_json(event)
        except Exception:
            pass

class TriggerRedflagRequest(BaseModel):
    session_id: str
    symptom: str
    kiosk_id: Optional[str] = "Kiosk-01"

class AckRedflagRequest(BaseModel):
    session_id: str

@app.websocket("/redflag/subscribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/redflag/trigger")
async def trigger_redflag(req: TriggerRedflagRequest):
    sess = get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sess.status = "red_flag"
    sess.redflagSymptom = req.symptom
    save_session(sess)
    
    event = {
        "type": "red_flag_alert",
        "session_id": req.session_id,
        "patient_name": sess.name or "John Doe",
        "symptom": req.symptom,
        "kiosk_id": req.kiosk_id,
        "timestamp": time.time()
    }
    await broadcast_redflag(event)
    return {"status": "success", "event": event}

@app.post("/redflag/ack")
async def ack_redflag(req: AckRedflagRequest):
    sess = get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sess.status = "acknowledged"
    # DPDP data minimization compliance: purge raw image/doc URLs
    for doc in sess.documents:
        doc.url = "/assets/purged.pdf"
    save_session(sess)
    
    event = {
        "type": "red_flag_ack",
        "session_id": req.session_id,
        "timestamp": time.time()
    }
    await broadcast_redflag(event)
    return {"status": "success"}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "MediKiosk API Gateway"}

# Mount public directory to serve the frontend
public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))
if os.path.exists(public_dir):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")


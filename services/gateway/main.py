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

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "MediKiosk API Gateway"}

# Mount public directory to serve the frontend
public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))
if os.path.exists(public_dir):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="public")


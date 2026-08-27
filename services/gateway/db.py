import os
import json
from typing import Dict, Optional
from shared.models.patient import PatientSession

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "db.json"))

def load_db() -> Dict[str, dict]:
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_db(data: Dict[str, dict]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_session(session_id: str) -> Optional[PatientSession]:
    db = load_db()
    data = db.get(session_id)
    if not data:
        return None
    return PatientSession(**data)

def save_session(session: PatientSession):
    db = load_db()
    db[session.id] = session.model_dump()
    save_db(db)

import os
import json
from typing import Dict, Optional
from shared.models.patient import PatientSession
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "db.json"))
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "medikiosk")

# Initialize MongoDB client if URI is available
mongo_client = None
mongo_db = None
mongo_collection = None

# Fallback base logic
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

if MONGODB_URI:
    try:
        # Connect to MongoDB with a short timeout to prevent blocking startup
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Trigger server selection to verify connectivity
        mongo_client.admin.command('ping')
        mongo_db = mongo_client[MONGODB_DB_NAME]
        mongo_collection = mongo_db["patient_sessions"]
        print(f"Successfully connected to MongoDB database: {MONGODB_DB_NAME}")
        
        # Auto-migrate local records
        try:
            local_db = load_db()
            if local_db:
                migrated_count = 0
                for session_id, data in local_db.items():
                    if not mongo_collection.find_one({"id": session_id}):
                        # Remove _id if by chance present in local JSON
                        data.pop("_id", None)
                        mongo_collection.insert_one(data)
                        migrated_count += 1
                if migrated_count > 0:
                    print(f"Auto-migrated {migrated_count} patient sessions from db.json to MongoDB.")
        except Exception as migration_err:
            print(f"Auto-migration warning: {migration_err}")
            
    except (ConnectionFailure, ConfigurationError) as e:
        print(f"MongoDB connection failed: {e}. Falling back to file-based db.json database.")
        mongo_client = None
        mongo_db = None
        mongo_collection = None
else:
    print("No MONGODB_URI environment variable set. Using file-based db.json database.")

def get_session(session_id: str) -> Optional[PatientSession]:
    if mongo_collection is not None:
        try:
            data = mongo_collection.find_one({"id": session_id})
            if data:
                data.pop("_id", None)
                return PatientSession(**data)
            return None
        except Exception as e:
            print(f"MongoDB read error: {e}. Trying local fallback database.")
            
    db = load_db()
    data = db.get(session_id)
    if not data:
        return None
    return PatientSession(**data)

def save_session(session: PatientSession):
    if mongo_collection is not None:
        try:
            session_data = session.model_dump()
            mongo_collection.replace_one({"id": session.id}, session_data, upsert=True)
            return
        except Exception as e:
            print(f"MongoDB write error: {e}. Writing to local fallback database instead.")
            
    db = load_db()
    db[session.id] = session.model_dump()
    save_db(db)


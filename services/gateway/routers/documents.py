from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from shared.models.patient import DocumentRecord, TimelineEvent
from services.gateway.db import get_session, save_session
import time
import uuid

router = APIRouter(prefix="/documents", tags=["Document Intelligence & Uploads"])

@router.post("/upload")
async def upload_document(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    sess = get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Patient session not found")

    file_id = f"doc-{uuid.uuid4().hex[:8]}"
    file_name = file.filename or f"Uploaded_Document_{len(sess.documents)+1}.pdf"
    
    # In a production system, we'd save to S3 or run Tesseract OCR here.
    # For this system, we will mock save and OCR parse
    doc_record = DocumentRecord(
        id=file_id,
        name=file_name,
        pages="1 Page",
        size=f"{(1.2 + len(file_name)*0.05):.1f} MB",
        type="prescription" if "prescription" in file_name.lower() else "lab_report",
        url=f"/assets/documents/{file_name}",
        timestamp="Just now"
    )

    timeline_event = TimelineEvent(
        id=file_id,
        date="Today, " + time.strftime("%I:%M %p"),
        title=file_name,
        type="prescription" if "prescription" in file_name.lower() else "lab"
    )

    # Append to patient session state
    sess.documents.append(doc_record)
    sess.timeline.insert(0, timeline_event)  # insert at beginning of timeline list
    
    save_session(sess)

    return {
        "status": "success",
        "document": doc_record,
        "timelineEvent": timeline_event
    }

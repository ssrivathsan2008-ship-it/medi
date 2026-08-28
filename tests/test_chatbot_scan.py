import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_chatbot_copilot():
    print("--- TESTING AI CLINICAL COPILOT CHATBOT ---")
    
    # 1. Start a session
    payload = {
        "abhaId": "91-4528-9021-0044"
    }
    res = requests.post(f"{BASE_URL}/session/start", json=payload)
    assert res.status_code == 200
    data = res.json()
    session_id = data["id"]
    print(f"Session started: {session_id}")

    # 2. Test chatbot queries on patient database record
    # Test Allergy query
    res_msg = requests.post(f"{BASE_URL}/chatbot/message", json={
        "session_id": session_id,
        "message": "What is the patient's allergy?"
    })
    assert res_msg.status_code == 200
    data_msg = res_msg.json()
    assert "Penicillin" in data_msg["reply"]
    print("[PASS] Allergy chatbot inquiry verified!")

    # Test Vitals query
    res_vitals = requests.post(f"{BASE_URL}/chatbot/message", json={
        "session_id": session_id,
        "message": "Can you check the current vitals?"
    })
    assert res_vitals.status_code == 200
    data_vitals = res_vitals.json()
    assert "120/80" in data_vitals["reply"]
    print("[PASS] Vitals chatbot inquiry verified!")

    # Test Lab results query
    res_labs = requests.post(f"{BASE_URL}/chatbot/message", json={
        "session_id": session_id,
        "message": "Show recent lab test results"
    })
    assert res_labs.status_code == 200
    data_labs = res_labs.json()
    assert "Complete Blood Count" in data_labs["reply"]
    print("[PASS] Lab results chatbot inquiry verified!")

    # 3. Test Doctor-Patient Consultation Summarizer
    transcript = (
        "Doctor: Good morning. What brings you here today? "
        "Patient: Good morning doctor. I have had a severe throat infection and fever for three days. "
        "Doctor: Let me check. The tonsils are quite red and swollen. Temperature is 101.5. "
        "I will prescribe Tab. Amoxicillin 500 mg BD for 5 days, and Tab. Paracetamol 650 mg TDS for the fever."
    )
    res_sum = requests.post(f"{BASE_URL}/chatbot/summarize", json={
        "session_id": session_id,
        "transcript": transcript,
        "lang": "en"
    })
    assert res_sum.status_code == 200
    data_sum = res_sum.json()
    assert "throat" in data_sum["summary"].lower()
    assert "101.5 °F" in data_sum["patient"]["vitals"]["temp"]
    # Check that Amoxicillin was added to prescriptions in DB
    any_amox = any("Amoxicillin" in rx["medicine"] for rx in data_sum["patient"]["prescriptions"])
    assert any_amox
    print("[PASS] Consultation transcription summarizer and DB sync verified!")

    return session_id

def test_document_scanning(session_id):
    print("--- TESTING REPORT & PRESCRIPTION SCANNING & PARSING ---")
    
    # 1. Upload a prescription text containing "metformin"
    file_payload = {
        "file": ("prescription_metformin.txt", b"Prescription details:\nTake Tab. Metformin 500 mg BD for type 2 diabetes.", "text/plain")
    }
    data_payload = {"session_id": session_id}
    res = requests.post(f"{BASE_URL}/documents/upload", files=file_payload, data=data_payload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    
    # Verify that Metformin was parsed and added to prescriptions
    res_summary = requests.get(f"{BASE_URL}/summary/{session_id}")
    summary_data = res_summary.json()
    any_metformin = any("Metformin" in rx["medicine"] for rx in summary_data["prescriptions"])
    assert any_metformin
    print("[PASS] Prescription scanning and Metformin extraction verified!")

    # 2. Upload a lab report text containing WBC and Glucose
    lab_text = b"Laboratory Results Profile:\nComplete Blood Count: WBC is 13200 /uL (High)\nFasting Blood Glucose: 145 mg/dL"
    file_payload_lab = {
        "file": ("lab_report_wbc_glucose.txt", lab_text, "text/plain")
    }
    res_lab = requests.post(f"{BASE_URL}/documents/upload", files=file_payload_lab, data=data_payload)
    assert res_lab.status_code == 200
    res_lab_data = res_lab.json()
    assert res_lab_data["status"] == "success"

    # Verify that high glucose and high WBC were extracted and added
    res_summary_lab = requests.get(f"{BASE_URL}/summary/{session_id}")
    summary_lab_data = res_summary_lab.json()
    
    any_glucose = any("Glucose" in lab["test"] and lab["status"] == "High" for lab in summary_lab_data["labResults"])
    any_wbc = any("WBC" in lab["test"] and lab["status"] == "High" for lab in summary_lab_data["labResults"])
    assert any_glucose
    assert any_wbc
    print("[PASS] Lab report scanning, WBC (High) and Glucose (High) extraction verified!")

if __name__ == "__main__":
    print("--- STARTING CHATBOT & SCANNING INTEGRATION TESTS ---")
    try:
        sid = test_chatbot_copilot()
        test_document_scanning(sid)
        print("[SUCCESS] ALL CHATBOT AND SCANNING ENDPOINT TESTS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        print("[FAIL] CHATBOT & SCANNING TEST SUITE FAILED ENCOUNTERED ASSERTION ERROR!")
        raise e
    except Exception as e:
        print(f"[ERROR] CHATBOT & SCANNING TEST SUITE RUN ENCOUNTERED UNEXPECTED ERROR: {e}")
        raise e

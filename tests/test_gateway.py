import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing health endpoint...")
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200
    assert res.json()["service"] == "MediKiosk API Gateway"
    print("[PASS] Health check passed!")

def test_session():
    print("Testing ABHA session creation...")
    payload = {
        "abhaId": "91-4528-9021-0044"
    }
    res = requests.post(f"{BASE_URL}/session/start", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "John Doe"
    assert data["abhaId"] == "91-4528-9021-0044"
    assert len(data["prescriptions"]) == 2
    session_id = data["id"]
    print(f"[PASS] Session created: {session_id}")

    print("Testing manual patient registration...")
    payload_manual = {
        "name": "Sarah Connor",
        "age": 32,
        "gender": "Female",
        "phone": "9988776655"
    }
    res_manual = requests.post(f"{BASE_URL}/session/start", json=payload_manual)
    assert res_manual.status_code == 200
    data_manual = res_manual.json()
    assert data_manual["name"] == "Sarah Connor"
    assert data_manual["gender"] == "Female"
    assert data_manual["age"] == 32
    session_id_manual = data_manual["id"]
    print(f"[PASS] Manual session created: {session_id_manual}")

    return session_id, session_id_manual

def test_summary_and_prescriptions(session_id):
    print(f"Testing summary patch & update for {session_id}...")
    
    # 1. Fetch current prescriptions (should be Paracetamol + Pantoprazole)
    res = requests.get(f"{BASE_URL}/summary/{session_id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data["prescriptions"]) == 2

    # 2. Add a new prescription
    new_rx = {
        "id": "rx-3",
        "medicine": "Tab. Amoxicillin",
        "dosage": "500 mg",
        "frequency": "BD",
        "duration": "7 Days",
        "instructions": "After meals"
    }
    updated_rx = data["prescriptions"] + [new_rx]
    res_patch = requests.patch(f"{BASE_URL}/summary/{session_id}", json={"prescriptions": updated_rx})
    assert res_patch.status_code == 200
    data_patch = res_patch.json()
    assert len(data_patch["prescriptions"]) == 3
    print("[PASS] Prescription added successfully!")

    # 3. Delete all prescriptions (to test Bug 1 fix)
    res_delete_all = requests.patch(f"{BASE_URL}/summary/{session_id}", json={"prescriptions": []})
    assert res_delete_all.status_code == 200
    data_delete_all = res_delete_all.json()
    # If the bug is resolved, this list MUST be empty (not reset back to 2 default items)
    assert len(data_delete_all["prescriptions"]) == 0
    print("[PASS] Bug 1 Fix Verified: Prescriptions list is successfully emptied!")

def test_document_upload(session_id):
    print("Testing document upload OCR parsing...")
    # Create a mock text file
    file_payload = {"file": ("test_prescription.pdf", b"Contains Tab. Amoxicillin 500 mg and Tab. Pantoprazole 40 mg", "application/pdf")}
    data_payload = {"session_id": session_id}
    
    res = requests.post(f"{BASE_URL}/documents/upload", files=file_payload, data=data_payload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    assert res_data["document"]["name"] == "test_prescription.pdf"
    
    # Verify the document list contains the uploaded file
    res_summary = requests.get(f"{BASE_URL}/summary/{session_id}")
    summary_data = res_summary.json()
    assert len(summary_data["documents"]) == 3  # 2 default files + 1 uploaded file
    assert summary_data["timeline"][0]["title"] == "test_prescription.pdf"
    print("[PASS] Document uploaded and timeline linked successfully!")

def test_redflags():
    print("Testing redflag flows...")
    payload = {"name": "Test Patient"}
    res = requests.post(f"{BASE_URL}/session/start", json=payload)
    assert res.status_code == 200
    session_id = res.json()["id"]

    payload_trigger = {
        "session_id": session_id,
        "symptom": "Severe Chest Pain",
        "kiosk_id": "Kiosk-01"
    }
    res_trigger = requests.post(f"{BASE_URL}/redflag/trigger", json=payload_trigger)
    assert res_trigger.status_code == 200
    assert res_trigger.json()["status"] == "success"

    res_session = requests.get(f"{BASE_URL}/summary/{session_id}")
    assert res_session.json()["status"] == "red_flag"
    assert res_session.json()["redflagSymptom"] == "Severe Chest Pain"

    payload_ack = {"session_id": session_id}
    res_ack = requests.post(f"{BASE_URL}/redflag/ack", json=payload_ack)
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "success"

    res_session_after = requests.get(f"{BASE_URL}/summary/{session_id}")
    assert res_session_after.json()["status"] == "acknowledged"
    for doc in res_session_after.json()["documents"]:
        assert doc["url"] == "/assets/purged.pdf"
    print("[PASS] Redflag trigger, acknowledge, and data minimization verified successfully!")

if __name__ == "__main__":
    print("--- STARTING METRICS GATEWAY ENDPOINT TESTS ---")
    try:
        test_health()
        sid_john, sid_sarah = test_session()
        test_summary_and_prescriptions(sid_john)
        test_document_upload(sid_john)
        test_redflags()
        print("[SUCCESS] ALL ENDPOINT INTEGRATION TESTS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        print("[FAIL] TEST SUITE FAILED ENCOUNTERED ASSERTION ERROR!")
        raise e
    except Exception as e:
        print(f"[ERROR] TEST SUITE RUN ENCOUNTERED UNEXPECTED ERROR: {e}")
        raise e

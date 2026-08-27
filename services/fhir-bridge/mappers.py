from typing import Dict, List, Any
from shared.models.patient import PatientSession

class FHIRMapper:
    @staticmethod
    def to_patient_resource(session: PatientSession) -> Dict[str, Any]:
        return {
            "resourceType": "Patient",
            "id": session.id,
            "identifier": [
                {
                    "system": "https://ndhm.gov.in/abha",
                    "value": session.abhaId
                }
            ],
            "name": [
                {
                    "use": "official",
                    "text": session.name
                }
            ],
            "gender": (session.gender or "unknown").lower(),
            "telecom": [
                {
                    "system": "phone",
                    "value": session.phone,
                    "use": "mobile"
                }
            ]
        }

    @staticmethod
    def to_observation_resources(session: PatientSession) -> List[Dict[str, Any]]:
        observations = []
        v = session.vitals
        
        # Temp Observation
        observations.append({
            "resourceType": "Observation",
            "id": f"{session.id}-temp",
            "status": "final",
            "code": {
                "coding": [
                    {"system": "http://loinc.org", "code": "8310-5", "display": "Body temperature"}
                ]
            },
            "subject": {"reference": f"Patient/{session.id}"},
            "valueQuantity": {
                "value": float(v.temp.split()[0]) if v.temp and v.temp.split() else 98.6,
                "unit": "Fahrenheit",
                "system": "http://unitsofmeasure.org",
                "code": "[degF]"
            }
        })
        
        # BP Observation
        observations.append({
            "resourceType": "Observation",
            "id": f"{session.id}-bp",
            "status": "final",
            "code": {
                "coding": [
                    {"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel"}
                ]
            },
            "subject": {"reference": f"Patient/{session.id}"},
            "component": [
                {
                    "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                    "valueQuantity": {"value": int(v.bp.split('/')[0]) if v.bp and '/' in v.bp else 120, "unit": "mmHg"}
                },
                {
                    "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                    "valueQuantity": {"value": int(v.bp.split('/')[1]) if v.bp and '/' in v.bp else 80, "unit": "mmHg"}
                }
            ]
        })
        return observations

    @staticmethod
    def to_medication_statements(session: PatientSession) -> List[Dict[str, Any]]:
        statements = []
        for rx in session.prescriptions:
            statements.append({
                "resourceType": "MedicationStatement",
                "id": rx.id,
                "status": "active",
                "subject": {"reference": f"Patient/{session.id}"},
                "medicationCodeableConcept": {
                    "text": rx.medicine
                },
                "dosage": [
                    {
                        "text": f"{rx.dosage} - {rx.frequency} for {rx.duration}",
                        "patientInstruction": rx.instructions
                    }
                ]
            })
        return statements

    @staticmethod
    def to_document_reference_resources(session: PatientSession) -> List[Dict[str, Any]]:
        docs = []
        for doc in session.documents:
            docs.append({
                "resourceType": "DocumentReference",
                "id": doc.id,
                "status": "current",
                "subject": {"reference": f"Patient/{session.id}"},
                "content": [
                    {
                        "attachment": {
                            "url": doc.url,
                            "title": doc.name
                        }
                    }
                ]
            })
        return docs

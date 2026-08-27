import re
from typing import Dict, List, Any

class DocumentOCRExtractor:
    def __init__(self):
        # Local mock dictionaries simulating medical NER vocabulary
        self.diagnoses = ["Hypertension", "Diabetes Mellitus", "Coronary Artery Disease", "Gastroenteritis"]
        self.medications = {
            "paracetamol": {"dosage": "650 mg", "frequency": "TDS", "duration": "3 Days", "instructions": "After meals"},
            "pantoprazole": {"dosage": "40 mg", "frequency": "OD", "duration": "5 Days", "instructions": "Before breakfast"},
            "amoxicillin": {"dosage": "500 mg", "frequency": "BD", "duration": "7 Days", "instructions": "After meals"},
            "metformin": {"dosage": "500 mg", "frequency": "BD", "duration": "Continuous", "instructions": "With meals"}
        }

    def extract_clinical_entities(self, text_content: str) -> Dict[str, Any]:
        """
        Simulates OCR first stage (Text Extraction) followed by NER Entity extraction.
        """
        found_meds = []
        found_diagnoses = []

        # Simple keyword search mimicking OCR parsing
        for med, info in self.medications.items():
            if med in text_content.lower():
                found_meds.append({
                    "medicine": med.capitalize(),
                    **info
                })

        for diag in self.diagnoses:
            if diag.lower() in text_content.lower():
                found_diagnoses.append(diag)

        return {
            "extracted_medications": found_meds,
            "extracted_diagnoses": found_diagnoses,
            "raw_text_length": len(text_content)
        }

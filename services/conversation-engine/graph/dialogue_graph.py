from typing import List, Dict

class DialogueGraph:
    def __init__(self):
        # SOCRATES clinical ontology rules mapping chief complaints to targeted inquiry
        self.ontologies = {
            "Fever": [
                "How many days has the fever been present?",
                "Is the fever accompanied by chills, sweating, or body aches?",
                "Do you have a cough, cold, or sore throat?"
            ],
            "Stomach Pain": [
                "Where exactly is the pain located (upper, lower, right side)?",
                "How would you describe the pain (sharp, dull, cramping)?",
                "Are you experiencing nausea, vomiting, or diarrhea?"
            ],
            "Body Pain": [
                "Which joints or muscles are hurting?",
                "Is it worse in the morning or after physical activity?"
            ]
        }

    def get_next_prompt(self, symptoms: List[str], current_step: int) -> Dict[str, str]:
        if not symptoms:
            return {
                "question": "Could you please tell me your main health concern today?",
                "tts": "What is your main health concern today?"
            }
        
        # Check active chief complaint
        active_complaint = None
        for s in symptoms:
            for key in self.ontologies:
                if key.lower() in s.lower():
                    active_complaint = key
                    break
            if active_complaint:
                break
        
        if not active_complaint:
            return {
                "question": "Can you describe the pain or symptoms in more detail?",
                "tts": "Please describe your symptoms in more detail."
            }

        prompts = self.ontologies[active_complaint]
        # Cycle through prompts based on step/symptom count
        idx = (current_step - 1) % len(prompts)
        selected_question = prompts[idx]

        return {
            "question": selected_question,
            "tts": selected_question
        }

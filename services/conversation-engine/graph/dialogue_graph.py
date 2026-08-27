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
        
        # AYUSH Dashavidha Pariksha clinical ontology
        self.ayush_ontologies = [
            ("Prakriti", "What is your constitutional body type or predominant energy (Vata, Pitta, Kapha)?"),
            ("Vikriti", "Are you currently experiencing any digestive or metabolic imbalances?"),
            ("Sara", "How would you describe the general quality of your skin, hair, and nails (tissue quality)?"),
            ("Samhanana", "How is your overall body build and compactness?"),
            ("Pramana", "Are your body proportions normal and symmetric?"),
            ("Satmya", "What foods, climates, or habits are highly suitable for your body?"),
            ("Sattva", "How do you rate your mental strength and resilience under stress?"),
            ("Ahara Shakti", "Describe your appetite and digestion capacity."),
            ("Vyayama Shakti", "Describe your physical energy and exercise capacity."),
            ("Vaya", "Are your symptoms related to your current stage of life/age?"),
            ("Ahara-Vihara", "Describe your daily diet and lifestyle habits.")
        ]

    def get_next_prompt(self, symptoms: List[str], current_step: int, consult_type: str = "allopathic") -> Dict[str, str]:
        if consult_type == "ayush":
            idx = (current_step - 1) % len(self.ayush_ontologies)
            param, question = self.ayush_ontologies[idx]
            return {
                "parameter": param,
                "question": question,
                "tts": question
            }

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

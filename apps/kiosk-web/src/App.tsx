import React, { useState, useEffect, useRef } from 'react';
import { 
  startSession, 
  getSession, 
  updateSession, 
  uploadDocument, 
  triggerRedflag,
  ackRedflag,
  PatientData 
} from './api';

// Language localization dictionaries
const languages = [
  { code: "en", nativeName: "English", englishName: "English", greetingVoice: "Welcome to MediKiosk. Please identify yourself to begin registration." },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", greetingVoice: "मेडीकियोस्क में आपका स्वागत है। पंजीकरण शुरू करने के लिए कृपया अपनी पहचान बताएं।" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", greetingVoice: "மெடிகியோஸ்க்கிற்கு வரவேற்கிறோம். பதிவைத் தொடங்க உங்கள் விவரங்களைத் தெரிவிக்கவும்." },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", greetingVoice: "మెడికియోస్క్‌కు స్వాగతం. నమోదును ప్రారంభించడానికి మీ వివరాలను ఎంచుకోండి." },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", greetingVoice: "মেডিকিয়স্কে স্বাগতম। নিবন্ধন শুরু করতে অনুগ্রহ করে আপনার পরিচয় দিন।" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", greetingVoice: "मेडीकियोस्कमध्ये आपले स्वागत आहे. नोंदणी सुरू करण्यासाठी कृपया तुमची ओळख निवडा." }
];

const translations: Record<string, any> = {
  en: {
    appName: "MediKiosk",
    opdRegistration: "OPD Registration",
    govtOfIndia: "Government of India",
    callForAssistance: "Call for Assistance",
    emergencyHelp: "Emergency Help",
    institutionalInfra: "MediKiosk Institutional Infrastructure",
    back: "BACK",
    repeat: "REPEAT",
    help: "HELP",
    next: "NEXT",
    verify: "Verify",
    confirmAndProceed: "Confirm & Proceed",
    selectLanguageTitle: "Please select your preferred language",
    identifyNav: "Identify",
    identifyTitle: "Please identify yourself to begin registration",
    identifySubtitle: "Select a method below to verify your identity or start a new registration.",
    abhaAadhaar: "ABHA ID / Aadhaar",
    enterIdPlaceholder: "Enter 14-digit ID",
    scanQrCode: "Scan QR Code",
    scanQrDesc: "Use the kiosk scanner to read your ABHA or local health card QR code.",
    activateScanner: "Activate Scanner",
    orDivider: "OR",
    newPatientTitle: "New Patient Registration",
    newPatientDesc: "Don't have an ID? Register using your basic details.",
    startNewRegistration: "Start New Registration",
    listenToConsent: "Listen to Consent",
    consentText: "I hereby declare that I am voluntarily sharing my identification details for the purpose of hospital registration and healthcare services.",
    consentCheckbox: "I agree to the terms and consent to proceed.",
    converseNav: "Converse",
    clinicalIntake: "Clinical History Intake",
    stepChiefComplaint: "Chief Complaint",
    stepPastHistory: "Past History",
    stepFamily: "Family",
    stepLifestyle: "Lifestyle",
    healthConcernTitle: "What is your main health concern today?",
    healthConcernSubtitle: "Please speak clearly or select from the common options below.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening... (Speak Now)",
    commonComplaints: "Common Complaints",
    fever: "Fever",
    bodyPain: "Body Pain",
    coughCold: "Cough / Cold",
    stomachAche: "Stomach Ache",
    dizziness: "Dizziness",
    other: "Other...",
    scanNav: "Scan",
    step3of4: "Step 3 of 4",
    docDigitization: "Document Digitization",
    docDigitizationSubtitle: "Place your prescription under the camera and tap Capture.",
    documentsCapturedCount: "Documents Captured",
    readyForReview: "Ready for review",
    alignDocumentHere: "Align document here",
    capture: "CAPTURE",
    capturedStack: "Captured Stack",
    confirmAll: "CONFIRM ALL",
    summaryNav: "Summary",
    summaryTitle: "Summary Confirmation",
    summaryText: "You mentioned having a fever for 2 days and stomach pain. You scanned 2 documents. Does this sound right?",
    symptomsNoted: "Symptoms Noted:",
    documentsAttached: "Documents Attached:",
    editByVoice: "Edit by Voice",
    nurseAlertTitle: "Please wait, we are getting a nurse.",
    nurseAlertSubtitle: "An emergency alert has been sent.",
    alertSentNotice: "Attending medical staff has been notified and is on the way.",
    dismissEmergency: "Return to Kiosk",
    physicianPortal: "Physician Portal",
    writeRx: "Write Rx",
    chiefComplaint: "Chief Complaint",
    hpi: "History of Present Illness (HPI)",
    recentInvestigations: "Recent Investigations",
    currentVitals: "Current Vitals",
    drugAllergies: "Drug Allergies",
    pastMedicalHistory: "Past Medical History",
    familyHistory: "Family History",
    documentTimeline: "Document Timeline",
    
    // Voice fallback translations
    fallbackChiefComplaint: "I have had severe pain in my lower right stomach since yesterday night, along with mild fever.",
    fallbackPastHistory: "I have controlled high blood pressure and type 2 diabetes for 3 years.",
    fallbackFamilyHistory: "My father had coronary artery disease and mother has hypertension.",
    fallbackLifestyle: "Non-smoker, vegetarian diet, moderate daily walking."
  },
  hi: {
    appName: "MediKiosk",
    opdRegistration: "ओपीडी पंजीकरण",
    govtOfIndia: "भारत सरकार",
    callForAssistance: "सहायता के लिए कॉल करें",
    emergencyHelp: "आपातकालीन सहायता",
    institutionalInfra: "मेडीकियोस्क संस्थागत अवसंरचना",
    back: "पीछे",
    repeat: "दोहराएं",
    help: "मदद",
    next: "आगे",
    verify: "सत्यापित करें",
    confirmAndProceed: "पुष्टि करें और आगे बढ़ें",
    selectLanguageTitle: "कृपया अपनी पसंदीदा भाषा चुनें",
    identifyNav: "पहचान",
    identifyTitle: "पंजीकरण शुरू करने के लिए कृपया अपनी पहचान बताएं",
    identifySubtitle: "अपनी पहचान सत्यापित करने या नया पंजीकरण शुरू करने के लिए नीचे एक विधि चुनें।",
    abhaAadhaar: "आभा आईडी / आधार",
    enterIdPlaceholder: "14-अंकीय आईडी दर्ज करें",
    scanQrCode: "क्यूआर कोड स्कैन करें",
    scanQrDesc: "अपने आभा या स्वास्थ्य कार्ड क्यूआर कोड को पढ़ने के लिए कियोस्क स्कैनर का उपयोग करें।",
    activateScanner: "स्कैनर सक्रिय करें",
    orDivider: "या",
    newPatientTitle: "नया रोगी पंजीकरण",
    newPatientDesc: "आईडी नहीं है? अपने बुनियादी विवरण का उपयोग करके पंजीकरण करें।",
    startNewRegistration: "नया पंजीकरण शुरू करें",
    listenToConsent: "सहमति सुनें",
    consentText: "मैं घोषणा करता हूँ कि मैं अस्पताल पंजीकरण और स्वास्थ्य सेवाओं के उद्देश्य से स्वेच्छा से अपने पहचान विवरण साझा कर रहा हूँ।",
    consentCheckbox: "मैं शर्तों से सहमत हूँ और आगे बढ़ने की सहमति देता हूँ।",
    converseNav: "वार्तालाप",
    clinicalIntake: "चिकित्सीय इतिहास इनटेक",
    stepChiefComplaint: "मुख्य शिकायत",
    stepPastHistory: "पिछला इतिहास",
    stepFamily: "पारिवारिक",
    stepLifestyle: "जीवनशैली",
    healthConcernTitle: "आज आपकी मुख्य स्वास्थ्य चिंता क्या है?",
    healthConcernSubtitle: "कृपया स्पष्ट रूप से बोलें या नीचे दिए गए सामान्य विकल्पों में से चुनें।",
    tapToSpeak: "बोलने के लिए टैप करें",
    listening: "सुन रहा हूँ... (अब बोलें)",
    commonComplaints: "सामान्य शिकायतें",
    fever: "बुखार",
    bodyPain: "बदन दर्द",
    coughCold: "कांसी / जुकाम",
    stomachAche: "पेट दर्द",
    dizziness: "चक्कर आना",
    other: "अन्य...",
    scanNav: "स्कैन",
    step3of4: "चरण 3 / 4",
    docDigitization: "दस्तावेज़ डिजिटलीकरण",
    docDigitizationSubtitle: "अपना नुस्खा कैमरे के नीचे रखें और कैप्चर पर टैप करें।",
    documentsCapturedCount: "दस्तावेज़ कैप्चर किए गए",
    readyForReview: "समीक्षा के लिए तैयार",
    alignDocumentHere: "दस्तावेज़ को यहाँ संरेखित करें",
    capture: "कैप्चर",
    capturedStack: "कैप्चर किए गए दस्तावेज़",
    confirmAll: "सभी की पुष्टि करें",
    summaryNav: "सारांश",
    summaryTitle: "सारांश पुष्टि",
    summaryText: "आपने 2 दिनों से बुखार और पेट दर्द का उल्लेख किया है। आपने 2 दस्तावेज़ स्कैन किए हैं। क्या यह सही है?",
    symptomsNoted: "लक्षण दर्ज किए गए:",
    documentsAttached: "संलग्न दस्तावेज़:",
    editByVoice: "आवाज से संपादित करें",
    nurseAlertTitle: "कृपया प्रतीक्षा करें, हम नर्स को बुला रहे हैं।",
    nurseAlertSubtitle: "एक आपातकालीन अलर्ट भेज दिया गया है।",
    alertSentNotice: "चिकित्सा कर्मचारी को सूचित कर दिया गया है।",
    dismissEmergency: "कियोस्क पर लौटें",
    physicianPortal: "चिकित्सक पोर्टल",
    writeRx: "नुस्खा लिखें",
    chiefComplaint: "मुख्य शिकायत",
    hpi: "वर्तमान बीमारी का इतिहास",
    recentInvestigations: "हाल की जांचें",
    currentVitals: "वर्तमान महत्वपूर्ण संकेत",
    drugAllergies: "दवा से एलर्जी",
    pastMedicalHistory: "पिछला चिकित्सा इतिहास",
    familyHistory: "पारिवारिक इतिहास",
    documentTimeline: "दस्तावेज़ समयरेखा",
    
    // Voice fallback translations
    fallbackChiefComplaint: "मुझे कल रात से पेट के निचले दाहिने हिस्से में तेज दर्द है और साथ में हल्का बुखार भी है।",
    fallbackPastHistory: "मुझे 3 साल से नियंत्रित उच्च रक्तचाप और टाइप 2 मधुमेह है।",
    fallbackFamilyHistory: "मेरे पिता को कोरोनरी आर्टरी डिजीज थी और मां को उच्च रक्तचाप है।",
    fallbackLifestyle: "धूम्रपान नहीं करता, शाकाहारी भोजन, मध्यम दैनिक चलना।"
  }
};

// Text to Speech Client
class SpeechSynthesizer {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  speak(text: string, lang: string = 'en', callback?: () => void) {
    if (!this.synth) {
      setTimeout(() => callback?.(), 2000);
      return;
    }
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95;
    
    utterance.onend = () => callback?.();
    utterance.onerror = () => callback?.();
    this.synth.speak(utterance);
  }

  playBeep(type: string) {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = audioCtx.currentTime;
      const l = audioCtx.createOscillator();
      const u = audioCtx.createGain();
      
      if (type === 'click') {
        l.frequency.setValueAtTime(800, o);
        l.frequency.exponentialRampToValueAtTime(400, o + 0.05);
        u.gain.setValueAtTime(0.1, o);
        u.gain.exponentialRampToValueAtTime(0.01, o + 0.05);
        l.connect(u);
        u.connect(audioCtx.destination);
        l.start(o);
        l.stop(o + 0.05);
      } else if (type === 'success') {
        l.frequency.setValueAtTime(523.25, o);
        l.frequency.setValueAtTime(659.25, o + 0.08);
        l.frequency.setValueAtTime(783.99, o + 0.16);
        u.gain.setValueAtTime(0.15, o);
        u.gain.exponentialRampToValueAtTime(0.01, o + 0.3);
        l.connect(u);
        u.connect(audioCtx.destination);
        l.start(o);
        l.stop(o + 0.3);
      }
    } catch {}
  }
}

const ie = new SpeechSynthesizer();

export default function App() {
  const [screen, setScreen] = useState<string>("language");
  const [lang, setLang] = useState<string>("en");
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>("");
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isAddingRx, setIsAddingRx] = useState<boolean>(false);
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [consultType, setConsultType] = useState<string>("allopathic");
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [isSuppressionActive, setIsSuppressionActive] = useState<boolean>(true);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);


  // Form states for manually registering a new patient
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("45");
  const [newGender, setNewGender] = useState("Male");
  const [newPhone, setNewPhone] = useState("9876543210");
  const [isNewRegOpen, setIsNewRegOpen] = useState(false);

  // Form states for writing a prescription
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("650 mg");
  const [medFreq, setMedFreq] = useState("OD (1-0-0) Once Daily");
  const [medDuration, setMedDuration] = useState("5 Days");
  const [medTiming, setMedTiming] = useState("After meals");

  const activeTranslations = translations[lang] || translations.en;

  // Connect to Red-Flag Triage WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname ? `${window.location.hostname}:8000` : "localhost:8000";
        ws = new WebSocket(`${wsProtocol}//${wsHost}/redflag/subscribe`);
        
        ws.onopen = () => {
          console.log("Connected to Red-Flag Triage WebSocket");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "red_flag_alert") {
              setActiveAlerts(prev => {
                if (prev.some(alert => alert.session_id === data.session_id)) return prev;
                return [...prev, data];
              });
              // Trigger emergency alarm audio beep sequence
              ie.playBeep("success");
            } else if (data.type === "red_flag_ack") {
              setActiveAlerts(prev => prev.filter(alert => alert.session_id !== data.session_id));
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          ws?.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Poll session status for Kiosk when emergency hold is active
  useEffect(() => {
    if (!isAlertActive || !patient) return;

    const interval = setInterval(async () => {
      try {
        const updatedSession = await getSession(patient.id);
        if (updatedSession.status === "acknowledged") {
          setIsAlertActive(false);
          setScreen("converse"); // Return to conversation
          setPatient(updatedSession);
        }
      } catch (err) {
        console.error("Failed to fetch session status during emergency hold:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAlertActive, patient]);


  // Initialize patient state from backend when session starts
  const handleStartSession = async (abhaId?: string, name?: string, age?: number, gender?: string, phone?: string) => {
    try {
      const data = await startSession(abhaId, name, age, gender, phone);
      const updated = await updateSession(data.id, { consultType });
      setPatient(updated);
      setScreen("identify");
    } catch (err) {
      console.error(err);
    }
  };

  // Sync state changes back to the FastAPI gateway session store
  const syncPatientChange = async (updates: Partial<PatientData>) => {
    if (!patient) return;
    try {
      const updated = await updateSession(patient.id, updates);
      setPatient(updated);
    } catch (err) {
      console.error("Failed to sync session updates:", err);
    }
  };

  const handleSpeech = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    ie.playBeep("click");

    // Speech Simulation fallback trigger
    setTimeout(() => {
      let speech = "";
      const step = patient?.currentStep || 1;
      
      if (consultType === "ayush") {
        const ayushFallbacks = [
          "Constitutional body type: Vata-dominant. Shows qualities of dry skin, lighter build, and active mind.",
          "Currently experiencing Pitta dosha imbalance with stomach heat and acidity.",
          "Excellent blood and muscle tissue quality (Rakta-Mamsa Sara), healthy complexion.",
          "Compact and symmetric body build, well-knit joints.",
          "Body proportions are balanced and symmetric according to standard measurement scales.",
          "Adaptable to warm weather, light diets, rice, and cooling herbs.",
          "Strong mental strength, high tolerance to pain and stress, good emotional stability.",
          "Strong digestive capacity (Agni), consumes two balanced meals daily without discomfort.",
          "Excellent physical stamina, exercises daily (yoga) with quick recovery.",
          "Middle age (45 years old), constitutional transition period, symptoms match age profile.",
          "Follows a balanced vegetarian diet, sleeps 7 hours, works regular shifts."
        ];
        speech = ayushFallbacks[step - 1] || "No concerns reported.";
      } else {
        if (step === 1) speech = activeTranslations.fallbackChiefComplaint;
        else if (step === 2) speech = activeTranslations.fallbackPastHistory;
        else if (step === 3) speech = activeTranslations.fallbackFamilyHistory;
        else if (step === 4) speech = activeTranslations.fallbackLifestyle;
      }

      setVoiceText(speech);
      setIsRecording(false);
      ie.playBeep("success");

      // Save voice details directly to backend database
      if (consultType === "ayush") {
        const parameterNames = [
          "Prakriti", "Vikriti", "Sara", "Samhanana", "Pramana", 
          "Satmya", "Sattva", "Ahara Shakti", "Vyayama Shakti", "Vaya", "Ahara-Vihara"
        ];
        const paramName = parameterNames[step - 1] || "Parameter";
        const newDetails = { ...(patient?.ayushDetails || {}), [paramName]: speech };
        syncPatientChange({
          ayushDetails: newDetails,
          chiefComplaintDetails: `AYUSH Intake Complete. Captured Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya, Sattva, Ahara/Vyayama Shakti, Vaya, and Ahara-Vihara.`
        });
      } else {
        if (step === 1) {
          syncPatientChange({
            symptoms: Array.from(new Set([...(patient?.symptoms || []), "Fever (2 Days)", "Stomach Pain"])),
            chiefComplaintDetails: speech
          });
        } else if (step === 2) {
          syncPatientChange({ pastHistoryDetails: speech });
        } else if (step === 3) {
          syncPatientChange({ familyHistoryDetails: speech });
        } else if (step === 4) {
          syncPatientChange({ lifestyleDetails: speech });
        }
      }
    }, 2800);
  };

  const handleDocCapture = async () => {
    if (!patient) return;
    // Simulate capture and API file upload
    const mockFile = new File(["dummy"], `Document_0${(patient.documents?.length || 0) + 1}.pdf`, { type: "application/pdf" });
    try {
      const res = await uploadDocument(patient.id, mockFile);
      setPatient(prev => {
        if (!prev) return null;
        return {
          ...prev,
          documents: [...prev.documents, res.document],
          timeline: [res.timelineEvent, ...prev.timeline]
        };
      });
      ie.playBeep("success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !medName.trim()) return;

    const newPrescription = {
      id: `rx-${Date.now()}`,
      medicine: medName.trim(),
      dosage: medDosage,
      frequency: medFreq,
      duration: medDuration,
      instructions: medTiming
    };

    const updatedPrescriptions = [...(patient.prescriptions || []), newPrescription];
    await syncPatientChange({ prescriptions: updatedPrescriptions });
    
    setMedName("");
    setIsAddingRx(false);
    ie.playBeep("success");
  };

  const handleDeleteRx = async (rxId: string) => {
    if (!patient) return;
    ie.playBeep("click");
    const updated = (patient.prescriptions || []).filter(item => item.id !== rxId);
    await syncPatientChange({ prescriptions: updated });
  };

  // Compute initials dynamically from patient's name
  const initials = patient?.name 
    ? patient.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) 
    : "JD";

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F2F0ED] text-[#1A1A1A] overflow-hidden select-none">
      
      {/* Header bar */}
      <header className="bg-[#1A1A1A] text-[#F2F0ED] flex justify-between items-center px-6 md:px-10 h-16 w-full z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold tracking-tighter">MEDIKIOSK</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D14D2A] font-bold">STUDIO_SYS</span>
          </div>
          {screen === "physician" && (
            <>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D14D2A] bg-[#D14D2A]/10 px-2.5 py-1 rounded border border-[#D14D2A]/30">
                Physician Portal
              </span>
            </>
          )}
          {screen === "triage" && (
            <>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#DBA226] bg-[#DBA226]/10 px-2.5 py-1 rounded border border-[#DBA226]/30">
                Triage Console
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen(prev => prev === "triage" ? "identify" : "triage")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold border border-[#F2F0ED]/20 transition-colors ${screen === "triage" ? "bg-[#DBA226] text-white" : "bg-[#2A2A2A] hover:bg-[#DBA226] text-white"}`}
          >
            {screen === "triage" ? "Kiosk View" : "Triage Console"}
          </button>
          <button 
            onClick={() => setScreen(prev => prev === "physician" ? "identify" : "physician")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-[0.15em] font-bold border border-[#F2F0ED]/20 transition-colors ${screen === "physician" ? "bg-[#D14D2A] text-white" : "bg-[#2A2A2A] hover:bg-[#D14D2A] text-white"}`}
          >
            {screen === "physician" ? "Kiosk View" : "Physician View"}
          </button>
          <button 
            onClick={() => setIsSupportOpen(true)}
            className="text-[#F2F0ED]/90 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
          >
            {activeTranslations.callForAssistance}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Navigation Sidebar */}
        {screen !== "language" && screen !== "consult_type_select" && screen !== "triage" && screen !== "physician" && (
          <nav className="bg-[#EBE8E3] text-[#1A1A1A] w-64 border-r border-[#1A1A1A]/10 flex flex-col h-full py-6 px-4 shrink-0 shadow-2xs">
            <div className="mb-8 flex flex-col items-center text-center pb-5 border-b border-[#1A1A1A]/10">
              <div className="w-12 h-12 bg-white rounded-full mb-3 flex items-center justify-center border border-[#1A1A1A]/15 shadow-xs">
                🏥
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#D14D2A] font-bold mb-1">PUBLIC HEALTH</div>
              <h2 className="text-base font-bold text-[#1A1A1A] font-serif">{activeTranslations.opdRegistration}</h2>
            </div>
            
            <ul className="flex-1 space-y-2">
              {[
                { s: "identify", label: activeTranslations.identifyNav, num: "01" },
                { s: "converse", label: activeTranslations.converseNav, num: "02" },
                { s: "scan", label: activeTranslations.scanNav, num: "03" },
                { s: "summary", label: activeTranslations.summaryNav, num: "04" }
              ].map(item => (
                <li key={item.s}>
                  <button 
                    onClick={() => setScreen(item.s)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl w-full text-left text-sm font-semibold border ${screen === item.s ? "bg-[#1A1A1A] text-white" : "bg-transparent text-[#5C5852] border-transparent hover:bg-[#E2DED8]"}`}
                  >
                    <span className="font-mono text-xs opacity-80">{item.num}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={async () => {
                setIsAlertActive(true);
                if (patient) {
                  try {
                    await triggerRedflag(patient.id, "Emergency Button Pressed on Kiosk Dashboard");
                  } catch (err) {
                    console.error("Failed to trigger emergency in BFF:", err);
                  }
                }
              }}
              className="mt-auto h-12 bg-[#D14D2A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#B83E1E] transition-all border border-[#B83E1E]"
            >
              {activeTranslations.emergencyHelp}
            </button>
          </nav>
        )}

        {/* Dynamic Screens */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-6 md:p-10">
          
          {/* SCREEN 1: Language Select */}
          {screen === "language" && (
            <div className="flex flex-col items-center justify-center my-auto w-full">
              <h1 className="text-2xl md:text-4xl font-bold font-serif mb-8 text-center">{activeTranslations.selectLanguageTitle}</h1>
              <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
                {languages.map(l => (
                  <button 
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setScreen("consult_type_select");
                    }}
                    className="p-5 bg-white border border-[#1A1A1A]/10 rounded-xl hover:border-[#D14D2A] hover:bg-[#FAF8F5] transition-all text-left shadow-2xs"
                  >
                    <div className="text-lg font-bold font-serif">{l.nativeName}</div>
                    <div className="text-xs text-[#5C5852] mt-1">{l.englishName}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 1.5: Consult Type Select */}
          {screen === "consult_type_select" && (
            <div className="flex flex-col items-center justify-center my-auto w-full max-w-2xl mx-auto animate-fadeIn">
              <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2 text-center">Select Clinical Intake Mode</h1>
              <p className="text-xs text-[#5C5852] mb-8 text-center">Choose the diagnostic pathway for this session.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <button 
                  onClick={() => {
                    setConsultType("allopathic");
                    handleStartSession(undefined, "John Doe", 45, "Male", "9876543210");
                  }}
                  className="p-6 bg-white border border-[#1A1A1A]/10 rounded-2xl hover:border-[#D14D2A] hover:bg-[#FAF8F5] transition-all text-left shadow-xs flex flex-col justify-between h-52 group"
                >
                  <div>
                    <div className="text-xl font-bold font-serif text-[#1A1A1A] group-hover:text-[#D14D2A]">Allopathic Clinical Intake</div>
                    <div className="text-xs text-[#5C5852] mt-2 leading-relaxed">
                      Standard Western medicine pathway focusing on Chief Complaint, Past History, Family History, and Lifestyle.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#D14D2A] uppercase tracking-wider mt-4">Select Pathway →</div>
                </button>
                <button 
                  onClick={() => {
                    setConsultType("ayush");
                    handleStartSession(undefined, "John Doe", 45, "Male", "9876543210");
                  }}
                  className="p-6 bg-white border border-[#1A1A1A]/10 rounded-2xl hover:border-[#D14D2A] hover:bg-[#FAF8F5] transition-all text-left shadow-xs flex flex-col justify-between h-52 group"
                >
                  <div>
                    <div className="text-xl font-bold font-serif text-[#D14D2A]">AYUSH Ayurveda Intake</div>
                    <div className="text-xs text-[#5C5852] mt-2 leading-relaxed">
                      Holistic Ayurvedic pathway capturing all 10 Dashavidha Pariksha parameters (Prakriti, Vikriti, Sara...) and Ahara-Vihara.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-[#D14D2A] uppercase tracking-wider mt-4">Select Pathway →</div>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: Identify / Register */}
          {screen === "identify" && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
              <h1 className="text-2xl md:text-3xl font-bold font-serif">{activeTranslations.identifyTitle}</h1>
              <p className="text-xs md:text-sm text-[#5C5852]">{activeTranslations.identifySubtitle}</p>
              
              <div className="bg-white border border-[#1A1A1A]/10 p-6 rounded-2xl shadow-2xs">
                <h3 className="text-lg font-bold font-serif mb-4">ABHA Verification</h3>
                <input 
                  type="text" 
                  defaultValue={patient?.abhaId || "91-4528-9021-0044"}
                  className="w-full h-11 px-3 border border-[#1A1A1A]/20 rounded-xl outline-none focus:border-[#D14D2A]"
                  placeholder={activeTranslations.enterIdPlaceholder}
                />
                <button 
                  onClick={() => handleStartSession("91-4528-9021-0044")}
                  className="mt-4 px-6 h-11 bg-[#1A1A1A] hover:bg-[#D14D2A] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Verify ABHA ID
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-[#1A1A1A]/10 flex-1" />
                <span className="text-xs font-bold text-[#5C5852] tracking-widest">{activeTranslations.orDivider}</span>
                <div className="h-px bg-[#1A1A1A]/10 flex-1" />
              </div>

              <div className="bg-white border border-[#1A1A1A]/10 p-6 rounded-2xl shadow-2xs">
                <h3 className="text-lg font-bold font-serif mb-2">{activeTranslations.newPatientTitle}</h3>
                <p className="text-xs text-[#5C5852] mb-4">{activeTranslations.newPatientDesc}</p>
                <button 
                  onClick={() => setIsNewRegOpen(true)}
                  className="px-6 h-11 bg-[#EBE8E3] hover:bg-[#1A1A1A] hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  {activeTranslations.startNewRegistration}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: Converse (Voice Intake) */}
          {screen === "converse" && (() => {
            const ayushQuestions = [
              { param: "Prakriti (Constitution)", q: "What is your constitutional body type or predominant energy (Vata, Pitta, Kapha)?" },
              { param: "Vikriti (Imbalance)", q: "Are you currently experiencing any digestive or metabolic imbalances?" },
              { param: "Sara (Tissue Quality)", q: "How would you describe the general quality of your skin, hair, and nails (tissue quality)?" },
              { param: "Samhanana (Compactness)", q: "How is your overall body build and compactness?" },
              { param: "Pramana (Proportions)", q: "Are your body proportions normal and symmetric?" },
              { param: "Satmya (Adaptability)", q: "What foods, climates, or habits are highly suitable for your body?" },
              { param: "Sattva (Mental Strength)", q: "How do you rate your mental strength and resilience under stress?" },
              { param: "Ahara Shakti (Digestion)", q: "Describe your appetite and digestion capacity." },
              { param: "Vyayama Shakti (Physical Energy)", q: "Describe your physical energy and exercise capacity." },
              { param: "Vaya (Age Factors)", q: "Are your symptoms related to your current stage of life/age?" },
              { param: "Ahara-Vihara (Diet & Lifestyle)", q: "Describe your daily diet and lifestyle habits." }
            ];
            const step = patient?.currentStep || 1;
            const isAyush = consultType === "ayush";
            const currentQ = isAyush ? ayushQuestions[step - 1] : null;

            return (
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 animate-fadeIn">
                <div className="text-center space-y-2">
                  <span className="text-[10px] bg-[#D14D2A]/10 text-[#D14D2A] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-[#D14D2A]/20">
                    {isAyush ? `AYUSH Assessment • Step ${step} of 11` : `Allopathic Intake • Step ${step} of 4`}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold font-serif text-center mt-2">
                    {isAyush ? currentQ?.param : (
                      step === 1 ? activeTranslations.healthConcernTitle 
                        : step === 2 ? "Any Past Medical Conditions?" 
                        : step === 3 ? "Any Family Health History?" 
                        : "Lifestyle & Daily Habits"
                    )}
                  </h1>
                  <p className="text-sm text-[#5C5852] italic max-w-lg mx-auto">
                    {isAyush ? currentQ?.q : activeTranslations.healthConcernSubtitle}
                  </p>
                </div>

                {/* Noise-Robust Client-side Audio Controls */}
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20 shadow-3xs">
                    <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
                    WebRTC RNNoise Active
                  </div>
                  <button 
                    onClick={() => {
                      setIsPushToTalk(prev => !prev);
                      if (isRecording) setIsRecording(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg border transition-all ${isPushToTalk ? "bg-[#D14D2A]/10 text-[#D14D2A] border-[#D14D2A]/20" : "bg-[#FAF8F5] text-[#5C5852] border-[#1A1A1A]/10"}`}
                  >
                    Mode: {isPushToTalk ? "Push-to-Talk" : "Tap-to-Talk"}
                  </button>
                </div>
                
                <button 
                  onMouseDown={() => { if (isPushToTalk) handleSpeech(); }}
                  onMouseUp={() => { if (isPushToTalk && isRecording) handleSpeech(); }}
                  onClick={() => { if (!isPushToTalk) handleSpeech(); }}
                  className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all border-2 shadow-lg ${isRecording ? "bg-[#D14D2A] text-white ring-8 ring-[#D14D2A]/20 scale-105" : "bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]"}`}
                >
                  <span className="text-3xl">🎤</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C5852]">
                  {isPushToTalk ? (isRecording ? "Release to Send" : "Hold to Speak") : (isRecording ? activeTranslations.listening : activeTranslations.tapToSpeak)}
                </span>

                {voiceText && (
                  <div className="w-full bg-white border border-[#1A1A1A]/12 p-4 rounded-xl shadow-2xs">
                    <div className="text-[10px] font-bold text-[#5C5852] uppercase tracking-wider mb-1">Captured Audio Transcript</div>
                    <p className="text-sm italic font-medium">"{voiceText}"</p>
                  </div>
                )}

                <button 
                  onClick={() => {
                    const nextStep = (patient?.currentStep || 1) + 1;
                    const maxSteps = isAyush ? 11 : 4;
                    if (nextStep > maxSteps) {
                      setScreen("scan");
                    } else {
                      syncPatientChange({ currentStep: nextStep });
                      setVoiceText("");
                    }
                  }}
                  className="mt-6 px-6 h-11 bg-[#D14D2A] hover:bg-[#B83E1E] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
                >
                  Next Step →
                </button>
              </div>
            );
          })()}

          {/* SCREEN 4: Scan */}
          {screen === "scan" && (
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
              <h1 className="text-2xl md:text-3xl font-bold font-serif">{activeTranslations.docDigitization}</h1>
              <p className="text-xs md:text-sm text-[#5C5852]">{activeTranslations.docDigitizationSubtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-black rounded-2xl flex flex-col items-center justify-center text-white border-2 border-dashed border-[#D14D2A]/40 relative">
                  <span className="text-xs uppercase tracking-wider mb-4">{activeTranslations.alignDocumentHere}</span>
                  <button 
                    onClick={handleDocCapture}
                    className="px-6 h-11 bg-[#D14D2A] hover:bg-[#B83E1E] text-white font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    {activeTranslations.capture}
                  </button>
                </div>

                <div className="bg-white border border-[#1A1A1A]/10 p-5 rounded-2xl flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2 mb-3">
                    {activeTranslations.capturedStack} ({patient?.documents?.length || 0})
                  </h3>
                  <div className="space-y-2 overflow-y-auto max-h-48">
                    {patient?.documents?.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center p-2 bg-[#FAF8F5] border rounded-lg text-xs font-semibold">
                        <span>{doc.name}</span>
                        <span className="text-[10px] bg-[#EBE8E3] text-[#D14D2A] px-2 py-0.5 rounded font-mono">OCR Processed</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setScreen("summary")}
                    className="mt-auto w-full h-11 bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#D14D2A] transition-colors"
                  >
                    {activeTranslations.confirmAll}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 5: Summary */}
          {screen === "summary" && (
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
              <h1 className="text-2xl md:text-3xl font-bold font-serif">{activeTranslations.summaryTitle}</h1>
              <p className="text-sm md:text-base leading-relaxed bg-white border p-5 rounded-2xl shadow-2xs italic">
                "{activeTranslations.summaryText}"
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => setScreen("converse")}
                  className="flex-1 h-12 bg-white border border-[#1A1A1A]/20 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#EBE8E3]"
                >
                  {activeTranslations.editByVoice}
                </button>
                <button 
                  onClick={() => setScreen("physician")}
                  className="flex-1 h-12 bg-[#D14D2A] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#B83E1E]"
                >
                  {activeTranslations.confirmAndProceed}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6: Physician Portal Dashboard */}
          {screen === "physician" && patient && (
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
              
              {/* Profile Card Header */}
              <div className="bg-white border border-[#1A1A1A]/10 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-4">
                  {/* Dynamic Initials Box */}
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] text-[#F2F0ED] font-bold text-base flex items-center justify-center font-mono">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-bold font-serif">{patient.name || "John Doe"}</h1>
                      <span className="px-2 py-0.5 rounded bg-[#EBE8E3] text-xs font-bold font-mono">
                        {patient.id}
                      </span>
                      {patient.documents?.some(d => d.url.includes("purged")) && (
                        <span className="px-2 py-0.5 rounded bg-[#34A853]/10 text-[#34A853] text-[9px] uppercase font-bold tracking-wider border border-[#34A853]/20 animate-pulse">
                          🔐 DPDP Data Minimized (Raw files purged)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5C5852] mt-1">
                      {patient.gender || "Male"} • {patient.age || 45} y/o • DOB: {patient.dob} • ABHA: {patient.abhaId}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsAddingRx(true)}
                  className="px-5 py-2 bg-[#D14D2A] hover:bg-[#B83E1E] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs"
                >
                  {activeTranslations.writeRx}
                </button>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Complaints & History */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Chief Complaint */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Chief Complaint (Voice Intake)</h2>
                    <p className="p-3 bg-[#FAF8F5] rounded-xl border border-dashed text-xs italic font-medium mb-3">
                      "{patient.chiefComplaintDetails || "No voice complaints logged."}"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {patient.symptoms?.map((sym, index) => (
                        <span key={index} className="px-2.5 py-1 bg-[#EBE8E3] text-xs font-bold rounded-full border">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* History of Present Illness */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-2">History of Present Illness (HPI)</h2>
                    <div className="text-xs text-[#1A1A1A] leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border">
                      <p>{patient.hpiDetails || "No HPI generated yet."}</p>
                      <p className="text-[10px] text-[#5C5852] mt-2 pt-2 border-t font-semibold">
                        Transcribed & structured automatically via MediKiosk AI Clinical Ingestion Model.
                      </p>
                    </div>
                  </div>

                  {/* Recent Investigations (Dynamic Mapping) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Recent Investigations</h2>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b text-[10px] font-bold text-[#5C5852] uppercase tracking-wider">
                          <th className="pb-2">Test</th>
                          <th className="pb-2">Result</th>
                          <th className="pb-2">Ref. Range</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {patient.labResults?.map((res, index) => (
                          <tr key={index}>
                            <td className="py-2.5 font-semibold">{res.test}</td>
                            <td className="py-2.5 font-mono font-bold text-[#D14D2A]">{res.result}</td>
                            <td className="py-2.5 text-[#5C5852]">{res.refRange}</td>
                            <td className="py-2.5 text-right font-bold uppercase text-xs">
                              <span className={`px-2 py-0.5 rounded ${res.status === 'High' ? 'bg-[#D14D2A]/10 text-[#D14D2A]' : 'bg-[#EBE8E3]'}`}>
                                {res.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Prescriptions List (Dynamic Mapping + Delete Action) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Prescriptions Issued</h2>
                    <div className="space-y-2">
                      {patient.prescriptions?.map(rx => (
                        <div key={rx.id} className="p-3 bg-[#FAF8F5] rounded-xl border flex justify-between items-start gap-3 shadow-3xs">
                          <div>
                            <div className="text-xs font-bold">{rx.medicine} ({rx.dosage})</div>
                            <div className="text-[11px] text-[#5C5852] mt-1">
                              {rx.frequency} • {rx.duration}
                            </div>
                            <div className="text-[10px] text-[#D14D2A] font-medium mt-1">Instructions: {rx.instructions}</div>
                          </div>
                          <button 
                            onClick={() => handleDeleteRx(rx.id)}
                            className="text-xs text-[#8C877E] hover:text-[#C5221F] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Vitals, Allergies, History & Timeline */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Current Vitals (Dynamic Mapping) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Current Vitals</h2>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: "TEMP", val: patient.vitals?.temp || "98.6 °F", icon: "🌡️" },
                        { label: "BP", val: patient.vitals?.bp || "120/80", icon: "🩺" },
                        { label: "HEART RATE", val: patient.vitals?.hr || "72 bpm", icon: "❤️" },
                        { label: "SPO2", val: patient.vitals?.spo2 || "98%", icon: "🫁" }
                      ].map((vit, index) => (
                        <div key={index} className="p-3 bg-[#FAF8F5] rounded-xl border flex items-center gap-3">
                          <span className="text-base">{vit.icon}</span>
                          <div>
                            <div className="text-[9px] font-bold text-[#5C5852] uppercase">{vit.label}</div>
                            <div className="font-bold text-sm font-mono mt-0.5">{vit.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drug Allergies (Dynamic Mapping) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Drug Allergies</h2>
                    <div className="space-y-2">
                      {patient.allergies?.map((all, index) => (
                        <div key={index} className="p-3 bg-[#FAF8F5] border border-[#D14D2A]/30 rounded-xl flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D14D2A]" />
                          <div>
                            <span className="font-bold text-xs uppercase tracking-wider">{all.name}</span>
                            <span className="text-xs block text-[#5C5852] mt-0.5">{all.reaction}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past Conditions & Family History (Dynamic Mapping) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Past Medical & Family History</h2>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border">
                        <span className="font-bold text-[10px] uppercase block mb-1">Past Conditions</span>
                        <p className="text-[#5C5852] leading-relaxed">{patient.pastHistoryDetails || "None reported."}</p>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border">
                        <span className="font-bold text-[10px] uppercase block mb-1">Family History</span>
                        <p className="text-[#5C5852] leading-relaxed">{patient.familyHistoryDetails || "None reported."}</p>
                      </div>
                    </div>
                  </div>

                  {/* AYUSH Dashavidha Pariksha Summary */}
                  {patient.consultType === "ayush" && (
                    <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs animate-fadeIn">
                      <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-[#D14D2A]">AYUSH Dashavidha Pariksha</h2>
                      <div className="space-y-3 text-xs">
                        {Object.entries(patient.ayushDetails || {}).map(([param, val]) => (
                          <div key={param} className="p-3 bg-[#FAF8F5] rounded-xl border">
                            <span className="font-bold text-[10px] uppercase block mb-1 text-[#D14D2A]">{param}</span>
                            <p className="text-[#5C5852] leading-relaxed">{val}</p>
                          </div>
                        ))}
                        {Object.keys(patient.ayushDetails || {}).length === 0 && (
                          <p className="text-xs text-[#8C877E] italic">No parameters captured.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Timeline (Dynamic Mapping) */}
                  <div className="bg-white border border-[#1A1A1A]/12 rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Document Timeline</h2>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#1A1A1A]/15">
                      {patient.timeline?.map(evt => (
                        <div key={evt.id} className="relative text-xs">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#D14D2A] ring-4 ring-[#FAF8F5]" />
                          <div className="text-[10px] font-bold text-[#5C5852]">{evt.date}</div>
                          <div className="font-bold mt-0.5">{evt.title}</div>
                          <div className="text-[11px] text-[#5C5852] mt-0.5">Type: {evt.type.toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* SCREEN 7: Triage Alert Console */}
          {screen === "triage" && (
            <div className={`w-full max-w-5xl mx-auto flex flex-col gap-6 h-full p-6 rounded-3xl transition-all ${activeAlerts.length > 0 ? "animate-pulse border-4 border-[#BA1A1A] bg-[#BA1A1A]/5 shadow-lg" : "bg-white border shadow-2xs"}`}>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-[#1A1A1A] flex items-center gap-2">
                    🚨 Nurse Triage Alert Console
                  </h1>
                  <p className="text-xs text-[#5C5852] mt-1">Real-time emergency tracking for OPD Kiosks via WebSockets.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34A853] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#34A853]">Live Connected</span>
                </div>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="my-auto flex flex-col items-center justify-center text-center p-12">
                  <span className="text-4xl mb-4">✅</span>
                  <h3 className="text-lg font-bold font-serif text-[#1A1A1A]">No Active Emergency Alerts</h3>
                  <p className="text-xs text-[#5C5852] mt-1 max-w-sm">All kiosks are currently running normal intake sessions.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[500px]">
                  {activeAlerts.map(alert => (
                    <div key={alert.session_id} className="p-6 bg-white border border-[#BA1A1A]/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fadeIn bg-gradient-to-r from-red-50 to-white">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-0.5 bg-[#BA1A1A] text-white text-[10px] font-bold rounded font-mono uppercase">
                            {alert.kiosk_id}
                          </span>
                          <span className="font-bold text-sm text-[#1A1A1A]">Patient: {alert.patient_name}</span>
                        </div>
                        <div className="text-xs text-[#5C5852]">Session ID: <span className="font-mono font-bold text-[#1A1A1A]">{alert.session_id}</span></div>
                        <div className="text-sm font-bold text-[#BA1A1A] mt-2 flex items-center gap-1.5 animate-pulse">
                          ⚠️ Primary Symptom: {alert.symptom}
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            await ackRedflag(alert.session_id);
                            setActiveAlerts(prev => prev.filter(item => item.session_id !== alert.session_id));
                            ie.playBeep("success");
                          } catch (err) {
                            console.error("Failed to acknowledge redflag:", err);
                          }
                        }}
                        className="w-full md:w-auto px-6 py-3 bg-[#BA1A1A] hover:bg-[#A61717] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                      >
                        Acknowledge & Release Kiosk
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* MODAL: New Patient Registration form */}
      {isNewRegOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold font-serif mb-4">New Patient Registration</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleStartSession(undefined, newName, parseInt(newAge, 10), newGender, newPhone);
              setIsNewRegOpen(false);
            }} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  required 
                  className="w-full h-11 px-3 border rounded-xl"
                  placeholder="e.g. Sarah Connor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1">Age</label>
                  <input 
                    type="number" 
                    value={newAge} 
                    onChange={(e) => setNewAge(e.target.value)} 
                    required 
                    className="w-full h-11 px-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase mb-1">Gender</label>
                  <select 
                    value={newGender} 
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  required 
                  className="w-full h-11 px-3 border rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsNewRegOpen(false)} className="flex-1 py-2.5 border rounded-xl uppercase tracking-wider font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#D14D2A] text-white rounded-xl uppercase tracking-wider font-bold">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Write Prescription */}
      {isAddingRx && patient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full border shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b mb-4">
              <div>
                <h3 className="text-lg font-bold font-serif">{activeTranslations.writeRx}</h3>
                <p className="text-xs text-[#5C5852] mt-0.5">Prescription for {patient.name} (Age {patient.age})</p>
              </div>
              <button onClick={() => setIsAddingRx(false)} className="text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleIssueRx} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Medicine Name & Composition</label>
                <input 
                  type="text" 
                  value={medName} 
                  onChange={(e) => setMedName(e.target.value)} 
                  required 
                  autoFocus 
                  className="w-full h-11 px-3 border rounded-xl font-medium"
                  placeholder="e.g. Tab. Amoxicillin / Clavulanate"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1">Dosage</label>
                  <input 
                    type="text" 
                    value={medDosage} 
                    onChange={(e) => setMedDosage(e.target.value)} 
                    className="w-full h-11 px-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase mb-1">Frequency</label>
                  <select 
                    value={medFreq} 
                    onChange={(e) => setMedFreq(e.target.value)}
                    className="w-full h-11 px-3 border rounded-xl font-semibold"
                  >
                    <option value="OD (1-0-0) Once Daily">OD (Once Daily)</option>
                    <option value="BD (1-0-1) Twice Daily">BD (Twice Daily)</option>
                    <option value="TDS (1-1-1) 3 Times/Day">TDS (3 Times/Day)</option>
                    <option value="SOS (As needed)">SOS (As Needed)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={medDuration} 
                    onChange={(e) => setMedDuration(e.target.value)} 
                    className="w-full h-11 px-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase mb-1">Timing</label>
                  <input 
                    type="text" 
                    value={medTiming} 
                    onChange={(e) => setMedTiming(e.target.value)} 
                    className="w-full h-11 px-3 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAddingRx(false)} className="flex-1 py-2.5 border rounded-xl uppercase tracking-wider font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#D14D2A] text-white rounded-xl uppercase tracking-wider font-bold">Issue Rx</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Live Support Attendant */}
      {isSupportOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full border shadow-2xl text-center text-xs">
            <h3 className="text-lg font-bold font-serif mb-2">{activeTranslations.callForAssistance}</h3>
            <p className="text-[#5C5852] mb-4">Select the support you require at this kiosk:</p>
            <div className="space-y-2 mb-6">
              {["Kiosk Attendant", "Wheelchair Mobility Assistance", "Dialect Translator"].map((support, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setIsSupportOpen(false);
                    ie.playBeep("success");
                  }}
                  className="w-full p-3 bg-[#FAF8F5] border hover:bg-[#EBE8E3] rounded-xl font-bold transition-all text-left"
                >
                  {support}
                </button>
              ))}
            </div>
            <button onClick={() => setIsSupportOpen(false)} className="w-full py-2.5 border rounded-xl font-bold uppercase">Cancel</button>
          </div>
        </div>
      )}

      {/* MODAL: Emergency priorities alert notification panel */}
      {isAlertActive && (
        <div className="fixed inset-0 z-[100] bg-[#BA1A1A] text-white flex flex-col justify-center p-8 select-none animate-fadeIn">
          <div className="text-center max-w-xl mx-auto space-y-6">
            <div className="w-24 h-24 rounded-full bg-white text-[#BA1A1A] text-4xl flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              ⚠️
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif">{activeTranslations.nurseAlertTitle}</h1>
            <p className="text-lg text-white/90 font-medium">{activeTranslations.nurseAlertSubtitle}</p>
            <p className="text-xs text-white/75">{activeTranslations.alertSentNotice}</p>
            
            <div className="pt-8 border-t border-white/20 mt-8 space-y-2">
              <p className="text-sm font-semibold tracking-wide text-white/85 animate-pulse">
                🔴 Waiting for Triage Nurse to Acknowledge & Release this Kiosk...
              </p>
              <p className="text-xs font-mono text-white/60">
                Kiosk ID: Kiosk-01 • Session ID: {patient?.id || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

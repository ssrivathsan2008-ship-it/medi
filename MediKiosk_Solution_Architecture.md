# MediKiosk — AI-Powered Clinical History & Document Intelligence Platform
### Solution + Code Architecture — Problem Statement 26047 (Ministry of AYUSH)

---

## 1. Solution Summary

MediKiosk is a patient-facing software platform, deployed as a kiosk in the OPD waiting area (and mirrored as a lightweight web/mobile companion), that captures a complete clinical history through **voice + touch conversation**, digitizes the patient's **paper medical documents**, and hands the treating physician a **structured, editable history summary** the moment the patient sits down — linked to their ABHA record and pushed into the hospital's HIS/EMR.

**Core loop:** `Identify → Converse → Scan → Summarize & Route → Consult`

| Stakeholder | What changes |
|---|---|
| Patient | Speaks naturally in their own language instead of being rushed through a 2-minute intake |
| Physician | Opens the consult to a ready-made structured history instead of re-eliciting it |
| Hospital | Structured, ABDM-linked records at point of entry instead of paper fragments |
| AYUSH OPD | Dashavidha Pariksha captured in full instead of being abbreviated for time |

### 1.1 AYUSH Depth — Dashavidha Pariksha Parameters Captured

The AYUSH interview mode doesn't just "enable an Ayurveda ontology" — it walks the patient through all ten Dashavidha Pariksha parameters plus Ahara-Vihara, each as its own branch in the dialogue graph:

| # | Parameter | What it assesses |
|---|---|---|
| 1 | Prakriti | Constitutional body type (Vata/Pitta/Kapha) |
| 2 | Vikriti | Current state of doshic imbalance |
| 3 | Sara | Tissue (dhatu) quality/excellence |
| 4 | Samhanana | Body compactness/build |
| 5 | Pramana | Body measurements/proportions |
| 6 | Satmya | Suitability/adaptability to substances |
| 7 | Sattva | Mental/psychological strength |
| 8 | Ahara Shakti | Digestive and appetite capacity |
| 9 | Vyayama Shakti | Physical exercise capacity |
| 10 | Vaya | Age-related constitutional factors |

Plus a separate **Ahara-Vihara** branch assessing diet and lifestyle. This full set is what makes the AYUSH mode meaningfully deeper than the allopathic intake — not an abbreviated stand-in for it.

---

## 2. High-Level Architecture

The system is a 6-tier stack (see diagram above): **Kiosk UI → API Gateway → AI Service Layer → AI/ML Models → Data & FHIR Store → ABDM/HIS Integration.** Each tier is independently deployable so AI models can be scaled or swapped (e.g. a new regional-language ASR model) without touching the orchestration or UI layers.

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Kiosk / patient UI | React (Next.js) + PWA, large-touch-target UI kit, Web Speech fallback | Works as a fixed kiosk build and a patient's own phone (QR handoff) with one codebase |
| API / orchestration | FastAPI (Python 3.12), Pydantic v2, async workers via Celery + Redis | Async-friendly for streaming ASR/LLM calls; easy typed contracts with the frontend |
| Conversation engine | LangGraph / a constrained dialogue-state graph, Indic ASR (AI4Bharat / Bhashini APIs), TTS (Bhashini) | Dialogue manager needs *state*, not just prompt-response; a graph enforces the SOCRATES/Dashavidha ontology instead of letting the LLM wander |
| Noise-robust audio capture | Directional/noise-cancelling kiosk mic array, WebRTC noise suppression (RNNoise) client-side, push-to-talk mic activation | OPD waiting areas are loud and crowded; ASR accuracy collapses without this layer — called out explicitly in the problem statement as a challenge to solve, not an afterthought |
| Document intelligence | Tesseract/TrOCR (printed) + a handwriting OCR model, spaCy/medical-NER (or an LLM-based extractor) for entity structuring | Two-stage pipeline: OCR first, then a constrained extraction pass — more auditable than end-to-end OCR-to-JSON |
| Summarization | LLM (Claude via Anthropic API) with a fixed clinical-summary schema (JSON mode) | Deterministic section headers (CC, HPI, PMH...) matter more than prose creativity here |
| Data store | PostgreSQL (relational — patients, sessions, consent, audit) | ACID guarantees for consent and audit trails |
| Interoperability | HAPI FHIR server (R4) fronting the clinical data as FHIR resources | Native path to ABDM Health Information Exchange without a bespoke mapping layer |
| Object storage | S3-compatible bucket (MinIO on-prem for government deployments) | Scanned documents, raw audio (short-lived, deleted post-session) |
| Identity & consent | ABHA OAuth2/OIDC, a dedicated Consent microservice | DPDP Act 2023 and ABDM consent-manager compliance isolated in one auditable service |
| Infra | Docker Compose (pilot) → Kubernetes (scale-out), NGINX ingress | Same containers move from a single-hospital pilot to a state-wide rollout |

---

## 4. Repository / Codebase Layout

```
medikiosk/
├── apps/
│   ├── kiosk-web/                 # Next.js patient-facing app (voice + touch)
│   │   ├── src/pages/
│   │   ├── src/components/        # LanguageSelect, VoiceRecorder, TouchOptionCard...
│   │   └── src/hooks/useConversation.ts
│   ├── physician-view/            # Lightweight view embedded in HIS/EMR (iframe or widget)
│   └── triage-alert-console/      # Nurse/duty-station display + push notification receiver for red-flag events
│
├── services/
│   ├── gateway/                   # FastAPI BFF — auth, session, routing
│   │   ├── main.py
│   │   ├── routers/ {session, consent, conversation, documents, summary}.py
│   │   └── deps/ {auth.py, rate_limit.py}
│   │
│   ├── conversation-engine/       # Dialogue manager + ASR/TTS orchestration
│   │   ├── ontology/              # clinical_history.yaml, dashavidha_pariksha.yaml
│   │   │                          #   (10 parameters: Prakriti, Vikriti, Sara, Samhanana,
│   │   │                          #    Pramana, Satmya, Sattva, Ahara Shakti, Vyayama
│   │   │                          #    Shakti, Vaya — plus a separate ahara_vihara.yaml
│   │   │                          #    for diet/lifestyle assessment)
│   │   ├── graph/dialogue_graph.py
│   │   ├── redflag/rules.py       # emergency symptom triggers
│   │   └── asr_tts_client.py      # Bhashini/AI4Bharat wrapper
│   │
│   ├── document-intelligence/     # OCR + clinical entity extraction
│   │   ├── ocr/ {printed.py, handwriting.py}
│   │   ├── extraction/ner_pipeline.py
│   │   └── timeline/chronology_builder.py
│   │
│   ├── summary-generator/         # LLM-based structured summary
│   │   ├── schema/clinical_summary_schema.json
│   │   └── generator.py
│   │
│   ├── consent-identity/          # ABHA auth + DPDP consent ledger
│   │   ├── abha_client.py
│   │   └── consent_ledger.py
│   │
│   └── fhir-bridge/               # Maps internal models ↔ FHIR resources, talks to HAPI FHIR + ABDM HIE
│       ├── mappers/ {patient.py, condition.py, medication.py, docref.py}
│       └── abdm_gateway_client.py
│
├── shared/
│   ├── models/                    # Pydantic schemas shared across services
│   └── events/                    # Kafka/Redis event contracts (session.started, doc.scanned, summary.ready)
│
├── infra/
│   ├── docker-compose.yml
│   ├── k8s/
│   └── terraform/
│
└── tests/
```

---

## 5. Core Data Flow (Sequence)

1. **Identify** — Kiosk UI → Gateway `/session/start` → Consent-Identity service authenticates via **ABHA OAuth2**, records consent in the ledger.
2. **Converse** — Kiosk UI streams audio (through the noise-suppression layer) → Gateway `/conversation/stream` (WebSocket) → Conversation Engine: ASR transcribes → dialogue graph selects next question (branches on chief complaint, e.g. SOCRATES for pain, Dashavidha Pariksha for AYUSH) → TTS speaks the prompt back. Red-flag rules run on every turn; a positive match fires a **priority-triage event** that is pushed in real time to the **triage-alert-console** at the nurse/duty station (screen flash + audible tone + patient's kiosk ID and symptom tag), and the kiosk itself switches to a calm "please wait, help is on the way" screen — the routine interview pauses until a nurse acknowledges via `/redflag/ack`.
3. **Scan** — Patient uploads/scans documents → Gateway `/documents/upload` → Document Intelligence: OCR → NER extraction (diagnoses, drugs, lab values) → chronology builder orders documents into a timeline → abnormal-value flags computed against reference ranges.
4. **Summarize & Route** — Once both streams are complete, Summary Generator merges conversation transcript + extracted document entities into the fixed clinical schema (CC → HPI → PMH/PSH → Drug/Allergy → Family → Personal → ROS → Investigations) → FHIR Bridge converts this into FHIR resources (`Patient`, `Condition`, `MedicationStatement`, `DocumentReference`, `Observation`) → pushed to the **HAPI FHIR server**, linked to ABHA via the **ABDM HIE**, and pushed to the hospital **HIS/EMR** over the same FHIR API.
5. **Consult** — Physician view polls/subscribes to `summary.ready` and renders the structured summary, editable inline; physician's edits are written back as the "confirmed" version of the FHIR resources (never overwriting the AI draft — an audit trail keeps both).

---

## 6. Key API Endpoints (Gateway)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/session/start` | Create session, ABHA auth, capture consent |
| `WS` | `/conversation/stream` | Bidirectional audio/text turn exchange with the dialogue engine |
| `POST` | `/documents/upload` | Upload a scanned document for OCR + extraction |
| `GET` | `/documents/{id}/timeline` | Retrieve the chronologically ordered document set |
| `GET` | `/summary/{session_id}` | Fetch the generated structured summary (draft or confirmed) |
| `PATCH` | `/summary/{session_id}` | Physician edits/confirms the summary |
| `WS` | `/redflag/subscribe` | Triage-alert-console subscribes for real-time red-flag pushes (screen flash + tone) |
| `POST` | `/redflag/ack` | Triage staff acknowledges a priority alert, releasing the kiosk from its "help is on the way" hold screen |
| `GET` | `/fhir/{resourceType}/{id}` | Proxy read-through to the HAPI FHIR server |

---

## 7. Data Model (Core Tables — PostgreSQL)

- `patients` (abha_id, demographics, preferred_language)
- `sessions` (patient_id, kiosk_id, started_at, status, consult_type: allopathic/ayush)
- `consents` (session_id, scope, granted_at, revoked_at, audio_ack_url)
- `conversation_turns` (session_id, turn_no, speaker, transcript, audio_ref, intent_tag)
- `documents` (session_id, storage_ref, doc_type, ocr_status, capture_date)
- `extracted_entities` (document_id, entity_type: diagnosis/medication/lab_value, value, ref_range, is_abnormal)
- `clinical_summaries` (session_id, schema_version, draft_json, confirmed_json, physician_id, confirmed_at)
- `redflag_events` (session_id, symptom_tag, triggered_at, acknowledged_at)
- `audit_log` (actor, action, resource, timestamp) — append-only, required for DPDP compliance

FHIR resources generated per session: `Patient`, `Encounter`, `Condition` (×N), `MedicationStatement` (×N), `Observation` (×N lab values), `DocumentReference` (×N scanned docs).

---

## 8. Security & Compliance

- **Auth:** ABHA OAuth2/OIDC for patients; hospital SSO + RBAC for staff/physicians.
- **Encryption:** TLS in transit; AES-256 at rest for object storage and the audio/document buckets.
- **Consent:** Granular, revocable, ABDM consent-manager compliant; audio-explained consent for low-literacy patients before any capture begins.
- **Data minimization:** Raw audio and scanned images are purged **immediately after the AI submission step** — i.e. as soon as the structured summary is generated and pushed to the FHIR store/HIS in Step 4 (Summarize & Route), not held until the physician confirms it later in the consult. Only the derived structured data (transcript-free clinical fields, extracted entities, document text) persists from that point onward, matching the problem statement's "session data is cleared immediately after submission" and satisfying DPDP Act 2023 storage-limitation principles.
- **Audit:** Every read/write to a clinical record is logged in the append-only `audit_log`, queryable for ABDM/DPDP audits.
- **Human-in-the-loop:** The AI-generated summary is always a draft; it is never written to the HIS/EMR as final until a physician confirms or edits it.

---

## 9. Deployment Path

1. **Pilot** — Single hospital, Docker Compose, one language pack, allopathic OPD only.
2. **AYUSH extension** — Enable Dashavidha Pariksha ontology module for Ayurveda OPDs.
3. **Scale-out** — Kubernetes, multi-tenant per hospital, autoscaled AI/ML pods (GPU pool for ASR/OCR/LLM inference).
4. **State/national rollout** — Multi-region deployment behind the ABDM HIE, one FHIR bridge instance per facility cluster.

---

## 10. Why This Architecture Holds Up

- **Modularity:** ASR/OCR/LLM models are swappable behind stable service interfaces — a better regional-language ASR model can replace the current one without touching the dialogue graph or UI.
- **Standards-first:** FHIR + ABHA + ABDM HIE from day one means no later re-integration project.
- **Offline-tolerant:** The kiosk UI can queue conversation turns and documents locally and sync when connectivity returns — important for rural/low-connectivity OPDs.
- **Auditable AI:** Every AI-generated field traces back to either a conversation turn or an extracted document entity, so a physician (or an auditor) can see *why* the summary says what it says.

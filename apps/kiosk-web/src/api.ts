import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface PatientData {
  id: string;
  abhaId?: string;
  name?: string;
  gender?: string;
  age?: number;
  dob?: string;
  phone?: string;
  consentGiven: boolean;
  currentStep: number;
  symptoms: string[];
  chiefComplaintDetails?: string;
  hpiDetails?: string;
  pastHistoryDetails?: string;
  familyHistoryDetails?: string;
  lifestyleDetails?: string;
  vitals: {
    temp: string;
    bp: string;
    hr: string;
    spo2: string;
  };
  allergies: Array<{ name: string; reaction: string }>;
  labResults: Array<{ test: string; result: string; refRange: string; status: string }>;
  timeline: Array<{ id: string; date: string; title: string; type: string }>;
  documents: Array<{
    id: string;
    name: string;
    pages: string;
    size: string;
    type: string;
    url: string;
    timestamp: string;
  }>;
  prescriptions: Array<{
    id: string;
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
}

export const startSession = async (
  abhaId?: string,
  name?: string,
  age?: number,
  gender?: string,
  phone?: string
): Promise<PatientData> => {
  const response = await axios.post(`${API_BASE_URL}/session/start`, {
    abhaId,
    name,
    age,
    gender,
    phone
  });
  return response.data;
};

export const getSession = async (sessionId: string): Promise<PatientData> => {
  const response = await axios.get(`${API_BASE_URL}/summary/${sessionId}`);
  return response.data;
};

export const updateSession = async (
  sessionId: string,
  data: Partial<PatientData>
): Promise<PatientData> => {
  const response = await axios.patch(`${API_BASE_URL}/summary/${sessionId}`, data);
  return response.data;
};

export const uploadDocument = async (
  sessionId: string,
  file: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

import { Patient, PatientCreateDTO, ClinicalFeatures } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { INITIAL_PATIENTS, DEFAULT_CLINICAL_FEATURES } from './mockData';

const LOCAL_STORAGE_KEY = 'hf_patients_store_v1';

function getLocalPatients(): Patient[] {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
    return INITIAL_PATIENTS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PATIENTS;
  }
}

function saveLocalPatients(patients: Patient[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
}

export async function fetchPatients(query?: string): Promise<Patient[]> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient[]>('/api/patients', {
        params: query ? { q: query } : undefined,
      });
    } catch (e) {
      console.warn('FastAPI error on fetchPatients, falling back to local store:', e);
    }
  }

  let list = getLocalPatients();
  if (query) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.patient_id.toLowerCase().includes(q) ||
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        (p.mrn && p.mrn.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function fetchPatientById(patientId: string): Promise<Patient> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient>(`/api/patients/${patientId}`);
    } catch (e) {
      console.warn(`FastAPI error on fetchPatientById ${patientId}, using local:`, e);
    }
  }

  const list = getLocalPatients();
  const patient = list.find((p) => p.patient_id === patientId);
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found.`);
  }
  return patient;
}

export async function createPatient(data: PatientCreateDTO): Promise<Patient> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('FastAPI error on createPatient, falling back to local store:', e);
    }
  }

  const list = getLocalPatients();
  const newId = 'PAT-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const newPatient: Patient = {
    patient_id: newId,
    first_name: data.first_name,
    last_name: data.last_name,
    dob: data.dob,
    mrn: data.mrn || `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
    gender: data.clinical_features?.Gender || 'Male',
    age: Number(data.clinical_features?.Age) || 65,
    created_at: now,
    updated_at: now,
    clinical_features: data.clinical_features || { ...DEFAULT_CLINICAL_FEATURES },
    notes: data.notes || '',
  };

  list.unshift(newPatient);
  saveLocalPatients(list);
  return newPatient;
}

export async function updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient>(`/api/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn(`FastAPI error on updatePatient ${patientId}, updating local store:`, e);
    }
  }

  const list = getLocalPatients();
  const idx = list.findIndex((p) => p.patient_id === patientId);
  if (idx === -1) {
    throw new Error(`Patient ${patientId} not found.`);
  }

  const updated: Patient = {
    ...list[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  list[idx] = updated;
  saveLocalPatients(list);
  return updated;
}

export function updatePatientPredictionMeta(
  patientId: string,
  riskScore: number,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  features?: ClinicalFeatures
) {
  const list = getLocalPatients();
  const idx = list.findIndex((p) => p.patient_id === patientId);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      last_prediction_date: new Date().toISOString(),
      last_risk_score: riskScore,
      last_risk_level: riskLevel,
      clinical_features: features || list[idx].clinical_features,
      updated_at: new Date().toISOString(),
    };
    saveLocalPatients(list);
  }
}

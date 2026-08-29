import { Patient, PatientCreateDTO, ClinicalFeatures } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_PATIENTS, DEFAULT_CLINICAL_FEATURES } from './mockData';

const LOCAL_STORAGE_KEY = 'hf_patients_store_v1';

// ── Local-storage fallback helpers (kept for offline / unconfigured mode) ──

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

// ── Supabase row ↔ Patient mapper ──

function rowToPatient(row: any): Patient {
  return {
    patient_id: row.patient_id,
    first_name: row.first_name,
    last_name: row.last_name,
    dob: row.dob,
    gender: row.gender,
    age: row.age,
    mrn: row.mrn,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_prediction_date: row.last_prediction_date,
    last_risk_score: row.last_risk_score != null ? Number(row.last_risk_score) : undefined,
    last_risk_level: row.last_risk_level,
    clinical_features: row.clinical_features,
    notes: row.notes,
  };
}

// ── Public API ──

export async function fetchPatients(query?: string): Promise<Patient[]> {
  // 1. Try FastAPI backend first
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient[]>('/patients', {
        params: query ? { q: query } : undefined,
      });
    } catch (e) {
      console.warn('FastAPI error on fetchPatients:', e);
    }
  }

  // 2. Try Supabase Postgres
  if (isSupabaseConfigured) {
    try {
      let qb = supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (query) {
        const q = `%${query}%`;
        qb = qb.or(`first_name.ilike.${q},last_name.ilike.${q},patient_id.ilike.${q},mrn.ilike.${q}`);
      }
      const { data, error } = await qb;
      if (error) throw error;
      if (data && data.length > 0) return data.map(rowToPatient);
    } catch (e) {
      console.warn('Supabase error on fetchPatients:', e);
    }
  }

  // 3. Local-storage fallback
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
      return await apiFetch<Patient>(`/patients/${patientId}`);
    } catch (e) {
      console.warn(`FastAPI error on fetchPatientById ${patientId}:`, e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      if (error) throw error;
      if (data) return rowToPatient(data);
    } catch (e) {
      console.warn(`Supabase error on fetchPatientById ${patientId}:`, e);
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
      return await apiFetch<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('FastAPI error on createPatient:', e);
    }
  }

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

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('patients').insert(newPatient);
      if (error) throw error;
      return newPatient;
    } catch (e) {
      console.warn('Supabase error on createPatient, falling back to local:', e);
    }
  }

  const list = getLocalPatients();
  list.unshift(newPatient);
  saveLocalPatients(list);
  return newPatient;
}

export async function updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<Patient>(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn(`FastAPI error on updatePatient ${patientId}:`, e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('patient_id', patientId)
        .select()
        .single();
      if (error) throw error;
      if (data) return rowToPatient(data);
    } catch (e) {
      console.warn(`Supabase error on updatePatient ${patientId}:`, e);
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
  const metaUpdates: Partial<Patient> = {
    last_prediction_date: new Date().toISOString(),
    last_risk_score: riskScore,
    last_risk_level: riskLevel,
    clinical_features: features,
    updated_at: new Date().toISOString(),
  };

  // Fire-and-forget Supabase update
  if (isSupabaseConfigured) {
    supabase
      .from('patients')
      .update(metaUpdates)
      .eq('patient_id', patientId)
      .then(({ error }) => {
        if (error) console.warn('Supabase error updating prediction meta:', error);
      });
  }

  // Always keep localStorage in sync for offline access
  const list = getLocalPatients();
  const idx = list.findIndex((p) => p.patient_id === patientId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...metaUpdates };
    saveLocalPatients(list);
  }
}

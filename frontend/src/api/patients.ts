import { Patient, PatientCreateDTO } from '../types/clinical';
import { apiFetch } from './client';

export async function fetchPatients(query?: string): Promise<Patient[]> {
  return apiFetch<Patient[]>('/patients', {
    params: query ? { q: query } : undefined,
  });
}

export async function fetchPatientById(patientId: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${patientId}`);
}

export async function createPatient(data: PatientCreateDTO): Promise<Patient> {
  return apiFetch<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  patientId: string,
  updates: Partial<Patient>
): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

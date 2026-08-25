import { RiskLevel } from '../types/clinical';

export function formatRiskPercentage(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  // Check if val is between 0 and 1 or 0 and 100
  const normalized = val <= 1 ? val * 100 : val;
  return `${normalized.toFixed(1)}%`;
}

export function getRiskLevelBadgeColor(level: RiskLevel | string | undefined): {
  bg: string;
  text: string;
  border: string;
  dotBg: string;
} {
  switch (level?.toUpperCase()) {
    case 'HIGH':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700 font-bold',
        border: 'border-red-200',
        dotBg: 'bg-red-600',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800 font-bold',
        border: 'border-yellow-200',
        dotBg: 'bg-yellow-600',
      };
    case 'LOW':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800 font-bold',
        border: 'border-emerald-200',
        dotBg: 'bg-emerald-600',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700 font-medium',
        border: 'border-slate-200',
        dotBg: 'bg-slate-400',
      };
  }
}


export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export const CLINICAL_UNITS: Record<string, string> = {
  BMI: 'kg/m²',
  Systolic_BP: 'mmHg',
  Diastolic_BP: 'mmHg',
  Heart_Rate: 'bpm',
  Oxygen_Saturation: '%',
  Ejection_Fraction: '%',
  Creatinine: 'mg/dL',
  Sodium: 'mmol/L',
  Potassium: 'mmol/L',
  Hemoglobin: 'g/dL',
  Blood_Glucose: 'mg/dL',
  BNP: 'pg/mL',
  Length_of_Stay: 'days',
  Previous_HF_Admissions: 'admissions',
  Previous_Hospital_Admissions: 'admissions',
  Age: 'years',
};

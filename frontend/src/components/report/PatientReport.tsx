import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PredictionResult, Patient, ClinicalFeatures } from '../../types/clinical';
import { RiskBadge } from '../common/Badge';
import { formatRiskPercentage, formatDate, CLINICAL_UNITS } from '../../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';
import { supabase } from '../../api/supabase';
import {
  Printer,
  Download,
  X,
  HeartPulse,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface PatientReportProps {
  prediction: PredictionResult;
  patient?: Patient;
  onClose?: () => void;
}

const CLINICAL_SECTIONS: { title: string; fields: (keyof ClinicalFeatures)[] }[] = [
  {
    title: 'Demographics',
    fields: ['Age', 'Gender', 'BMI'],
  },
  {
    title: 'Lifestyle',
    fields: ['Smoking_Status', 'Alcohol_Consumption', 'Exercise_Frequency'],
  },
  {
    title: 'Comorbidities',
    fields: [
      'Hypertension',
      'Diabetes',
      'Chronic_Kidney_Disease',
      'Coronary_Artery_Disease',
      'Previous_Stroke',
      'Atrial_Fibrillation',
    ],
  },
  {
    title: 'Cardiac History',
    fields: [
      'Previous_HF_Admissions',
      'Previous_Hospital_Admissions',
      'Heart_Failure_Type',
      'NYHA_Class',
      'Ejection_Fraction',
    ],
  },
  {
    title: 'Vitals',
    fields: ['Systolic_BP', 'Diastolic_BP', 'Heart_Rate', 'Oxygen_Saturation'],
  },
  {
    title: 'Laboratory Results',
    fields: ['Creatinine', 'Sodium', 'Potassium', 'Hemoglobin', 'Blood_Glucose', 'BNP'],
  },
  {
    title: 'Hospitalization',
    fields: ['Length_of_Stay', 'ICU_Admission', 'Emergency_Admission'],
  },
  {
    title: 'Medications',
    fields: [
      'Beta_Blocker',
      'ACE_ARB',
      'Diuretic',
      'SGLT2_Inhibitor',
      'Mineralocorticoid_Antagonist',
    ],
  },
];

const FIELD_LABELS: Record<string, string> = {
  Age: 'Age',
  Gender: 'Gender',
  BMI: 'Body Mass Index',
  Smoking_Status: 'Smoking Status',
  Alcohol_Consumption: 'Alcohol Consumption',
  Exercise_Frequency: 'Exercise Frequency',
  Hypertension: 'Hypertension',
  Diabetes: 'Diabetes',
  Chronic_Kidney_Disease: 'Chronic Kidney Disease',
  Coronary_Artery_Disease: 'Coronary Artery Disease',
  Previous_Stroke: 'Previous Stroke',
  Atrial_Fibrillation: 'Atrial Fibrillation',
  Previous_HF_Admissions: 'Previous Heart Failure Admissions',
  Previous_Hospital_Admissions: 'Previous Hospital Admissions',
  Heart_Failure_Type: 'Heart Failure Type',
  NYHA_Class: 'NYHA Class',
  Ejection_Fraction: 'Ejection Fraction',
  Systolic_BP: 'Systolic Blood Pressure',
  Diastolic_BP: 'Diastolic Blood Pressure',
  Heart_Rate: 'Heart Rate',
  Oxygen_Saturation: 'Oxygen Saturation',
  Creatinine: 'Creatinine',
  Sodium: 'Sodium',
  Potassium: 'Potassium',
  Hemoglobin: 'Hemoglobin',
  Blood_Glucose: 'Blood Glucose',
  BNP: 'BNP',
  Length_of_Stay: 'Length of Stay',
  ICU_Admission: 'ICU Admission',
  Emergency_Admission: 'Emergency Admission',
  Beta_Blocker: 'Beta Blocker',
  ACE_ARB: 'ACE Inhibitor / ARB',
  Diuretic: 'Diuretic',
  SGLT2_Inhibitor: 'SGLT2 Inhibitor',
  Mineralocorticoid_Antagonist: 'Mineralocorticoid Antagonist',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatClinicalValue(field: keyof ClinicalFeatures, value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Not recorded';
  const unit = CLINICAL_UNITS[String(field)];
  return unit ? `${value} ${unit}` : String(value);
}

function getHospitalName(user: any): string {
  return user?.user_metadata?.hospital_name?.trim() || 'Hospital / Clinic';
}

function buildClinicalRows(features: ClinicalFeatures): string {
  return CLINICAL_SECTIONS.map((section) => {
    const rows = section.fields
      .filter((field) => features[field] !== undefined && features[field] !== null && features[field] !== '')
      .map((field) => `
        <tr>
          <td>${escapeHtml(FIELD_LABELS[String(field)] || String(field))}</td>
          <td>${escapeHtml(formatClinicalValue(field, features[field]))}</td>
        </tr>
      `)
      .join('');

    if (!rows) return '';

    return `
      <tr class="section-row"><th colspan="2">${escapeHtml(section.title)}</th></tr>
      ${rows}
    `;
  }).join('');
}

function buildPrintableReportHtml({
  prediction,
  patient,
  hospitalName,
}: {
  prediction: PredictionResult;
  patient?: Patient;
  hospitalName: string;
}): string {
  const features = prediction.clinical_features || patient?.clinical_features;
  const patientName = prediction.patient_name || (patient ? `${patient.first_name} ${patient.last_name}`.trim() : '') || 'Patient';
  const patientId = prediction.patient_id || patient?.patient_id || 'N/A';
  const mrn = patient?.mrn || 'Not recorded';
  const age = patient?.age ?? features?.Age;
  const gender = patient?.gender ?? features?.Gender;
  const probability = formatRiskPercentage(prediction.readmission_probability);
  const generatedAt = formatDate(prediction.prediction_date || new Date().toISOString());
  const clinician = prediction.clinician_name || 'Not recorded';
  const isHigh = prediction.risk_level === 'HIGH';
  const riskClass = isHigh ? 'high' : prediction.risk_level === 'MEDIUM' ? 'medium' : 'low';
  const shapRows = (prediction.shap_explanation || []).slice(0, 5).map((factor) => `
    <tr>
      <td>${escapeHtml(factor.display_name)}</td>
      <td>${escapeHtml(factor.feature_value)}</td>
      <td class="${factor.impact_direction === 'Increases Risk' ? 'risk-up' : 'risk-down'}">${escapeHtml(factor.impact_direction)}</td>
      <td>${factor.shap_value > 0 ? '+' : ''}${escapeHtml(factor.shap_value)}</td>
    </tr>
  `).join('');
  const followups = prediction.gemini_interpretation?.suggested_followup_considerations || [];

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Pulse AI Report - ${escapeHtml(patientName)}</title>
<style>
  @page { size: A4; margin: 14mm 13mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #172033; background: #fff; font-size: 10.5pt; line-height: 1.45; }
  h1, h2, h3, p { margin: 0; }
  .report { width: 100%; }
  .header { border-bottom: 2px solid #172033; padding-bottom: 12px; margin-bottom: 18px; }
  .brand { font-size: 24pt; font-weight: 800; letter-spacing: -0.5px; }
  .hospital { margin-top: 4px; font-size: 13pt; font-weight: 700; }
  .subtitle { margin-top: 3px; color: #5f6b7a; font-size: 9.5pt; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; color: #4b5563; font-size: 8.8pt; }
  .meta strong { color: #172033; }
  .section-title { margin: 18px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #cfd5dc; font-size: 11.5pt; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }
  .patient-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #d8dde5; }
  .patient-cell { padding: 8px 10px; border-right: 1px solid #d8dde5; border-bottom: 1px solid #d8dde5; }
  .patient-cell:nth-child(3n) { border-right: 0; }
  .label { display: block; color: #6b7280; font-size: 7.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; }
  .value { margin-top: 2px; font-weight: 700; }
  .summary { display: grid; grid-template-columns: 1.05fr 1fr 1.25fr; gap: 10px; margin-top: 8px; }
  .summary-card { border: 1px solid #d8dde5; border-radius: 7px; padding: 11px 12px; }
  .summary-label { color: #6b7280; font-size: 7.8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; }
  .probability { font-size: 24pt; line-height: 1.1; font-weight: 800; margin-top: 4px; }
  .probability.high { color: #b42318; }
  .probability.medium { color: #a15c00; }
  .probability.low { color: #087443; }
  .risk-pill { display: inline-block; margin-top: 5px; border: 1px solid #cfd5dc; border-radius: 999px; padding: 4px 9px; font-weight: 800; font-size: 8.5pt; }
  .tables { width: 100%; border-collapse: collapse; }
  .tables th, .tables td { border: 1px solid #d8dde5; padding: 6px 7px; text-align: left; vertical-align: top; }
  .tables th { background: #f3f5f7; font-size: 8.5pt; }
  .tables td { font-size: 8.9pt; }
  .section-row th { background: #e9edf2; color: #172033; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; }
  .clinical-table td:first-child { width: 48%; font-weight: 700; }
  .clinical-table { page-break-inside: auto; }
  .clinical-table tr { page-break-inside: avoid; }
  .shap-table td:first-child { font-weight: 700; }
  .risk-up { color: #b42318; font-weight: 700; }
  .risk-down { color: #087443; font-weight: 700; }
  .interpretation { border-left: 3px solid #172033; padding: 9px 11px; background: #f6f7f9; }
  .followups { margin: 7px 0 0 18px; padding: 0; }
  .followups li { margin-bottom: 4px; }
  .disclaimer { margin-top: 12px; color: #667085; font-size: 8pt; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #cfd5dc; display: flex; justify-content: space-between; gap: 15px; font-size: 8pt; color: #667085; }
  .signature { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .signature-line { margin-top: 24px; padding-bottom: 4px; border-bottom: 1px solid #6b7280; font-weight: 700; }
  .no-data { color: #667085; font-style: italic; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="report">
  <header class="header">
    <div class="brand">Pulse AI Report</div>
    <div class="hospital">${escapeHtml(hospitalName)}</div>
    <div class="subtitle">30-Day Heart Failure Readmission Risk Assessment</div>
    <div class="meta">
      <div><strong>Prediction ID:</strong> ${escapeHtml(prediction.prediction_id)}</div>
      <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
    </div>
  </header>

  <h2 class="section-title">Patient Details</h2>
  <div class="patient-grid">
    <div class="patient-cell"><span class="label">Patient Name</span><span class="value">${escapeHtml(patientName)}</span></div>
    <div class="patient-cell"><span class="label">Patient ID</span><span class="value">${escapeHtml(patientId)}</span></div>
    <div class="patient-cell"><span class="label">MRN</span><span class="value">${escapeHtml(mrn)}</span></div>
    <div class="patient-cell"><span class="label">Age</span><span class="value">${escapeHtml(age ?? 'Not recorded')} ${age !== undefined ? 'years' : ''}</span></div>
    <div class="patient-cell"><span class="label">Gender</span><span class="value">${escapeHtml(gender ?? 'Not recorded')}</span></div>
    <div class="patient-cell"><span class="label">Clinician</span><span class="value">${escapeHtml(clinician)}</span></div>
  </div>

  <h2 class="section-title">Prediction Summary</h2>
  <div class="summary">
    <div class="summary-card"><div class="summary-label">30-Day Readmission Probability</div><div class="probability ${riskClass}">${escapeHtml(probability)}</div></div>
    <div class="summary-card"><div class="summary-label">Risk Level</div><div class="value" style="font-size:14pt; margin-top:7px;">${escapeHtml(prediction.risk_level)}</div><div class="risk-pill">${escapeHtml(prediction.model_prediction)}</div></div>
    <div class="summary-card"><div class="summary-label">Assessment</div><div class="value" style="margin-top:7px;">Clinical decision-support output</div><div style="margin-top:5px; color:#5f6b7a; font-size:8.8pt;">Generated from the submitted patient clinical assessment.</div></div>
  </div>

  <h2 class="section-title">Clinical Values and Vitals</h2>
  ${features ? `<table class="tables clinical-table"><tbody>${buildClinicalRows(features)}</tbody></table>` : '<div class="no-data">Clinical feature values were not included with this prediction.</div>'}

  <h2 class="section-title">Primary Clinical Drivers</h2>
  ${shapRows ? `<table class="tables shap-table"><thead><tr><th>Factor</th><th>Input Value</th><th>Impact</th><th>SHAP Value</th></tr></thead><tbody>${shapRows}</tbody></table>` : '<div class="no-data">SHAP explanation was not available for this prediction.</div>'}

  ${prediction.gemini_interpretation ? `
  <h2 class="section-title">AI Analysis</h2>
  <div class="interpretation">${escapeHtml(prediction.gemini_interpretation.risk_interpretation)}</div>
  ${followups.length ? `<div style="margin-top:9px;"><strong>Follow-up considerations</strong><ul class="followups">${followups.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
  <div class="disclaimer"><strong>Clinical disclaimer:</strong> ${escapeHtml(prediction.gemini_interpretation.clinical_disclaimer || 'This report is decision support and does not replace professional clinical judgment.')}</div>
  ` : ''}

  <div class="signature">
    <div><div class="label">Attending / Reviewer</div><div class="signature-line">${escapeHtml(clinician)}</div></div>
    <div><div class="label">Report Date</div><div class="signature-line">${escapeHtml(formatDate(new Date().toISOString()))}</div></div>
  </div>

  <footer class="footer">
    <span>Pulse AI - Clinical Decision Support</span>
    <span>For clinical review and decision support only.</span>
  </footer>
</div>
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 250);
  });
</script>
</body>
</html>`;
}

export const PatientReport: React.FC<PatientReportProps> = ({
  prediction,
  patient,
  onClose,
}) => {
  const isHigh = prediction.risk_level === 'HIGH';
  const isMed = prediction.risk_level === 'MEDIUM';
  const [hospitalName, setHospitalName] = useState('Hospital / Clinic');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setHospitalName(getHospitalName(data.user));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const clinicalFeatures = useMemo(
    () => prediction.clinical_features || patient?.clinical_features,
    [prediction.clinical_features, patient?.clinical_features]
  );

  const openPrintableReport = async () => {
    const popup = window.open('', '_blank', 'width=900,height=900');
    if (!popup) {
      window.alert('Please allow pop-ups for Pulse AI to print the report.');
      return;
    }

    const { data } = await supabase.auth.getUser();
    const resolvedHospitalName = getHospitalName(data.user);
    setHospitalName(resolvedHospitalName);

    popup.document.open();
    popup.document.write(
      buildPrintableReportHtml({
        prediction,
        patient,
        hospitalName: resolvedHospitalName,
      })
    );
    popup.document.close();
    popup.focus();
  };

  const downloadPdfReport = async () => {
    const { data } = await supabase.auth.getUser();
    const resolvedHospitalName = getHospitalName(data.user);
    setHospitalName(resolvedHospitalName);

    const features = prediction.clinical_features || patient?.clinical_features;
    const patientName = prediction.patient_name || (patient ? `${patient.first_name} ${patient.last_name}`.trim() : '') || 'Patient';
    const patientId = prediction.patient_id || patient?.patient_id || 'N/A';
    const mrn = patient?.mrn || 'Not recorded';
    const age = patient?.age ?? features?.Age;
    const gender = patient?.gender ?? features?.Gender;
    const probability = formatRiskPercentage(prediction.readmission_probability);
    const riskLevel = prediction.risk_level || 'N/A';
    const clinician = prediction.clinician_name || 'Not recorded';
    const generatedAt = formatDate(prediction.prediction_date || new Date().toISOString());

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.text('Pulse AI Report', margin, y);
    y += 8;
    doc.setFontSize(13);
    doc.text(resolvedHospitalName, margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('30-Day Heart Failure Readmission Risk Assessment', margin, y);
    y += 8;
    doc.setDrawColor(40, 48, 60);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Report Information', margin, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [238, 241, 245], textColor: [23, 32, 51], fontStyle: 'bold' },
      body: [
        ['Prediction ID', prediction.prediction_id || 'N/A', 'Generated', generatedAt],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 }, 2: { fontStyle: 'bold', cellWidth: 24 } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    const section = (title: string) => {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
    };

    section('Patient Details');
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [238, 241, 245], textColor: [23, 32, 51], fontStyle: 'bold' },
      body: [
        ['Patient Name', patientName, 'Patient ID', patientId],
        ['MRN', mrn, 'Age', age !== undefined ? `${age} years` : 'Not recorded'],
        ['Gender', gender ?? 'Not recorded', 'Clinician', clinician],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 2: { fontStyle: 'bold', cellWidth: 28 } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    section('Prediction Summary');
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      body: [
        ['30-Day Readmission Probability', probability],
        ['Risk Level', riskLevel],
        ['Model Output', prediction.model_prediction || 'Not available'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 72 }, 1: { fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    section('Clinical Values and Vitals');
    const clinicalBody: string[][] = [];
    CLINICAL_SECTIONS.forEach((clinicalSection) => {
      clinicalSection.fields.forEach((field) => {
        if (features && features[field] !== undefined && features[field] !== null && features[field] !== '') {
          clinicalBody.push([clinicalSection.title, FIELD_LABELS[String(field)] || String(field), formatClinicalValue(field, features[field])]);
        }
      });
    });

    if (clinicalBody.length) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['Section', 'Clinical Parameter', 'Value']],
        body: clinicalBody,
        styles: { font: 'helvetica', fontSize: 7.7, cellPadding: 2.7 },
        headStyles: { fillColor: [238, 241, 245], textColor: [23, 32, 51], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 74 }, 2: { cellWidth: 66 } },
        margin: { left: margin, right: margin },
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 0) {
            hookData.cell.styles.fontStyle = 'bold';
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Clinical feature values were not included with this prediction.', margin, y + 5);
      y += 12;
    }

    section('Primary Clinical Drivers');
    const shapBody = (prediction.shap_explanation || []).slice(0, 5).map((factor) => [
      factor.display_name,
      String(factor.feature_value),
      factor.impact_direction,
      `${factor.shap_value > 0 ? '+' : ''}${factor.shap_value}`,
    ]);
    if (shapBody.length) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['Factor', 'Input Value', 'Impact', 'SHAP Value']],
        body: shapBody,
        styles: { font: 'helvetica', fontSize: 7.9, cellPadding: 2.8 },
        headStyles: { fillColor: [238, 241, 245], textColor: [23, 32, 51], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('SHAP explanation was not available for this prediction.', margin, y + 5);
      y += 12;
    }

    if (prediction.gemini_interpretation) {
      section('AI Analysis');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const interpretation = prediction.gemini_interpretation.risk_interpretation || '';
      const wrapped = doc.splitTextToSize(interpretation, pageWidth - (margin * 2));
      doc.text(wrapped, margin, y + 5);
      y += wrapped.length * 4.2 + 10;

      const followups = prediction.gemini_interpretation.suggested_followup_considerations || [];
      if (followups.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Follow-up considerations', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        followups.forEach((item) => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - (margin * 2));
          if (y + lines.length * 4.2 > 278) { doc.addPage(); y = 18; }
          doc.text(lines, margin, y);
          y += lines.length * 4.2 + 2;
        });
      }

      const disclaimer = prediction.gemini_interpretation.clinical_disclaimer || 'This report is decision support and does not replace professional clinical judgment.';
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFontSize(7.5);
      doc.setTextColor(95, 107, 122);
      const disclaimerLines = doc.splitTextToSize(`Clinical disclaimer: ${disclaimer}`, pageWidth - (margin * 2));
      doc.text(disclaimerLines, margin, y + 5);
      doc.setTextColor(23, 32, 51);
      y += disclaimerLines.length * 3.7 + 10;
    }

    if (y > 255) { doc.addPage(); y = 18; }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Reviewer / Attending', margin, y);
    doc.text('Report Date', pageWidth / 2 + 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clinician, margin, y + 7);
    doc.text(generatedAt, pageWidth / 2 + 10, y + 7);
    doc.setDrawColor(120, 128, 138);
    doc.line(margin, y + 9, pageWidth / 2 - 8, y + 9);
    doc.line(pageWidth / 2 + 10, y + 9, pageWidth - margin, y + 9);

    const footerText = 'Pulse AI - Clinical Decision Support | For clinical review and decision support only.';
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(7);
      doc.setTextColor(102, 112, 128);
      doc.text(footerText, margin, 289);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, 289, { align: 'right' });
    }

    const safeName = patientName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'patient';
    doc.save(`Pulse-AI-Report-${safeName}-${patientId}.pdf`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-base/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring' as any, stiffness: 300, damping: 25 }}
          className="bg-surface-glass border border-border-glass rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden my-8 max-h-[90vh] flex flex-col relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />

          <div className="p-5 bg-base/50 backdrop-blur-md border-b border-border-glass flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary-hover border border-primary/30 shadow-[0_0_15px_var(--accent-primary-glow)]">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-text-main tracking-tight">Clinical Decision Support Report</h3>
                <p className="text-xs font-semibold text-text-muted">{hospitalName} - 30-Day Risk Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MagneticButton
                variant="ghost"
                onClick={downloadPdfReport}
                className="text-text-muted hover:text-text-main border border-border-glass"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF
              </MagneticButton>

              <MagneticButton
                onClick={openPrintableReport}
                className="bg-primary/10 text-primary-hover border border-primary/50 hover:bg-primary/20"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Report
              </MagneticButton>

              {onClose && (
                <MagneticButton
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 ml-2 text-text-muted hover:text-primary-hover"
                >
                  <X className="w-5 h-5" />
                </MagneticButton>
              )}
            </div>
          </div>

          <div className="p-8 overflow-y-auto space-y-8 text-text-main font-sans relative z-10">
            <div className="border-b border-border-glass pb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 text-primary font-black text-xl tracking-tight">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <Building className="w-6 h-6 text-primary-hover" />
                  </div>
                  <span>{hospitalName}</span>
                </div>
                <p className="text-sm font-semibold text-text-muted mt-2 ml-11">Pulse AI - Clinical Decision Support</p>
              </div>
              <div className="text-right text-xs font-semibold text-text-muted bg-base/50 p-3 rounded-xl border border-border-glass">
                <p className="font-bold text-text-main text-sm">ID: {prediction.prediction_id}</p>
                <p className="mt-1">Generated: {formatDate(prediction.prediction_date)}</p>
              </div>
            </div>

            <Card className="p-6 bg-base border-border-glass">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">Patient Details</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Patient</p><p className="font-black text-text-main mt-1 text-base">{prediction.patient_name || (patient ? `${patient.first_name} ${patient.last_name}` : 'Patient')}</p></div>
                <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Patient ID</p><p className="font-mono font-bold text-primary-hover mt-1">{prediction.patient_id}</p></div>
                <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Age / Gender</p><p className="font-bold text-text-main mt-1">{patient?.age ?? prediction.clinical_features?.Age ?? '-'} yrs / {patient?.gender ?? prediction.clinical_features?.Gender ?? '-'}</p></div>
                <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Clinician</p><p className="font-bold text-text-main mt-1">{prediction.clinician_name || 'Not recorded'}</p></div>
              </div>
            </Card>

            <Card className="p-6 bg-base border-border-glass space-y-4 relative overflow-hidden">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary relative z-10">30-Day Readmission Risk</h4>
              <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl bg-base border border-border-glass shadow-inner relative z-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Probability</p>
                  <p className={`text-5xl font-black tracking-tighter ${isHigh ? 'text-danger-hover' : isMed ? 'text-warning' : 'text-primary-hover'}`}>
                    {formatRiskPercentage(prediction.readmission_probability)}
                  </p>
                </div>
                <div><p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Classification</p><RiskBadge level={prediction.risk_level} className="text-base px-4 py-2 font-black" /></div>
                <div><p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Model Output</p><div className="flex items-center gap-2">{isHigh ? <AlertCircle className="w-6 h-6 text-danger-hover" /> : <CheckCircle2 className="w-6 h-6 text-primary-hover" />}<p className={`font-black text-xl ${isHigh ? 'text-danger-hover' : 'text-primary-hover'}`}>{prediction.model_prediction}</p></div></div>
              </div>
            </Card>

            <Card className="p-6 bg-base border-border-glass">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Clinical Values and Vitals</h4>
              {clinicalFeatures ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {CLINICAL_SECTIONS.map((section) => (
                    <div key={section.title} className="rounded-xl border border-border-glass p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-text-muted mb-3">{section.title}</p>
                      <div className="space-y-2">
                        {section.fields.filter((field) => clinicalFeatures[field] !== undefined && clinicalFeatures[field] !== null && clinicalFeatures[field] !== '').map((field) => (
                          <div key={String(field)} className="flex items-center justify-between gap-3">
                            <span className="text-text-muted">{FIELD_LABELS[String(field)] || String(field)}</span>
                            <span className="font-bold text-text-main text-right">{formatClinicalValue(field, clinicalFeatures[field])}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-text-muted">Clinical values were not included with this prediction.</p>}
            </Card>

            <Card className="p-6 bg-base border-border-glass">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Primary Clinical Drivers (SHAP)</h4>
              <div className="space-y-2.5">
                {prediction.shap_explanation.slice(0, 5).map((factor, i) => {
                  const isIncreasing = factor.impact_direction === 'Increases Risk';
                  return (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-base border border-border-glass text-sm">
                      <span className="font-black text-text-main">{factor.display_name}</span>
                      <div className="flex items-center gap-4"><span className="text-text-muted font-bold">Input: <span className="text-text-main">{factor.feature_value}</span></span><span className={`font-black ${isIncreasing ? 'text-danger-hover' : 'text-primary-hover'}`}>{factor.impact_direction} ({factor.shap_value > 0 ? '+' : ''}{factor.shap_value})</span></div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {prediction.gemini_interpretation && (
              <Card className="p-6 border border-primary/30 bg-primary/5 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-hover mb-2">AI Analysis</h4>
                <p className="text-text-main font-medium leading-relaxed bg-base p-4 rounded-xl border border-primary/20">{prediction.gemini_interpretation.risk_interpretation}</p>
                <div className="pt-4 border-t border-primary/20">
                  <p className="font-black text-primary-hover mb-3 text-sm">Follow-up Considerations</p>
                  <ul className="space-y-2 text-text-muted font-medium list-disc pl-5">
                    {prediction.gemini_interpretation.suggested_followup_considerations.map((item, i) => <li key={i} className="text-sm text-text-main">{item}</li>)}
                  </ul>
                </div>
              </Card>
            )}

            <div className="pt-8 border-t border-border-glass grid grid-cols-2 gap-12 text-sm">
              <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mb-8">Attending / Reviewer</p><div className="border-b-2 border-surface pb-2 font-black text-text-main text-lg">{prediction.clinician_name || 'Not recorded'}</div></div>
              <div><p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mb-8">Report Date</p><div className="border-b-2 border-surface pb-2 font-black text-text-main text-lg">{formatDate(new Date().toISOString())}</div></div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

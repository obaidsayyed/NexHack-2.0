from typing import Dict, Any, List
from app.services.patient_service import PatientService


class DashboardService:
    @staticmethod
    def get_stats() -> Dict[str, Any]:
        patients = PatientService.get_all()
        predictions = PatientService.get_predictions()

        high_risk_patients = [p for p in patients if p.get("last_risk_level") == "HIGH"]
        medium_risk_patients = [p for p in patients if p.get("last_risk_level") == "MEDIUM"]
        low_risk_patients = [p for p in patients if p.get("last_risk_level") == "LOW"]

        patients_with_scores = [p for p in patients if isinstance(p.get("last_risk_score"), (int, float))]
        if patients_with_scores:
            avg_risk = sum(p["last_risk_score"] for p in patients_with_scores) / len(patients_with_scores)
        else:
            avg_risk = 0.0

        high_risk_table = [
            {
                "patient_id": p["patient_id"],
                "patient_name": f"{p['first_name']} {p['last_name']}",
                "age": p.get("age", 65),
                "readmission_risk": p.get("last_risk_score", 75.0),
                "risk_level": p.get("last_risk_level", "HIGH"),
                "prediction_date": p.get("last_prediction_date") or p.get("updated_at", ""),
                "prediction_id": f"PRED-LATEST-{p['patient_id']}",
            }
            for p in high_risk_patients
        ]

        return {
            "total_patients": len(patients),
            "high_risk_patients": len(high_risk_patients),
            "predictions_made": len(predictions) if predictions else len(patients_with_scores),
            "avg_readmission_risk": round(avg_risk, 1),
            "recent_predictions": predictions[:5],
            "high_risk_table": high_risk_table,
            "risk_distribution": {
                "high": len(high_risk_patients),
                "medium": len(medium_risk_patients),
                "low": len(low_risk_patients),
            },
        }
